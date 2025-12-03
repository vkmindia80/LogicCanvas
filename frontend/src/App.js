import React, { useState, useEffect } from 'react';
import './App.css';
import { Activity, CheckCircle, Server } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      const data = await response.json();
      setHealthStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({ status: 'error', message: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
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
            
            {/* Health Status Badge */}
            <div className="flex items-center space-x-2">
              {loading ? (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-yellow-700">Connecting...</span>
                </div>
              ) : healthStatus?.status === 'healthy' ? (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-700">System Healthy</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium text-red-700">Connection Error</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-6 shadow-lg">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to LogicCanvas
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Enterprise-grade visual workflow builder with drag-and-drop canvas, 
            advanced task management, and real-time execution engine.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Backend Status */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
              {healthStatus?.status === 'healthy' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center">
                  <span className="text-red-500 text-xs font-bold">✕</span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Backend API</h3>
            <p className="text-sm text-slate-600">
              {healthStatus?.status === 'healthy' 
                ? 'FastAPI server running on port 8001' 
                : 'Backend not connected'}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Status: <span className={`font-semibold ${healthStatus?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                  {healthStatus?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              {healthStatus?.database === 'connected' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center">
                  <span className="text-red-500 text-xs font-bold">✕</span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">MongoDB Database</h3>
            <p className="text-sm text-slate-600">
              {healthStatus?.database === 'connected' 
                ? 'Connected and ready' 
                : 'Database not connected'}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Status: <span className={`font-semibold ${healthStatus?.database === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                  {healthStatus?.database || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Frontend Status */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">React Frontend</h3>
            <p className="text-sm text-slate-600">
              Running on port 3000
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Status: <span className="font-semibold text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Phase 1: Foundation Complete ✅</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Backend API Setup</h4>
                <p className="text-sm text-slate-600">FastAPI with MongoDB, comprehensive REST endpoints for workflows, forms, tasks, and approvals</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Frontend Framework</h4>
                <p className="text-sm text-slate-600">React with Tailwind CSS, React Flow for canvas, Lucide icons, and Recharts for analytics</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Database Collections</h4>
                <p className="text-sm text-slate-600">MongoDB with 8 collections: workflows, instances, forms, submissions, tasks, approvals, notifications, audit logs</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">API Connectivity</h4>
                <p className="text-sm text-slate-600">Frontend-backend communication established with health checks and CORS configuration</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 p-6 bg-primary-50 border border-primary-200 rounded-lg">
            <h4 className="font-semibold text-primary-900 mb-3 flex items-center">
              <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm mr-3">→</span>
              Next: Phase 2 - Core Workflow Canvas
            </h4>
            <p className="text-sm text-primary-700 ml-11">
              Building the visual workflow canvas with drag-and-drop nodes, React Flow integration, 
              8 node types (Start, Task, Decision, Approval, Form, End, Parallel, Merge), 
              intelligent connectors, and mini-map navigation.
            </p>
          </div>
        </div>

        {/* API Test Section */}
        <div className="mt-8 bg-slate-800 rounded-xl shadow-md p-6 text-white">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            API Endpoints Ready
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
            <div className="bg-slate-700 p-3 rounded">
              <span className="text-green-400">GET</span> /api/health
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <span className="text-blue-400">GET</span> /api/workflows
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <span className="text-yellow-400">POST</span> /api/workflows
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <span className="text-blue-400">GET</span> /api/forms
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <span className="text-blue-400">GET</span> /api/tasks
            </div>
            <div className="bg-slate-700 p-3 rounded">
              <span className="text-blue-400">GET</span> /api/approvals
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            LogicCanvas - Enterprise Visual Workflow Builder | Phase 1 Complete
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
