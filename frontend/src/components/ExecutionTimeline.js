import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Play, Pause, Activity, RotateCw, TrendingUp, Zap, GitBranch } from 'lucide-react';

const ExecutionTimeline = ({ workflowId, instanceId, nodes, currentNodeId }) => {
  const [timeline, setTimeline] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    retried: 0,
    duration: 0,
    avgNodeTime: 0
  });
  const [branchPaths, setBranchPaths] = useState([]);
  const [expandedEvent, setExpandedEvent] = useState(null);

  useEffect(() => {
    if (instanceId) {
      fetchTimeline();
      const interval = setInterval(fetchTimeline, 2000);
      return () => clearInterval(interval);
    }
  }, [instanceId]);

  const fetchTimeline = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${BACKEND_URL}/api/workflow-instances/${instanceId}/timeline`);
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
        setStats(data.stats || stats);
        setBranchPaths(data.branchPaths || []);
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  };

  const getNodeName = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  const getNodeType = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.type || 'unknown';
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'retrying':
        return <RotateCw className="w-4 h-4 text-orange-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-300';
      case 'failed': return 'bg-red-100 border-red-300';
      case 'running': return 'bg-blue-100 border-blue-300';
      case 'waiting': return 'bg-amber-100 border-amber-300';
      case 'retrying': return 'bg-orange-100 border-orange-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 max-w-md w-full">
      {/* PHASE 1: Enhanced Header with More Stats */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Execution Timeline
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 font-mono">
            {formatDuration(stats.duration)}
          </div>
          {stats.retried > 0 && (
            <div className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              {stats.retried}
            </div>
          )}
        </div>
      </div>

      {/* PHASE 1: Enhanced Progress Bar with Multi-Segment */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span className="font-bold">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
          {/* Completed segment */}
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-full float-left transition-all duration-500"
            style={{ width: `${(stats.completed / Math.max(stats.total, 1)) * 100}%` }}
          />
          {/* Failed segment */}
          {stats.failed > 0 && (
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 h-full float-left transition-all duration-500"
              style={{ width: `${(stats.failed / Math.max(stats.total, 1)) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* PHASE 1: Enhanced Stats Grid with More Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600 font-medium">Total</div>
          <div className="text-xl font-bold text-blue-600">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600 font-medium">Done</div>
          <div className="text-xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600 font-medium">Failed</div>
          <div className="text-xl font-bold text-red-600">{stats.failed}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600 font-medium">Avg</div>
          <div className="text-sm font-bold text-purple-600">{formatDuration(stats.avgNodeTime || 0)}</div>
        </div>
      </div>

      {/* PHASE 1: Success Rate Indicator */}
      {stats.total > 0 && (
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${
                successRate >= 90 ? 'text-green-600' :
                successRate >= 70 ? 'text-blue-600' :
                successRate >= 50 ? 'text-amber-600' : 'text-red-600'
              }`} />
              <span className="text-sm font-semibold text-gray-700">Success Rate</span>
            </div>
            <span className={`text-lg font-bold ${
              successRate >= 90 ? 'text-green-600' :
              successRate >= 70 ? 'text-blue-600' :
              successRate >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {successRate}%
            </span>
          </div>
        </div>
      )}

      {/* PHASE 1: Branch Path Visualization */}
      {branchPaths.length > 0 && (
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-700">Branch Paths</span>
          </div>
          <div className="space-y-1">
            {branchPaths.map((path, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  path.taken ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className={path.taken ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {path.name}: {path.branch}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 1: Enhanced Timeline Events */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No execution data yet</p>
          </div>
        ) : (
          timeline.map((event, index) => {
            const isExpanded = expandedEvent === index;
            const isCurrent = event.nodeId === currentNodeId;
            
            return (
              <div
                key={index}
                onClick={() => setExpandedEvent(isExpanded ? null : index)}
                className={`
                  border-2 rounded-lg transition-all cursor-pointer
                  ${isCurrent ? 'bg-blue-50 border-blue-400 shadow-md scale-[1.02]' : getStatusColor(event.status)}
                  hover:shadow-lg
                `}
              >
                <div className="flex items-start gap-3 p-3">
                  {/* Status Icon with Timeline Line */}
                  <div className="relative flex flex-col items-center">
                    <div className="mt-0.5">
                      {getStatusIcon(event.status)}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-300 absolute top-6" />
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {event.order !== undefined && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-700 text-white text-xs font-bold">
                              {event.order}
                            </span>
                          )}
                          <div className="font-semibold text-sm text-gray-900 truncate">
                            {getNodeName(event.nodeId)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {getNodeType(event.nodeId)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-gray-500">
                          {event.duration ? formatDuration(event.duration) : '-'}
                        </div>
                        {event.retryCount > 0 && (
                          <div className="text-xs text-orange-600 font-semibold flex items-center gap-1 justify-end mt-0.5">
                            <RotateCw className="w-3 h-3" />
                            {event.retryCount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs font-medium mt-2">
                      {event.status === 'completed' && (
                        <span className="text-green-700">✓ Completed successfully</span>
                      )}
                      {event.status === 'failed' && (
                        <span className="text-red-700">✗ {event.error || 'Failed'}</span>
                      )}
                      {event.status === 'running' && (
                        <span className="text-blue-700">⚡ In progress...</span>
                      )}
                      {event.status === 'waiting' && (
                        <span className="text-amber-700">⏳ Waiting...</span>
                      )}
                      {event.status === 'retrying' && (
                        <span className="text-orange-700">↻ Retrying...</span>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && event.output && (
                      <div className="mt-2 p-2 bg-white/50 rounded border border-gray-200">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Output:</div>
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(event.output, null, 2)}
                        </pre>
                      </div>
                    )}

                    {event.timestamp && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Stats Footer */}
      {timeline.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{timeline.length} events</span>
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionTimeline;
