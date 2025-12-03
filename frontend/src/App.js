import React, { useState, useEffect } from 'react';
import './App.css';
import { Activity } from 'lucide-react';
import { WorkflowProvider } from './contexts/WorkflowContext';
import WorkflowList from './components/WorkflowList';
import WorkflowCanvas from './components/WorkflowCanvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'canvas'
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      await response.json();
      setLoading(false);
    } catch (error) {
      console.error('Health check failed:', error);
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
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
    setCurrentView('canvas');
  };

  const handleSelectWorkflow = (workflow) => {
    setCurrentWorkflow(workflow);
    setCurrentView('canvas');
  };

  const handleSaveWorkflow = async (workflowData) => {
    try {
      const method = workflowData.id ? 'PUT' : 'POST';
      const url = workflowData.id 
        ? `${BACKEND_URL}/api/workflows/${workflowData.id}`
        : `${BACKEND_URL}/api/workflows`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Workflow saved successfully!');
        if (!workflowData.id && result.id) {
          setCurrentWorkflow({ ...workflowData, id: result.id });
        }
      } else {
        alert('Failed to save workflow');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setCurrentWorkflow(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading LogicCanvas...</p>
        </div>
      </div>
    );
  }

  return (
    <WorkflowProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        {currentView === 'list' && (
          <header className="bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">LogicCanvas</h1>
                    <p className="text-xs text-slate-500">Visual Workflow Builder</p>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main>
          {currentView === 'list' ? (
            <WorkflowList 
              onSelectWorkflow={handleSelectWorkflow}
              onCreateNew={handleCreateNew}
            />
          ) : (
            <div className="relative">
              {/* Back Button */}
              <button
                onClick={handleBackToList}
                className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-white text-slate-700 px-4 py-2 rounded-lg shadow-md hover:bg-slate-50 transition-colors border border-slate-200"
                data-testid="back-to-list-btn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Workflows</span>
              </button>
              
              <WorkflowCanvas 
                workflow={currentWorkflow}
                onSave={handleSaveWorkflow}
              />
            </div>
          )}
        </main>
      </div>
    </WorkflowProvider>
  );
}

export default App;
