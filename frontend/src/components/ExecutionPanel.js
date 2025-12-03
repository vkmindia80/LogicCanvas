import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ExecutionPanel = ({ workflowId, onClose }) => {
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstances();
    const interval = setInterval(loadInstances, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [workflowId]);

  const loadInstances = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflow-instances?workflow_id=${workflowId}`);
      const data = await response.json();
      setInstances(data.instances || []);
      
      // Update selected instance if still loading
      if (selectedInstance) {
        const updated = data.instances.find(i => i.id === selectedInstance.id);
        if (updated) {
          setSelectedInstance(updated);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load instances:', error);
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      alert(data.message);
      loadInstances();
    } catch (error) {
      alert('Failed to start execution: ' + error.message);
    }
  };

  const handlePause = async (instanceId) => {
    try {
      await fetch(`${BACKEND_URL}/api/workflow-instances/${instanceId}/pause`, {
        method: 'POST'
      });
      loadInstances();
    } catch (error) {
      alert('Failed to pause: ' + error.message);
    }
  };

  const handleResume = async (instanceId) => {
    try {
      await fetch(`${BACKEND_URL}/api/workflow-instances/${instanceId}/resume`, {
        method: 'POST'
      });
      loadInstances();
    } catch (error) {
      alert('Failed to resume: ' + error.message);
    }
  };

  const handleCancel = async (instanceId) => {
    if (!window.confirm('Are you sure you want to cancel this execution?')) return;
    
    try {
      await fetch(`${BACKEND_URL}/api/workflow-instances/${instanceId}/cancel`, {
        method: 'POST'
      });
      loadInstances();
    } catch (error) {
      alert('Failed to cancel: ' + error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'waiting': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'waiting': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Workflow Execution</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            data-testid="close-execution-panel"
          >
            ✕
          </button>
        </div>
        <button
          onClick={handleExecute}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          data-testid="execute-workflow-button"
        >
          <Play className="w-4 h-4" />
          Run Workflow
        </button>
      </div>

      {/* Instance List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No executions yet</p>
            <p className="text-sm mt-1">Click "Run Workflow" to start</p>
          </div>
        ) : (
          <div className="space-y-3">
            {instances.map((instance) => (
              <div
                key={instance.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedInstance?.id === instance.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedInstance(instance)}
                data-testid={`instance-${instance.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(instance.status)}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(instance.status)}`}>
                      {instance.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(instance.started_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div>Triggered: {instance.triggered_by}</div>
                  {instance.current_node_id && (
                    <div className="text-blue-600">Current: {instance.current_node_id.slice(0, 8)}...</div>
                  )}
                </div>

                {/* Control Buttons */}
                <div className="flex gap-2 mt-2">
                  {instance.status === 'running' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePause(instance.id);
                      }}
                      className="flex-1 text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 flex items-center justify-center gap-1"
                      data-testid={`pause-instance-${instance.id}`}
                    >
                      <Pause className="w-3 h-3" /> Pause
                    </button>
                  )}
                  {instance.status === 'paused' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResume(instance.id);
                      }}
                      className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center justify-center gap-1"
                      data-testid={`resume-instance-${instance.id}`}
                    >
                      <Play className="w-3 h-3" /> Resume
                    </button>
                  )}
                  {['running', 'paused', 'waiting'].includes(instance.status) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(instance.id);
                      }}
                      className="flex-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center justify-center gap-1"
                      data-testid={`cancel-instance-${instance.id}`}
                    >
                      <Square className="w-3 h-3" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Instance Details */}
      {selectedInstance && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">Execution History</h3>
          <div className="space-y-2">
            {selectedInstance.execution_history?.map((entry, idx) => (
              <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{entry.node_type}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(entry.result?.status || 'unknown')}`}>
                    {entry.result?.status || 'unknown'}
                  </span>
                </div>
                <div className="text-gray-500 mt-1">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
                {entry.result?.error && (
                  <div className="text-red-600 mt-1 text-xs">{entry.result.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionPanel;