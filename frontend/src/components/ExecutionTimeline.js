import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Play, Pause, Activity } from 'lucide-react';

const ExecutionTimeline = ({ workflowId, instanceId, nodes, currentNodeId }) => {
  const [timeline, setTimeline] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    duration: 0
  });

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
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  };

  const getNodeName = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || nodeId;
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
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-4 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Execution Timeline
        </h3>
        <div className="text-xs text-gray-500">
          {formatDuration(stats.duration)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600">Total</div>
          <div className="text-lg font-bold text-blue-600">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600">Completed</div>
          <div className="text-lg font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-600">Failed</div>
          <div className="text-lg font-bold text-red-600">{stats.failed}</div>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No execution data yet</p>
          </div>
        ) : (
          timeline.map((event, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                event.nodeId === currentNodeId
                  ? 'bg-blue-50 border-2 border-blue-300'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Status Icon */}
              <div className="mt-0.5">
                {getStatusIcon(event.status)}
              </div>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {getNodeName(event.nodeId)}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {event.duration ? formatDuration(event.duration) : '-'}
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 mt-1">
                  {event.status === 'completed' && '✓ Completed successfully'}
                  {event.status === 'failed' && `✗ ${event.error || 'Failed'}`}
                  {event.status === 'running' && '⚡ In progress...'}
                  {event.status === 'waiting' && '⏳ Waiting...'}
                </div>

                {event.timestamp && (
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExecutionTimeline;
