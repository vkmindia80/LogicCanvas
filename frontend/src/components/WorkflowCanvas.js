import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './nodes/CustomNode';
import NodePaletteSalesforce from './NodePaletteSalesforce';
import NodeEditor from './NodeEditor';
import ExecutionPanel from './ExecutionPanel';
import TriggerConfig from './TriggerConfig';
import DeletableEdge from './edges/DeletableEdge';
import { createNodeData } from '../utils/nodeTypes';
import { Save, Eye, Play, Layers, Zap, Sparkles, BookOpen, Activity, Undo2, Redo2, Variable, ZoomIn, ZoomOut, Maximize2, Download, Grid, Grid3x3, GitBranch, FileText } from 'lucide-react';
import VariablePanel from './VariablePanel';
import VariableInspector from './VariableInspector';
import VariableManagementPanel from './VariableManagementPanel';
import LifecyclePanel from './LifecyclePanel';
import VersionComparison from './VersionComparison';
import EditProtectionModal from './EditProtectionModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const nodeTypes = {
  // All node types use CustomNode component
  start: CustomNode,
  end: CustomNode,
  task: CustomNode,
  form: CustomNode,
  screen: CustomNode,
  wait: CustomNode,
  decision: CustomNode,
  switch: CustomNode,
  assignment: CustomNode,
  loop_for_each: CustomNode,
  loop_while: CustomNode,
  loop_repeat: CustomNode,
  approval: CustomNode,
  create_record: CustomNode,
  update_record: CustomNode,
  delete_record: CustomNode,
  lookup_record: CustomNode,
  query_records: CustomNode,
  get_record: CustomNode,
  transform: CustomNode,
  filter: CustomNode,
  sort: CustomNode,
  aggregate: CustomNode,
  calculate: CustomNode,
  parallel: CustomNode,
  merge: CustomNode,
  subprocess: CustomNode,
  action: CustomNode,
  api_call: CustomNode,
  webhook: CustomNode,
  email: CustomNode,
  timer: CustomNode,
  event: CustomNode,
  error_handler: CustomNode,
};

