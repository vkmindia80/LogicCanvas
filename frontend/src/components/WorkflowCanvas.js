import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './nodes/CustomNode';
import NodePalette from './NodePalette';
import NodeEditor from './NodeEditor';
import { createNodeData } from '../utils/nodeTypes';
import { Save, Eye, Play } from 'lucide-react';

const nodeTypes = {
  start: CustomNode,
  task: CustomNode,
  decision: CustomNode,
  approval: CustomNode,
  form: CustomNode,
  end: CustomNode,
  parallel: CustomNode,
  merge: CustomNode
};

const WorkflowCanvas = ({ workflow, onSave }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow');
  const reactFlowWrapper = useRef(null);
  const nodeIdCounter = useRef(1);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 }
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
              onClick={handleSave}
              className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              data-testid="workflow-save-btn"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              data-testid="workflow-preview-btn"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              data-testid="workflow-run-btn"
            >
              <Play className="w-4 h-4" />
              <span>Run</span>
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
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#94a3b8', strokeWidth: 2 }
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
      {selectedNode && (
        <div className="w-80 bg-slate-100 border-l border-slate-200 p-4 overflow-y-auto">
          <NodeEditor
            node={selectedNode}
            onUpdate={updateNode}
            onDelete={deleteNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}
    </div>
  );
};

export default WorkflowCanvas;
