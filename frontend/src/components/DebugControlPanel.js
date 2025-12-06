import React, { useState, useEffect } from 'react';
import {
  Play, Pause, StepForward, Square, Bug, Activity,
  Clock, AlertCircle, CheckCircle, XCircle, Info
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const DebugControlPanel = ({ instanceId, isOpen, onClose }) => {
  const [debugMode, setDebugMode] = useState(false);
  const [breakpoints, setBreakpoints] = useState([]);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [selectedTab, setSelectedTab] = useState('breakpoints'); // breakpoints | logs | performance | timeline
  const [isStepping, setIsStepping] = useState(false);

  useEffect(() => {
    if (isOpen && instanceId) {
      loadDebugData();
    }
  }, [isOpen, instanceId]);

  const loadDebugData = async () => {
    await Promise.all([
      loadBreakpoints(),
      loadExecutionLogs(),
      loadPerformanceData(),
      loadTimeline()
    ]);
  };

  const loadBreakpoints = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/instances/${instanceId}/debug/breakpoints`
      );
      if (response.ok) {
        const data = await response.json();
        setBreakpoints(data.breakpoints || []);
      }
    } catch (error) {
      console.error('Failed to load breakpoints:', error);
    }
  };

  const loadExecutionLogs = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/instances/${instanceId}/debug/logs?limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setExecutionLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/instances/${instanceId}/debug/performance`
      );
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  };

  const loadTimeline = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/instances/${instanceId}/debug/timeline`
      );
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
      }
    } catch (error) {
      console.error('Failed to load timeline:', error);
    }
  };

  const stepExecution = async () => {
    setIsStepping(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/instances/${instanceId}/debug/step`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'step_over' })
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Stepped to next node: ${result.next_node || 'Complete'}`);
        await loadDebugData();
      }
    } catch (error) {
      console.error('Step execution failed:', error);
      alert('Failed to step execution');
    } finally {
      setIsStepping(false);
    }
  };

  const addBreakpoint = async (nodeId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/instances/${instanceId}/debug/breakpoint`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            node_id: nodeId,
            enabled: true
          })
        }
      );

      if (response.ok) {
        await loadBreakpoints();
      }
    } catch (error) {
      console.error('Failed to add breakpoint:', error);
    }
  };

  const removeBreakpoint = async (nodeId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/instances/${instanceId}/debug/breakpoint/${nodeId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await loadBreakpoints();
      }
    } catch (error) {
      console.error('Failed to remove breakpoint:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-40">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Debug Console</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Debug Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={stepExecution}
            disabled={isStepping}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            title="Step Over (Execute next node)"
          >
            <StepForward className="w-4 h-4" />
            Step
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            title="Continue execution"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            title="Pause execution"
          >
            <Pause className="w-4 h-4" />
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            title="Stop execution"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {[
          { id: 'breakpoints', label: 'Breakpoints', count: breakpoints.length },
          { id: 'logs', label: 'Logs', count: executionLogs.length },
          { id: 'performance', label: 'Performance' },
          { id: 'timeline', label: 'Timeline', count: timeline.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === tab.id
                ? 'border-purple-500 text-purple-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-xs text-gray-500">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Breakpoints Tab */}
        {selectedTab === 'breakpoints' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Active Breakpoints</h4>
              <button
                onClick={() => {
                  const nodeId = prompt('Enter node ID to add breakpoint:');
                  if (nodeId) addBreakpoint(nodeId);
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + Add
              </button>
            </div>

            {breakpoints.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                <Bug className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No breakpoints set</p>
                <p className="text-xs mt-1">Click on nodes to add breakpoints</p>
              </div>
            )}

            {breakpoints.map((bp) => (
              <div
                key={bp.node_id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-gray-900">{bp.node_id}</p>
                    {bp.condition && (
                      <p className="text-xs text-gray-600 mt-1">
                        Condition: {bp.condition}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Added: {new Date(bp.added_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeBreakpoint(bp.node_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logs Tab */}
        {selectedTab === 'logs' && (
          <div className="space-y-2">
            {executionLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No execution logs yet</p>
              </div>
            )}

            {executionLogs.map((log, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded p-2 border border-gray-200 text-xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(log.action)}
                  <span className="font-semibold text-gray-900">{log.action}</span>
                  <span className="text-gray-500 ml-auto">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {log.details && (
                  <pre className="text-gray-600 mt-1 whitespace-pre-wrap font-mono text-xs">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Performance Tab */}
        {selectedTab === 'performance' && performanceData && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Total Execution Time</h4>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {performanceData.total_execution_time?.toFixed(2)}s
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {performanceData.total_nodes_executed} nodes executed
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Bottlenecks (Top 5 Slowest Nodes)
              </h4>
              <div className="space-y-2">
                {performanceData.bottlenecks?.map((node, index) => (
                  <div key={node.node_id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-900">#{index + 1}</span>
                      <span className="text-sm font-semibold text-red-600">
                        {node.total_time?.toFixed(3)}s
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Node: {node.node_id}</p>
                      <p>Executions: {node.executions}</p>
                      <p>Avg: {node.avg_time?.toFixed(3)}s</p>
                      <p>% of Total: {node.percentage}%</p>
                    </div>
                    {node.errors > 0 && (
                      <div className="mt-2 text-xs text-red-600 font-medium">
                        ⚠️ {node.errors} error(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {selectedTab === 'timeline' && (
          <div className="space-y-2">
            {timeline.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No execution timeline yet</p>
              </div>
            )}

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {timeline.map((entry, index) => (
                <div key={index} className="relative pl-12 pb-4">
                  {/* Timeline dot */}
                  <div className={`absolute left-3 top-1 w-4 h-4 rounded-full border-2 ${
                    entry.status === 'completed'
                      ? 'bg-green-500 border-green-600'
                      : entry.status === 'failed'
                      ? 'bg-red-500 border-red-600'
                      : 'bg-blue-500 border-blue-600'
                  }`}></div>

                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(entry.status)}
                        <span className="font-semibold text-sm text-gray-900">
                          {entry.node_label || entry.node_id}
                        </span>
                      </div>
                      {entry.duration_seconds !== undefined && (
                        <span className="text-xs text-gray-500">
                          {entry.duration_seconds}s
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Type: <span className="font-mono">{entry.node_type}</span></p>
                      <p>Started: {new Date(entry.started_at).toLocaleTimeString()}</p>
                      {entry.completed_at && (
                        <p>Completed: {new Date(entry.completed_at).toLocaleTimeString()}</p>
                      )}
                    </div>

                    {entry.error && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                        Error: {entry.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={loadDebugData}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium transition-colors"
        >
          Refresh Debug Data
        </button>
      </div>
    </div>
  );
};

export default DebugControlPanel;