const WorkflowCanvas = ({ workflow, onSave, showTemplates, showWizard }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow');
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [showTriggerConfig, setShowTriggerConfig] = useState(false);
  const [showCapabilitiesPanel, setShowCapabilitiesPanel] = useState(false);
  const [activeInstance, setActiveInstance] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [validationRan, setValidationRan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showVariablePanel, setShowVariablePanel] = useState(false);
  const [showVariableInspector, setShowVariableInspector] = useState(false);
  
  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  // New Sprint 2 features
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isExporting, setIsExporting] = useState(false);

  // Sprint 3: Lifecycle & Version Management
  const [showLifecyclePanel, setShowLifecyclePanel] = useState(false);
  const [showVersionComparison, setShowVersionComparison] = useState(false);
  const [showEditProtection, setShowEditProtection] = useState(false);
  const [workflowState, setWorkflowState] = useState(workflow?.lifecycle_state || workflow?.status || 'draft');
  const [canEditDirectly, setCanEditDirectly] = useState(true);
  const [activeInstances, setActiveInstances] = useState(0);

  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);
  const nodeIdCounter = useRef(1);
  const autoSaveTimeoutRef = useRef(null);
  
  // Get React Flow instance
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();

  // Sync local nodes/edges/name when the workflow prop changes
  useEffect(() => {
    if (workflow) {
      setNodes(workflow.nodes || []);
      setEdges(workflow.edges || []);
      setWorkflowName(workflow.name || 'Untitled Workflow');
      setSelectedNode(null);
      setValidationResults(null);
      setValidationRan(false);
    }
  }, [workflow?.id, setNodes, setEdges]);

  const updateNodeStates = useCallback(
    (instance) => {
      setNodes((nds) =>
        nds.map((node) => {
          const nodeState = instance.node_states?.[node.id];
          const isCurrent = instance.current_node_id === node.id;

          let executionState = null;
          if (isCurrent) {
            executionState = 'running';
          } else if (nodeState === 'completed') {
            executionState = 'completed';
          } else if (nodeState === 'waiting') {
            executionState = 'waiting';
          } else if (nodeState === 'failed') {
            executionState = 'failed';
          }

          return {
            ...node,
            data: {
              ...node.data,
              executionState,
            },
          };
        }),
      );
    },
    [setNodes],
  );

  // Save current state to history (for undo/redo)
  const saveToHistory = useCallback(() => {
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
      return;
    }

    const currentState = {
      nodes,
      edges,
      workflowName,
      timestamp: Date.now()
    };

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);

    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
  }, [nodes, edges, workflowName, history, historyIndex, isUndoRedoAction]);

  // Track changes for undo/redo
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const timer = setTimeout(() => {
        saveToHistory();
      }, 500); // Debounce to avoid too many history entries
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, workflowName]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;

    setIsUndoRedoAction(true);
    const previousState = history[historyIndex - 1];
    
    setNodes(previousState.nodes);
    setEdges(previousState.edges);
    setWorkflowName(previousState.workflowName);
    setHistoryIndex(historyIndex - 1);
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    setIsUndoRedoAction(true);
    const nextState = history[historyIndex + 1];
    
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setWorkflowName(nextState.workflowName);
    setHistoryIndex(historyIndex + 1);
  }, [history, historyIndex, setNodes, setEdges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Poll for active instance execution state
  useEffect(() => {
    if (!workflow?.id || !activeInstance) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/workflow-instances/${activeInstance}`);
        if (!response.ok) return;
        const instance = await response.json();

        if (instance) {
          updateNodeStates(instance);

          // Stop polling if instance is no longer running
          if (!['running', 'waiting'].includes(instance.status)) {
            setActiveInstance(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch instance state:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [workflow?.id, activeInstance, updateNodeStates]);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'deletable',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#64748b',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = useCallback(
    (type) => {
      const newNode = {
        id: `node-${nodeIdCounter.current++}`,
        type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
        data: createNodeData(type),
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  const updateNode = useCallback(
    (nodeId, updates) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
      );
      setSelectedNode(null);
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges],
  );

  const applyValidationToNodes = useCallback(
    (issues) => {
      setNodes((nds) =>
        nds.map((node) => {
          const hasError = issues.some((i) => i.nodeId === node.id && i.type === 'error');
          const hasWarning = !hasError && issues.some((i) => i.nodeId === node.id && i.type === 'warning');

          return {
            ...node,
            data: {
              ...node.data,
              validationStatus: hasError ? 'error' : hasWarning ? 'warning' : null,
            },
          };
        }),
      );
    },
    [setNodes],
  );

  const clearValidationOnNodes = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          validationStatus: null,
        },
      })),
    );
  }, [setNodes]);

  const computeLocalValidationIssues = useCallback(() => {
    const issues = [];

    if (!nodes || nodes.length === 0) {
      issues.push({ type: 'error', message: 'Workflow has no nodes configured.' });
      return issues;
    }

    const edgesBySource = new Map();
    const edgesByTarget = new Map();

    edges.forEach((edge) => {
      if (!edgesBySource.has(edge.source)) edgesBySource.set(edge.source, []);
      edgesBySource.get(edge.source).push(edge);

      if (!edgesByTarget.has(edge.target)) edgesByTarget.set(edge.target, []);
      edgesByTarget.get(edge.target).push(edge);
    });

    const startNodes = nodes.filter((n) => n.type === 'start');
    const endNodes = nodes.filter((n) => n.type === 'end');

    if (startNodes.length === 0) {
      issues.push({ type: 'error', message: 'No Start node found. Add a Start node to begin the workflow.' });
    }
    if (startNodes.length > 1) {
      issues.push({
        type: 'warning',
        message: `Multiple Start nodes detected (${startNodes.length}). Ensure this is intentional.`,
      });
    }
    if (endNodes.length === 0) {
      issues.push({
        type: 'warning',
        message:
          'No End node found. Add at least one End node to properly terminate the workflow.',
      });
    }

    // Nodes with no outgoing edges (excluding End nodes)
    nodes.forEach((node) => {
      const outgoing = edgesBySource.get(node.id) || [];
      if (outgoing.length === 0 && node.type !== 'end') {
        issues.push({
          type: 'warning',
          message: `Node "${node.data?.label || node.id}" has no outgoing connections.`,
          nodeId: node.id,
        });
      }
    });

    // Decision nodes: ensure Yes/No branches
    nodes
      .filter((n) => n.type === 'decision')
      .forEach((node) => {
        const outgoing = edgesBySource.get(node.id) || [];
        const handles = new Set(
          outgoing
            .map((e) => e.sourceHandle || e.source_handle || '')
            .filter((id) => !!id),
        );

        if (!handles.has('yes')) {
          issues.push({
            type: 'warning',
            message: `Decision node "${node.data?.label || node.id}" is missing a 'Yes' branch.`,
            nodeId: node.id,
          });
        }
        if (!handles.has('no')) {
          issues.push({
            type: 'warning',
            message: `Decision node "${node.data?.label || node.id}" is missing a 'No' branch.`,
            nodeId: node.id,
          });
        }
      });

    // Unreachable nodes (from first Start node)
    if (startNodes.length > 0) {
      const startId = startNodes[0].id;
      const visited = new Set([startId]);
      const queue = [startId];

      while (queue.length > 0) {
        const current = queue.shift();
        const outgoing = edgesBySource.get(current) || [];
        outgoing.forEach((edge) => {
          if (!visited.has(edge.target)) {
            visited.add(edge.target);
            queue.push(edge.target);
          }
        });
      }

      nodes.forEach((node) => {
        if (!visited.has(node.id)) {
          issues.push({
            type: 'warning',
            message: `Node "${node.data?.label || node.id}" is unreachable from the Start node.`,
            nodeId: node.id,
          });
        }
      });
    }

    return issues;
  }, [nodes, edges]);

  const handleValidate = useCallback(async () => {
    const localIssues = computeLocalValidationIssues();
    let combinedIssues = [...localIssues];

    // Ask backend to run server-side validation as well (for persisted workflows)
    if (workflow?.id) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/workflows/${workflow.id}/validate`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.issues)) {
            combinedIssues = [...localIssues, ...data.issues];
          }
        }
      } catch (err) {
        console.error('Server-side validation failed:', err);
      }
    }

    setValidationResults(combinedIssues);
    setValidationRan(true);
    applyValidationToNodes(combinedIssues);
  }, [computeLocalValidationIssues, workflow?.id, applyValidationToNodes]);

  const buildCleanNodesForSave = () =>
    nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        // Do not persist client-only validation state
        validationStatus: undefined,
      },
    }));

  const handleSave = useCallback(
    async (isAuto = false) => {
      if (!onSave) return;

      const workflowData = {
        ...workflow,
        name: workflowName,
        nodes: buildCleanNodesForSave(),
        edges,
      };

      try {
        setIsSaving(true);
        await onSave(workflowData);
        setLastSavedAt(new Date());
      } catch (err) {
        if (!isAuto) {
          // For manual saves, surface error
          // eslint-disable-next-line no-alert
          alert('Failed to save workflow');
        }
        console.error('Failed to save workflow:', err);
      } finally {
        setIsSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSave, workflow, workflowName, nodes, edges],
  );

  // NOTE: Auto-save has been intentionally disabled.
  // Workflows are now saved **only** when the user clicks the explicit Save button.
  // If you want to re-enable auto-save in the future, restore the debounced
  // useEffect that called handleSave(true) on nodes/edges/name changes.

  const handleAutoLayout = useCallback(async () => {
    if (!workflow?.id) {
      // eslint-disable-next-line no-alert
      alert('Please save the workflow first');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflow.id}/auto-layout`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.nodes) {
        setNodes(data.nodes);
        // eslint-disable-next-line no-alert
        alert('Auto-layout applied');
      }
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(`Failed to apply auto-layout: ${error.message}`);
    }
  }, [workflow, setNodes]);

  const handleValidationPanelClose = () => {
    setValidationResults(null);
    setValidationRan(false);
    clearValidationOnNodes();
  };

  const formatLastSaved = () => {
    if (!lastSavedAt) return 'Unsaved changes';
    return `Last saved at ${lastSavedAt.toLocaleTimeString()}`;
  };

  // Sprint 2: Zoom Controls
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
    setTimeout(() => setZoomLevel(Math.round(getZoom() * 100)), 250);
  }, [zoomIn, getZoom]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
    setTimeout(() => setZoomLevel(Math.round(getZoom() * 100)), 250);
  }, [zoomOut, getZoom]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 200, padding: 0.2 });
    setTimeout(() => setZoomLevel(Math.round(getZoom() * 100)), 250);
  }, [fitView, getZoom]);

  // Sprint 2: Export to PNG with loading state
  const exportToPNG = useCallback(async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for UI feedback
      const canvasElement = reactFlowWrapper.current.querySelector('.react-flow');
      if (!canvasElement) {
        alert('Canvas not found');
        return;
      }

      const canvas = await html2canvas(canvasElement, {
        backgroundColor: '#f8fafc',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `${workflowName.replace(/\s+/g, '_')}_workflow.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to export PNG:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [workflowName]);

  // Sprint 2: Export to PDF with loading state
  const exportToPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for UI feedback
      const canvasElement = reactFlowWrapper.current.querySelector('.react-flow');
      if (!canvasElement) {
        alert('Canvas not found');
        return;
      }

      const canvas = await html2canvas(canvasElement, {
        backgroundColor: '#f8fafc',
        scale: 2,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${workflowName.replace(/\s+/g, '_')}_workflow.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [workflowName]);

  // Sprint 2: Grid snap toggle
  const toggleGridSnap = useCallback(() => {
    setSnapToGrid(!snapToGrid);
  }, [snapToGrid]);

  // Update zoom level on viewport change
  useEffect(() => {
    const updateZoom = () => {
      setZoomLevel(Math.round(getZoom() * 100));
    };
    updateZoom();
  }, [getZoom]);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar - Node Palette */}
      <div className="w-72 bg-white border-r-2 border-slate-300 shadow-lg overflow-hidden">
        <NodePaletteSalesforce 
          onAddNode={addNode} 
          lastNodeType={nodes[nodes.length - 1]?.type}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200 px-6 py-3 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4 flex-1">
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-xl font-bold text-slate-900 bg-white border-2 border-slate-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded-lg px-3 py-2 transition-all"
                placeholder="Workflow Name"
                data-testid="workflow-name-input"
              />
              <div className="flex items-center space-x-3 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {nodes.length} nodes
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                  {edges.length} connections
                </span>
              </div>
            </div>
            <span
              className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium"
              data-testid="workflow-save-status"
            >
              {isSaving ? '💾 Saving…' : formatLastSaved()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            {/* Left: Undo/Redo + Zoom + Grid + Template & AI Builder */}
            <div className="flex items-center space-x-2">
              {/* Undo/Redo */}
              <div className="flex items-center space-x-1 border-r border-slate-300 pr-2 mr-1">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Undo (Ctrl+Z)"
                  data-testid="undo-btn"
                >
                  <Undo2 className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Redo (Ctrl+Y)"
                  data-testid="redo-btn"
                >
                  <Redo2 className="w-4 h-4 text-slate-700" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 border-r border-slate-300 pr-2 mr-1">
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Zoom Out"
                  data-testid="zoom-out-btn"
                >
                  <ZoomOut className="w-4 h-4 text-slate-700" />
                </button>
                <div className="zoom-display min-w-[60px] text-center" title="Current zoom level">
                  {zoomLevel}%
                </div>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Zoom In"
                  data-testid="zoom-in-btn"
                >
                  <ZoomIn className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  onClick={handleFitView}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Fit to View"
                  data-testid="fit-view-btn"
                >
                  <Maximize2 className="w-4 h-4 text-slate-700" />
                </button>
              </div>

              {/* Grid Snap Toggle */}
              <button
                onClick={toggleGridSnap}
                className={`p-2 rounded-lg transition-all ${
                  snapToGrid 
                    ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
                title={snapToGrid ? 'Grid Snap: ON' : 'Grid Snap: OFF'}
                data-testid="grid-snap-toggle"
              >
                {snapToGrid ? <Grid3x3 className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>

              {/* Export Controls */}
              <div className="relative group">
                <button
                  className="flex items-center space-x-1 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Export Workflow"
                  data-testid="export-menu-btn"
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 text-slate-700" />
                </button>
                <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[140px] z-50 animate-slide-in">
                  <button
                    onClick={exportToPNG}
                    disabled={isExporting}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                    data-testid="export-png-btn"
                  >
                    Export as PNG
                  </button>
                  <button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                    data-testid="export-pdf-btn"
                  >
                    Export as PDF
                  </button>
                </div>
              </div>

              <div className="border-r border-slate-300 pr-2 mr-1 h-8" />

              {showTemplates && (
                <button
                  onClick={showTemplates}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
                  data-testid="show-templates-btn"
                  title="Browse templates"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Templates</span>
                </button>
              )}
              {showWizard && (
                <button
                  onClick={showWizard}
                  className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all font-medium"
                  data-testid="show-wizard-btn"
                  title="AI Builder"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Builder</span>
                </button>
              )}
            </div>

            {/* Right: Capabilities summary + core actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCapabilitiesPanel(true)}
                className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-primary-300"
                data-testid="designer-capabilities-btn"
                title="View all designer capabilities"
              >
                <Activity className="w-4 h-4 text-primary-500" />
                <span>Designer Capabilities</span>
              </button>
              <button
                onClick={() => setShowVariablePanel(!showVariablePanel)}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all font-medium"
                data-testid="variables-btn"
                title="Manage workflow variables"
              >
                <Variable className="w-4 h-4" />
                <span>Variables</span>
              </button>
              <button
                onClick={handleValidate}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all font-medium"
                data-testid="validate-workflow-btn"
                title="Validate workflow"
              >
                <Eye className="w-4 h-4" />
                <span>Validate</span>
              </button>
              <button
                onClick={() => setShowTriggerConfig(!showTriggerConfig)}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 font-medium"
                data-testid="trigger-config-btn"
                title="Configure triggers"
                disabled={!workflow?.id}
              >
                <Zap className="w-4 h-4" />
                <span>Triggers</span>
              </button>
              <button
                onClick={handleAutoLayout}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-medium"
                data-testid="auto-layout-btn"
                title="Auto-layout nodes"
              >
                <Layers className="w-4 h-4" />
                <span>Layout</span>
              </button>
              <button
                onClick={() => handleSave(false)}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all font-medium"
                data-testid="workflow-save-btn"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  if (!workflow?.id) {
                    // eslint-disable-next-line no-alert
                    alert('Please save the workflow before executing.');
                    return;
                  }
                  setShowExecutionPanel(!showExecutionPanel);
                  setShowTriggerConfig(false);
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
                data-testid="workflow-run-btn"
              >
                <Play className="w-4 h-4" />
                <span>Execute</span>
              </button>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={{ deletable: DeletableEdge }}
            fitView
            snapToGrid={snapToGrid}
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              animated: true,
              type: 'smoothstep',
              style: { 
                stroke: '#94a3b8', 
                strokeWidth: 2.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#64748b',
                width: 22,
                height: 22,
              },
            }}
            data-testid="workflow-canvas"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={15}
              size={1}
              color="#cbd5e1"
            />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(node) => {
                const colors = {
                  start: '#22c55e',
                  task: '#3b82f6',
                  decision: '#eab308',
                  approval: '#a855f7',
                  form: '#6366f1',
                  end: '#ef4444',
                  parallel: '#f97316',
                  merge: '#14b8a6',
                  action: '#ec4899',
                };
                return colors[node.type] || '#94a3b8';
              }}
              maskColor="rgba(0, 0, 0, 0.08)"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Right Sidebar - Node Editor */}
      {selectedNode && !showExecutionPanel && !showTriggerConfig && (
        <div className="w-80 bg-slate-100 border-l border-slate-200 p-4 overflow-y-auto">
          <NodeEditor
            node={selectedNode}
            onUpdate={updateNode}
            onDelete={deleteNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}

      {/* Execution Panel */}
      {showExecutionPanel && workflow?.id && (
        <ExecutionPanel
          workflowId={workflow.id}
          onClose={() => setShowExecutionPanel(false)}
          onInstanceStart={(instanceId) => setActiveInstance(instanceId)}
        />
      )}

      {/* Trigger Config Panel */}
      {showTriggerConfig && workflow?.id && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Workflow Triggers</h2>
            <button
              onClick={() => setShowTriggerConfig(false)}
              className="text-gray-500 hover:text-gray-700"
              data-testid="close-trigger-panel"
            >
              ✕
            </button>
          </div>
          <TriggerConfig workflowId={workflow.id} />
        </div>
      )}

      {/* Validation Results Panel */}
      {validationRan && validationResults && (
        <div className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl border border-gray-200 rounded-lg z-50 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Validation Results</h3>
            <button
              onClick={handleValidationPanelClose}
              className="text-gray-500 hover:text-gray-700"
              data-testid="close-validation-panel"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            {validationResults.length === 0 ? (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Workflow validation passed! No issues found.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {validationResults.map((issue, index) => (
                  <div
                    key={`${issue.message}-${issue.nodeId || 'global'}-${index}`}
                    className={`flex items-start space-x-2 p-3 rounded-lg ${
                      issue.type === 'error'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        issue.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          issue.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                        }`}
                      >
                        {issue.message}
                      </p>
                      {issue.nodeId && (
                        <button
                          onClick={() => {
                            const node = nodes.find((n) => n.id === issue.nodeId);
                            if (node) {
                              setSelectedNode(node);
                              handleValidationPanelClose();
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          data-testid="validation-go-to-node-btn"
                        >
                          Go to node
                        </button>
                      )}

      {/* Export Loading Overlay */}
      {isExporting && (
        <div className="export-overlay">
          <div className="text-center">
            <div className="export-spinner mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Exporting workflow...</p>
          </div>
        </div>
      )}

      {/* Designer Capabilities Panel */}
      {showCapabilitiesPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" data-testid="designer-capabilities-panel">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Workflow Designer Capabilities</h2>
                <p className="text-xs text-slate-300">Everything available in this workflow designer</p>
              </div>
              <button
                onClick={() => setShowCapabilitiesPanel(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5"
                data-testid="close-designer-capabilities"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {/* Core Components */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Core Components</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Canvas</span> – build & visualize workflows using the drag-and-drop editor.</li>
                    <li><span className="font-medium">Nodes</span> – represent tasks, forms, approvals, actions, and gateways.</li>
                    <li><span className="font-medium">Connectors</span> – define flow and logic paths between nodes.</li>
                  </ul>
                </div>

                {/* Logic & Data */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Logic & Data</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Logic Engine</span> – decision nodes with conditional routing via expressions.</li>
                    <li><span className="font-medium">Branching & Parallelism</span> – decision, parallel and merge gateways.</li>
                    <li><span className="font-medium">Data Mapping</span> – configure node inputs/outputs and variables in node editor.</li>
                    <li><span className="font-medium">Variables</span> – workflow instance data carried between nodes.</li>
                  </ul>
                </div>

                {/* Integrations & Triggers */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Integrations & Triggers</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Integrations</span> – Action nodes for HTTP calls, webhooks and scripts.</li>
                    <li><span className="font-medium">Connector Library</span> – categorized node palette for integrations & flow control.</li>
                    <li><span className="font-medium">Triggers</span> – manual, scheduled & webhook triggers in Trigger Config panel.</li>
                  </ul>
                </div>

                {/* Execution & Debugging */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Execution & Debugging</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Simulation</span> – run workflows from the Execution panel.</li>
                    <li><span className="font-medium">Debugger</span> – live node execution states and per-node history.</li>
                    <li><span className="font-medium">Run History</span> – workflow instances list with statuses and timelines.</li>
                  </ul>
                </div>

                {/* Management & Collaboration */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Management & Collaboration</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Version Control</span> – version history, snapshots & rollback per workflow.</li>
                    <li><span className="font-medium">Publishing</span> – draft, published, paused and archived workflow statuses.</li>
                    <li><span className="font-medium">Permissions</span> – role-based access (admin, builder, approver, viewer).</li>
                    <li><span className="font-medium">Collaboration</span> – shared environment with per-action audit logs.</li>
                  </ul>
                </div>

                {/* Monitoring & Audit */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Monitoring & Audit</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Analytics</span> – dashboards for throughput, SLAs, success rates and nodes.</li>
                    <li><span className="font-medium">KPIs & Dashboards</span> – workflow and user performance charts.</li>
                    <li><span className="font-medium">Audit Logs</span> – full activity history across workflows, tasks and approvals.</li>
                  </ul>
                </div>

                {/* Templates & AI */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Templates & AI Tools</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Templates</span> – reusable workflow templates from the Template Library.</li>
                    <li><span className="font-medium">AI Tools</span> – Quick Start Wizard / AI Builder to auto-generate workflows.</li>
                    <li><span className="font-medium">Subflows</span> – subprocess node type for composing larger orchestrations.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Designer Capabilities Panel */}
      {showCapabilitiesPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col" data-testid="designer-capabilities-panel">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Workflow Designer Capabilities</h2>
                <p className="text-xs text-slate-300">Everything available in this workflow designer</p>
              </div>
              <button
                onClick={() => setShowCapabilitiesPanel(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5"
                data-testid="close-designer-capabilities"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {/* Core Components */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Core Components</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Canvas</span> – build & visualize workflows using the drag-and-drop editor.</li>
                    <li><span className="font-medium">Nodes</span> – represent tasks, forms, approvals, actions, and gateways.</li>
                    <li><span className="font-medium">Connectors</span> – define flow and logic paths between nodes.</li>
                  </ul>
                </div>

                {/* Logic & Data */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Logic & Data</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Logic Engine</span> – decision nodes with conditional routing via expressions.</li>
                    <li><span className="font-medium">Branching & Parallelism</span> – decision, parallel and merge gateways.</li>
                    <li><span className="font-medium">Data Mapping</span> – configure node inputs/outputs and variables in node editor.</li>
                    <li><span className="font-medium">Variables</span> – workflow instance data carried between nodes.</li>
                  </ul>
                </div>

                {/* Integrations & Triggers */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Integrations & Triggers</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Integrations</span> – Action nodes for HTTP calls, webhooks and scripts.</li>
                    <li><span className="font-medium">Connector Library</span> – categorized node palette for integrations & flow control.</li>
                    <li><span className="font-medium">Triggers</span> – manual, scheduled & webhook triggers in Trigger Config panel.</li>
                  </ul>
                </div>

                {/* Execution & Debugging */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Execution & Debugging</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Simulation</span> – run workflows from the Execution panel.</li>
                    <li><span className="font-medium">Debugger</span> – live node execution states and per-node history.</li>
                    <li><span className="font-medium">Run History</span> – workflow instances list with statuses and timelines.</li>
                  </ul>
                </div>

                {/* Management & Collaboration */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Management & Collaboration</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Version Control</span> – version history, snapshots & rollback per workflow.</li>
                    <li><span className="font-medium">Publishing</span> – draft, published, paused and archived workflow statuses.</li>
                    <li><span className="font-medium">Permissions</span> – role-based access (admin, builder, approver, viewer).</li>
                    <li><span className="font-medium">Collaboration</span> – shared environment with per-action audit logs.</li>
                  </ul>
                </div>

                {/* Monitoring & Audit */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Monitoring & Audit</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Analytics</span> – dashboards for throughput, SLAs, success rates and nodes.</li>
                    <li><span className="font-medium">KPIs & Dashboards</span> – workflow and user performance charts.</li>
                    <li><span className="font-medium">Audit Logs</span> – full activity history across workflows, tasks and approvals.</li>
                  </ul>
                </div>

                {/* Templates & AI */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">Templates & AI Tools</h3>
                  <ul className="space-y-1 text-slate-700 text-xs">
                    <li><span className="font-medium">Templates</span> – reusable workflow templates from the Template Library.</li>
                    <li><span className="font-medium">AI Tools</span> – Quick Start Wizard / AI Builder to auto-generate workflows.</li>
                    <li><span className="font-medium">Subflows</span> – subprocess node type for composing larger orchestrations.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowCanvas;
