import React, { useState, useEffect } from 'react';
import {
  Play, Pause, SkipForward, X, Circle, ChevronRight,
  AlertCircle, Info, Clock, Zap, Activity, Eye, Filter, Download
} from 'lucide-react';

const DebugPanel = ({ instanceId, onClose }) => {
  const [activeTab, setActiveTab] = useState('breakpoints'); // breakpoints, timeline, logs, performance, watch
  const [debugState, setDebugState] = useState(null);
  const [breakpoints, setBreakpoints] = useState([]);
  const [logs, setLogs] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [watchVariables, setWatchVariables] = useState([]);
  const [logFilter, setLogFilter] = useState('all'); // all, debug, info, warning, error

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    if (instanceId) {
      fetchDebugState();
      fetchBreakpoints();
      fetchLogs();
      fetchTimeline();
      fetchPerformance();

      // Poll for updates every 2 seconds
      const interval = setInterval(() => {
        fetchDebugState();
        fetchLogs();
        fetchTimeline();
        fetchPerformance();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [instanceId]);

  const fetchDebugState = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/debug/state`);
      const data = await response.json();
      setDebugState(data);
    } catch (error) {
      console.error('Failed to fetch debug state:', error);
    }
  };

  const fetchBreakpoints = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/breakpoints`);
      const data = await response.json();
      setBreakpoints(data.breakpoints || []);
    } catch (error) {
      console.error('Failed to fetch breakpoints:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const url = logFilter !== 'all'
        ? `${BACKEND_URL}/api/instances/${instanceId}/logs?level=${logFilter}`
        : `${BACKEND_URL}/api/instances/${instanceId}/logs`;
      const response = await fetch(url);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/debug/timeline`);
      const data = await response.json();
      setTimeline(data.timeline || []);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/performance`);
      const data = await response.json();
      setPerformance(data);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    }
  };

  const handlePlay = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/instances/${instanceId}/debug/continue`, {
        method: 'POST'
      });
      fetchDebugState();
    } catch (error) {
      console.error('Failed to continue execution:', error);
    }
  };

  const handlePause = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/instances/${instanceId}/debug/pause`, {
        method: 'POST'
      });
      fetchDebugState();
    } catch (error) {
      console.error('Failed to pause execution:', error);
    }
  };

  const handleStep = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/instances/${instanceId}/debug/step`, {
        method: 'POST'
      });
      fetchDebugState();
      fetchLogs();
    } catch (error) {
      console.error('Failed to step execution:', error);
    }
  };

  const toggleBreakpoint = async (nodeId) => {
    const existing = breakpoints.find(bp => bp.node_id === nodeId);

    if (existing) {
      // Remove breakpoint
      try {
        await fetch(`${BACKEND_URL}/api/instances/${instanceId}/breakpoints/${nodeId}`, {
          method: 'DELETE'
        });
        fetchBreakpoints();
      } catch (error) {
        console.error('Failed to remove breakpoint:', error);
      }
    } else {
      // Add breakpoint
      try {
        await fetch(`${BACKEND_URL}/api/instances/${instanceId}/breakpoints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            node_id: nodeId,
            enabled: true,
            condition: null
          })
        });
        fetchBreakpoints();
      } catch (error) {
        console.error('Failed to add breakpoint:', error);
      }
    }
  };

  const downloadLogs = () => {
    const logsText = logs.map(log =>
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.node_id}] ${log.message}`
    ).join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-logs-${instanceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Debug Panel</h2>
            <p className="text-sm text-gray-500">Instance: {instanceId}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Debug Controls */}
            <button
              onClick={handlePlay}
              disabled={debugState?.debug_action === 'continue'}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              title="Continue (Run until next breakpoint)"
            >
              <Play size={16} />
            </button>
            <button
              onClick={handlePause}
              disabled={debugState?.debug_action === 'pause'}
              className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              title="Pause execution"
            >
              <Pause size={16} />
            </button>
            <button
              onClick={handleStep}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Step to next node"
            >
              <SkipForward size={16} />
            </button>
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {debugState && (
          <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Status: <span className="font-medium">{debugState.status}</span>
              </span>
              {debugState.debug_mode && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Debug Mode: {debugState.debug_action || 'Active'}
                </span>
              )}
              {debugState.current_node && (
                <span className="text-gray-600">
                  Current: <span className="font-medium">{debugState.current_node}</span>
                </span>
              )}
            </div>
            <div className="text-gray-600">
              Breakpoints: <span className="font-medium">{breakpoints.length}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b px-4">
          {[
            { id: 'breakpoints', label: 'Breakpoints', icon: Circle },
            { id: 'timeline', label: 'Timeline', icon: Activity },
            { id: 'logs', label: 'Logs', icon: Eye },
            { id: 'performance', label: 'Performance', icon: Zap },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-3 font-medium flex items-center gap-2 ${
                activeTab === id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Breakpoints Tab */}
          {activeTab === 'breakpoints' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Breakpoints</h3>
                <p className="text-sm text-gray-500">
                  Click on workflow nodes to add/remove breakpoints
                </p>
              </div>

              {breakpoints.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Circle size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No breakpoints set</p>
                  <p className="text-sm mt-1">
                    Add breakpoints by clicking on nodes in the workflow canvas
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {breakpoints.map((bp, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Circle
                            size={16}
                            className={bp.enabled ? 'fill-red-600 text-red-600' : 'text-gray-400'}
                          />
                          <div>
                            <div className="font-medium">Node: {bp.node_id}</div>
                            {bp.condition && (
                              <div className="text-sm text-gray-500 mt-1">
                                Condition: {bp.condition}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleBreakpoint(bp.node_id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Execution Timeline</h3>
                <div className="text-sm text-gray-500">
                  {timeline.length} steps
                </div>
              </div>

              {timeline.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No execution history yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {timeline.map((entry, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          getStatusColor(entry.status)
                        }`}>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{entry.node_label || entry.node_id}</div>
                            <div className="text-sm text-gray-500">{entry.node_type}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getStatusColor(entry.status)} px-2 py-1 rounded`}>
                              {entry.status}
                            </div>
                            {entry.duration_seconds !== undefined && (
                              <div className="text-xs text-gray-500 mt-1">
                                {entry.duration_seconds.toFixed(3)}s
                              </div>
                            )}
                          </div>
                        </div>
                        {entry.error && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                            <AlertCircle size={14} className="inline mr-1" />
                            {entry.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Execution Logs</h3>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-500" />
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="px-3 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                  <button
                    onClick={downloadLogs}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Download size={16} className="inline mr-1" />
                    Export
                  </button>
                </div>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Eye size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No logs available</p>
                </div>
              ) : (
                <div className="space-y-1 font-mono text-sm">
                  {logs.map((log, index) => (
                    <div key={index} className={`p-2 rounded ${getLevelColor(log.level)}`}>
                      <span className="text-gray-500">[{log.timestamp}]</span>
                      <span className="ml-2 font-bold">[{log.level.toUpperCase()}]</span>
                      <span className="ml-2 text-gray-600">[{log.node_id}]</span>
                      <span className="ml-2">{log.message}</span>
                      {log.data && Object.keys(log.data).length > 0 && (
                        <pre className="mt-1 text-xs opacity-75">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Performance Profile</h3>
                {performance && (
                  <div className="text-sm text-gray-500">
                    Total: {(performance.total_duration_ms / 1000).toFixed(2)}s
                  </div>
                )}
              </div>

              {!performance || performance.nodes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Zap size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No performance data available</p>
                </div>
              ) : (
                <div>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">Total Time</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(performance.total_duration_ms / 1000).toFixed(2)}s
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600">Nodes Executed</div>
                      <div className="text-2xl font-bold text-green-600">
                        {performance.nodes.length}
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="text-sm text-gray-600">Avg per Node</div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {(performance.total_duration_ms / performance.nodes.length / 1000).toFixed(2)}s
                      </div>
                    </div>
                  </div>

                  {/* Slowest Nodes */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle size={16} className="text-yellow-600" />
                      Slowest Nodes
                    </h4>
                    <div className="space-y-2">
                      {performance.slowest_nodes.slice(0, 5).map((node, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{node.node_id}</span>
                            <span className="text-sm font-bold">
                              {(node.duration_ms / 1000).toFixed(3)}s
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(node.duration_ms / performance.total_duration_ms) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* All Nodes */}
                  <div>
                    <h4 className="font-medium mb-2">All Nodes</h4>
                    <div className="space-y-1">
                      {performance.nodes.map((node, index) => (
                        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <span className="text-sm">{node.node_id}</span>
                          <span className="text-sm font-medium">
                            {(node.duration_ms / 1000).toFixed(3)}s
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
