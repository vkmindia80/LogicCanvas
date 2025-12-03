import React, { createContext, useContext, useState, useCallback } from 'react';

const WorkflowContext = createContext();

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider = ({ children }) => {
  const [workflows, setWorkflows] = useState([]);
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const createNewWorkflow = useCallback(() => {
    const newWorkflow = {
      id: null,
      name: 'Untitled Workflow',
      description: '',
      nodes: [],
      edges: [],
      status: 'draft',
      version: 1,
      tags: []
    };
    setCurrentWorkflow(newWorkflow);
  }, []);

  const updateCurrentWorkflow = useCallback((updates) => {
    setCurrentWorkflow(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const addNode = useCallback((node) => {
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        nodes: [...prev.nodes, node]
      };
    });
  }, []);

  const updateNode = useCallback((nodeId, updates) => {
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        nodes: prev.nodes.map(node => 
          node.id === nodeId ? { ...node, ...updates } : node
        )
      };
    });
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        nodes: prev.nodes.filter(node => node.id !== nodeId),
        edges: prev.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
      };
    });
  }, []);

  const addEdge = useCallback((edge) => {
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        edges: [...prev.edges, edge]
      };
    });
  }, []);

  const deleteEdge = useCallback((edgeId) => {
    setCurrentWorkflow(prev => {
      if (!prev) return null;
      return {
        ...prev,
        edges: prev.edges.filter(edge => edge.id !== edgeId)
      };
    });
  }, []);

  const value = {
    workflows,
    setWorkflows,
    currentWorkflow,
    setCurrentWorkflow,
    selectedNode,
    setSelectedNode,
    isSaving,
    setIsSaving,
    createNewWorkflow,
    updateCurrentWorkflow,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};
