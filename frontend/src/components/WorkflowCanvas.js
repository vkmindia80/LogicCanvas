import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './nodes/CustomNode';
import NodePalette from './NodePalette';
import NodeEditor from './NodeEditor';
import ExecutionPanel from './ExecutionPanel';
import TriggerConfig from './TriggerConfig';
import DeletableEdge from './edges/DeletableEdge';
import { createNodeData } from '../utils/nodeTypes';
import { Save, Eye, Play, Layers, Zap } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const nodeTypes = {
  start: CustomNode,
  task: CustomNode,
  decision: CustomNode,
  approval: CustomNode,
  form: CustomNode,
  end: CustomNode,
  parallel: CustomNode,
  merge: CustomNode,
  action: CustomNode
};

const WorkflowCanvas = ({ workflow, onSave }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow');
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [showTriggerConfig, setShowTriggerConfig] = useState(false);
  const [activeInstance, setActiveInstance] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [validationRan, setValidationRan] = useState(false);
  const reactFlowWrapper = useRef(null);
  const nodeIdCounter = useRef(1);

  const updateNodeStates = useCallback((instance) => {
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
            executionState
          }
        };
      })
    );
  }, [setNodes]);

  // Poll for active instance execution state
  useEffect(() => {
    if (!workflow?.id || !activeInstance) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/workflow-instances/${activeInstance}`);
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
          color: '#64748b'
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
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
        type: type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100
        },
        data: createNodeData(type)
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const updateNode = useCallback(
    (nodeId, updates) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, ...updates } : node))
      );
      setSelectedNode(null);
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleSave = useCallback(async () => {
    const workflowData = {
      ...workflow,
      name: workflowName,
      nodes: nodes,
      edges: edges
    };
    await onSave(workflowData);
  }, [workflow, workflowName, nodes, edges, onSave]);

  const handleAutoLayout = useCallback(async () => {
    if (!workflow?.id) {
      alert('Please save the workflow first');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflow.id}/auto-layout`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.nodes) {
        setNodes(data.nodes);
        alert('Auto-layout applied');
      }
    } catch (error) {
      alert('Failed to apply auto-layout: ' + error.message);
    }
  }, [workflow, setNodes]);

  const handleValidate = useCallback(() => {
    const issues = [];

    if (!nodes || nodes.length === 0) {
      issues.push({ type: 'error', message: 'Workflow has no nodes configured.' });
    } else {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
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
      if (endNodes.length === 0) {
        issues.push({ type: 'warning', message: 'No End node found. Add at least one End node to properly terminate the workflow.' });
      }

      // Nodes with no outgoing edges (excluding End nodes)
      nodes.forEach((node) => {
        const outgoing = edgesBySource.get(node.id) || [];
        if (outgoing.length === 0 && node.type !== 'end') {
          issues.push({
            type: 'warning',
            message: `Node "${node.data?.label || node.id}" has no outgoing connections.`,
            nodeId: node.id
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
              .filter((id) => !!id)
          );

          if (!handles.has('yes')) {
            issues.push({
              type: 'warning',
              message: `Decision node "${node.data?.label || node.id}" is missing a 'Yes' branch.`,
              nodeId: node.id
            });
          }
          if (!handles.has('no')) {
            issues.push({
              type: 'warning',
              message: `Decision node "${node.data?.label || node.id}" is missing a 'No' branch.`,
              nodeId: node.id
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
              nodeId: node.id
            });
          }
        });
      }
    }

    setValidationResults(issues);
    setValidationRan(true);
  }, [nodes, edges]);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar - Node Palette */}
      <div className="w-64 bg-slate-100 border-r border-slate-200 p-4 overflow-y-auto">
        <NodePalette onAddNode={addNode} />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4 flex-1">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-xl font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
              placeholder="Workflow Name"
              data-testid="workflow-name-input"
            />
            <span className="text-sm text-slate-500">|
              {nodes.length} nodes, {edges.length} connections
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleValidate}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              data-testid="validate-workflow-btn"
              title="Validate workflow"
            >
              <Eye className="w-4 h-4" />
              <span>Validate</span>
            </button>
            <button
              onClick={() => setShowTriggerConfig(!showTriggerConfig)}
              className="flex items-center space-x-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
              data-testid="trigger-config-btn"
              title="Configure triggers"
              disabled={!workflow?.id}
            >
              <Zap className="w-4 h-4" />
              <span>Triggers</span>
            </button>
            <button
              onClick={handleAutoLayout}
              className="flex items-center space-x-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
              data-testid="auto-layout-btn"
              title="Auto-layout nodes"
            >
              <Layers className="w-4 h-4" />
              <span>Auto-Layout</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              data-testid="workflow-save-btn"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={() => {
                setShowExecutionPanel(!showExecutionPanel);
                setShowTriggerConfig(false);
              }}
              className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              data-testid="workflow-run-btn"
            >
              <Play className="w-4 h-4" />
              <span>Execute</span>
            </button>
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
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#94a3b8', strokeWidth: 2 },
              markerEnd: {
                type: 'arrowclosed'
              }
            }}
            data-testid="workflow-canvas"
          >
            <Background variant={BackgroundVariant.Dots} gap={15} size={1} color="#cbd5e1" />
            <Controls />
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
                  merge: '#14b8a6'
                };
                return colors[node.type] || '#94a3b8';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
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
              onClick={() => {
                setValidationResults(null);
                setValidationRan(false);
              }}
              className="text-gray-500 hover:text-gray-700"
              data-testid="close-validation-panel"
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            {validationResults.length === 0 ? (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Workflow validation passed! No issues found.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {validationResults.map((issue, index) => (
                  <div
                    key={index}
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
                    ></div>
                    <div className="flex-1">
                      <p className={`text-sm ${
                        issue.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {issue.message}
                      </p>
                      {issue.nodeId && (
                        <button
                          onClick={() => {
                            const node = nodes.find(n => n.id === issue.nodeId);
                            if (node) {
                              setSelectedNode(node);
                              setValidationResults(null);
                              setValidationRan(false);
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Go to node
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowCanvas;
