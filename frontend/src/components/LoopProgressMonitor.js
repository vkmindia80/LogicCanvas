import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader, CheckCircle, XCircle, AlertCircle, TrendingUp, Activity } from 'lucide-react';

/**
 * Loop Progress Monitor Component
 * Phase 3.2: Real-time loop progress visualization
 * Shows active loops, progress, and statistics
 */

const LoopProgressMonitor = ({ instanceId, onClose }) => {
  const [loopStatus, setLoopStatus] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState(null);

  const fetchLoopStatus = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/workflow-instances/${instanceId}/loop-status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch loop status');
      }
      
      const data = await response.json();
      setLoopStatus(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/workflow-instances/${instanceId}/loop/statistics`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleBreakLoop = async (loopId) => {
    if (!window.confirm('Are you sure you want to break this loop?')) {
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/workflow-instances/${instanceId}/loop/break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loop_id: loopId,
          reason: 'Manual break by user'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to break loop');
      }

      alert('Loop break requested successfully');
      fetchLoopStatus();
    } catch (err) {
      alert('Error breaking loop: ' + err.message);
    }
  };

  useEffect(() => {
    fetchLoopStatus();
    fetchStatistics();
  }, [instanceId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLoopStatus();
      fetchStatistics();
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, instanceId]);

  const getLoopTypeIcon = (loopType) => {
    switch (loopType) {
      case 'for_each':
        return '🔁';
      case 'while':
        return '🔄';
      case 'do_while':
        return '↩️';
      case 'repeat':
        return '🔢';
      default:
        return '⚙️';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-slate-600">Loading loop status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Loop Progress Monitor</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="text-purple-100 mt-2 text-sm">Instance: {instanceId}</p>
        </div>

        {/* Controls */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                fetchLoopStatus();
                fetchStatistics();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Now</span>
            </button>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-slate-700">Auto-refresh (2s)</span>
            </label>
          </div>
          
          <div className="text-sm text-slate-600">
            {loopStatus?.active_loops?.length || 0} active loop(s)
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Active Loops */}
          {loopStatus?.active_loops && loopStatus.active_loops.length > 0 ? (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span>Active Loops</span>
              </h3>
              
              <div className="space-y-4">
                {loopStatus.active_loops.map((loop, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 ${getStatusColor(loop.status)}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{getLoopTypeIcon(loop.loop_type)}</span>
                        <div>
                          <h4 className="font-bold text-lg capitalize">
                            {loop.loop_type.replace('_', '-')} Loop
                          </h4>
                          <p className="text-xs opacity-75">ID: {loop.loop_id}</p>
                        </div>
                      </div>
                      
                      {loop.status === 'active' && (
                        <button
                          onClick={() => handleBreakLoop(loop.loop_id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                        >
                          Break Loop
                        </button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {loop.progress_percentage !== undefined && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold">
                            Progress: {loop.current_iteration} / {loop.total_items}
                          </span>
                          <span className="font-bold">
                            {Math.round(loop.progress_percentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-white bg-opacity-50 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${Math.min(100, loop.progress_percentage)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="opacity-75">Status:</span>
                        <span className="ml-2 font-semibold capitalize">{loop.status}</span>
                      </div>
                      <div>
                        <span className="opacity-75">Max Iterations:</span>
                        <span className="ml-2 font-semibold">{loop.max_iterations}</span>
                      </div>
                      {loop.items_remaining !== undefined && (
                        <div>
                          <span className="opacity-75">Items Remaining:</span>
                          <span className="ml-2 font-semibold">{loop.items_remaining}</span>
                        </div>
                      )}
                      <div>
                        <span className="opacity-75">Started:</span>
                        <span className="ml-2 font-semibold">
                          {loop.started_at ? new Date(loop.started_at).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Loops</h3>
              <p className="text-slate-600">
                This workflow instance doesn't have any active loops at the moment.
              </p>
            </div>
          )}

          {/* Statistics */}
          {statistics?.loop_statistics && statistics.loop_statistics.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span>Loop Statistics</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statistics.loop_statistics.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-2xl">{getLoopTypeIcon(stat.loop_type)}</span>
                      <h4 className="font-bold capitalize">{stat.loop_type.replace('_', '-')} Loop</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Iterations:</span>
                        <span className="font-semibold">{stat.total_iterations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Successful:</span>
                        <span className="font-semibold text-green-600">{stat.successful_iterations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Failed:</span>
                        <span className="font-semibold text-red-600">{stat.failed_iterations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Breaks:</span>
                        <span className="font-semibold text-orange-600">{stat.breaks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Continues:</span>
                        <span className="font-semibold text-blue-600">{stat.continues}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoopProgressMonitor;
