import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { modernButtonStyles, modernBadgeStyles, modernCardStyles } from '../utils/modernDesignSystem';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ExecutionPanel = ({ workflowId, onClose, onInstanceStart }) => {
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInstances = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflow-instances?workflow_id=${workflowId}`);
      const data = await response.json();
      setInstances(data.instances || []);
      
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

  useEffect(() => {
    loadInstances();
    const interval = setInterval(loadInstances, 3000);
    return () => clearInterval(interval);
  }, [workflowId]);

  const handleExecute = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      
      if (data.instance_id && onInstanceStart) {
        onInstanceStart(data.instance_id);
      }
      
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
      case 'running': return <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-amber-600" />;
      case 'waiting': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <>
      {/* Mobile/Tablet: Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
        data-testid="execution-panel-backdrop"
      />
      
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 lg:w-96 xl:w-[28rem] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 border-b border-indigo-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Workflow Execution</h2>
            <p className="text-xs text-indigo-200 mt-0.5">Run and monitor workflow instances</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
            data-testid="close-execution-panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleExecute}
          className="w-full bg-white text-indigo-700 px-4 py-3 rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl font-semibold"
          data-testid="execute-workflow-button"
        >
          <Play className="w-5 h-5" />
          Run Workflow
        </button>
      </div>

      {/* Instance List */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-slate-600">Loading instances...</p>
          </div>
        ) : instances.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-600 font-medium">No executions yet</p>
            <p className="text-sm text-slate-500 mt-1">Click "Run Workflow" to start</p>
          </div>
        ) : (
          <div className="space-y-3">
            {instances.map((instance) => (
              <div
                key={instance.id}
                className={`${
                  selectedInstance?.id === instance.id
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-white'
                } border rounded-xl p-4 cursor-pointer transition-all shadow-sm hover:shadow-md`}
                onClick={() => setSelectedInstance(instance)}
                data-testid={`instance-${instance.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(instance.status)}
                    <span className={modernBadgeStyles[instance.status] || modernBadgeStyles.pending}>
                      {instance.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {new Date(instance.started_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Triggered by:</span>
                    <span className="font-medium">{instance.triggered_by}</span>
                  </div>
                  {instance.current_node_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Current node:</span>
                      <span className="font-mono text-indigo-600">{instance.current_node_id.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>

                {/* Control Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                  {instance.status === 'running' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePause(instance.id);
                      }}
                      className="flex-1 text-xs bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 flex items-center justify-center gap-1.5 font-medium transition-all"
                      data-testid={`pause-instance-${instance.id}`}
                    >
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}
                  {instance.status === 'paused' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResume(instance.id);
                      }}
                      className="flex-1 text-xs bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-1.5 font-medium transition-all"
                      data-testid={`resume-instance-${instance.id}`}
                    >
                      <Play className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}
                  {['running', 'paused', 'waiting'].includes(instance.status) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(instance.id);
                      }}
                      className="flex-1 text-xs bg-rose-500 text-white px-3 py-2 rounded-lg hover:bg-rose-600 flex items-center justify-center gap-1.5 font-medium transition-all"
                      data-testid={`cancel-instance-${instance.id}`}
                    >
                      <Square className="w-3.5 h-3.5" /> Cancel
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
        <div className="border-t border-slate-200 p-4 bg-white max-h-64 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-3 text-slate-900">Execution History</h3>
          <div className="space-y-2">
            {selectedInstance.execution_history?.map((entry, idx) => (
              <div key={idx} className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-900">{entry.node_type}</span>
                  <span className={modernBadgeStyles[entry.result?.status] || modernBadgeStyles.pending}>
                    {entry.result?.status || 'unknown'}
                  </span>
                </div>
                <div className="text-slate-500">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
                {entry.result?.error && (
                  <div className="text-rose-600 mt-2 text-xs bg-rose-50 p-2 rounded border border-rose-200">
                    {entry.result.error}
                  </div>
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
