import React, { useState, useEffect } from 'react';
import { X, Bug, Activity, Clock, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Info } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const SubprocessDebugPanel = ({ instanceId, isOpen, onClose }) => {
  const [instance, setInstance] = useState(null);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set(['overview', 'performance']));
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    if (isOpen && instanceId) {
      loadDebugData();
      
      // Set up auto-refresh every 3 seconds if instance is running
      const interval = setInterval(() => {
        loadDebugData();
      }, 3000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isOpen, instanceId]);

  const loadDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load instance data
      const instanceResponse = await fetch(`${BACKEND_URL}/api/workflow-instances/${instanceId}`);
      const instanceData = await instanceResponse.json();
      setInstance(instanceData);

      // Load subprocess tree if this is a parent instance
      try {
        const treeResponse = await fetch(`${BACKEND_URL}/api/workflow-instances/${instanceId}/subprocess-tree`);
        if (treeResponse.ok) {
          const treeData = await treeResponse.json();
          setTree(treeData);
        }
      } catch (err) {
        // Tree might not exist if no subprocesses
        console.log('No subprocess tree available');
      }
    } catch (err) {
      setError('Failed to load debug data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const calculatePerformanceMetrics = () => {
    if (!instance || !instance.execution_log) return null;

    const logs = instance.execution_log;
    const nodeExecutionTimes = {};
    let totalExecutionTime = 0;
    let slowestNode = null;
    let slowestNodeTime = 0;

    logs.forEach(log => {
      if (log.started_at && log.completed_at) {
        const start = new Date(log.started_at);
        const end = new Date(log.completed_at);
        const duration = (end - start) / 1000; // Convert to seconds
        
        nodeExecutionTimes[log.node_id] = {
          node_id: log.node_id,
          node_type: log.node_type,
          duration,
          status: log.status
        };

        totalExecutionTime += duration;

        if (duration > slowestNodeTime) {
          slowestNodeTime = duration;
          slowestNode = nodeExecutionTimes[log.node_id];
        }
      }
    });

    return {
      totalExecutionTime,
      nodeExecutionTimes,
      slowestNode,
      nodeCount: Object.keys(nodeExecutionTimes).length,
      averageNodeTime: Object.keys(nodeExecutionTimes).length > 0 
        ? totalExecutionTime / Object.keys(nodeExecutionTimes).length 
        : 0
    };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-gold-600" />;
      case 'running':
        return <Activity className="w-4 h-4 text-green-600 animate-pulse" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-gold-600" />;
      default:
        return <Info className="w-4 h-4 text-green-400" />;
    }
  };

  const countSubprocesses = (node) => {
    if (!node) return 0;
    let count = node.children ? node.children.length : 0;
    if (node.children) {
      node.children.forEach(child => {
        count += countSubprocesses(child);
      });
    }
    return count;
  };

  if (!isOpen) return null;

  const metrics = calculatePerformanceMetrics();
  const totalSubprocesses = tree ? countSubprocesses(tree) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gold-600 to-gold-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bug className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Subprocess Debug Panel</h2>
                <p className="text-gold-100 text-sm">Performance metrics and execution analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-debug-panel"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !instance ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gold-600 animate-pulse mx-auto mb-3" />
                <p className="text-primary-600">Loading debug data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-gold-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gold-900">Error</h4>
                  <p className="text-sm text-gold-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          ) : instance ? (
            <div className="space-y-4">
              {/* Overview Section */}
              <div className="border border-green-200 rounded-lg">
                <button
                  onClick={() => toggleSection('overview')}
                  className="w-full flex items-center justify-between p-4 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {expandedSections.has('overview') ? (
                      <ChevronDown className="w-5 h-5 text-green-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-green-500" />
                    )}
                    <h3 className="text-lg font-semibold text-primary-900">Overview</h3>
                  </div>
                  {getStatusIcon(instance.status)}
                </button>
                
                {expandedSections.has('overview') && (
                  <div className="p-4 border-t border-green-200 bg-green-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-primary-600 mb-1">Status</div>
                        <div className="font-semibold text-primary-900 capitalize">{instance.status}</div>
                      </div>
                      <div>
                        <div className="text-xs text-primary-600 mb-1">Started At</div>
                        <div className="font-semibold text-primary-900 text-sm">
                          {instance.started_at ? new Date(instance.started_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-primary-600 mb-1">Nesting Level</div>
                        <div className="font-semibold text-primary-900">{instance.nesting_level || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-primary-600 mb-1">Total Subprocesses</div>
                        <div className="font-semibold text-primary-900">{totalSubprocesses}</div>
                      </div>
                    </div>
                    
                    {instance.parent_instance_id && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="text-xs text-primary-600 mb-1">Parent Instance</div>
                        <div className="font-mono text-sm text-primary-900">{instance.parent_instance_id}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Performance Metrics Section */}
              {metrics && (
                <div className="border border-green-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('performance')}
                    className="w-full flex items-center justify-between p-4 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {expandedSections.has('performance') ? (
                        <ChevronDown className="w-5 h-5 text-green-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-green-500" />
                      )}
                      <h3 className="text-lg font-semibold text-primary-900">Performance Metrics</h3>
                    </div>
                    <Activity className="w-5 h-5 text-green-600" />
                  </button>
                  
                  {expandedSections.has('performance') && (
                    <div className="p-4 border-t border-green-200 bg-green-50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-green-200">
                          <div className="text-xs text-primary-600 mb-1">Total Execution Time</div>
                          <div className="text-xl font-bold text-green-600">
                            {formatDuration(metrics.totalExecutionTime)}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-green-200">
                          <div className="text-xs text-primary-600 mb-1">Nodes Executed</div>
                          <div className="text-xl font-bold text-green-600">{metrics.nodeCount}</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-green-200">
                          <div className="text-xs text-primary-600 mb-1">Avg Node Time</div>
                          <div className="text-xl font-bold text-gold-600">
                            {formatDuration(metrics.averageNodeTime)}
                          </div>
                        </div>
                      </div>

                      {metrics.slowestNode && (
                        <div className="bg-gold-50 border border-gold-200 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gold-900 mb-2">Slowest Node</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gold-800">
                                {metrics.slowestNode.node_type} ({metrics.slowestNode.node_id})
                              </div>
                            </div>
                            <div className="text-lg font-bold text-gold-900">
                              {formatDuration(metrics.slowestNode.duration)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Node Execution Timeline */}
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-primary-700 mb-3">Node Execution Times</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {Object.values(metrics.nodeExecutionTimes)
                            .sort((a, b) => b.duration - a.duration)
                            .map((nodeMetric, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-primary-700">{nodeMetric.node_type}</span>
                                  <span className="text-sm font-medium text-primary-900">
                                    {formatDuration(nodeMetric.duration)}
                                  </span>
                                </div>
                                <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      nodeMetric.status === 'completed' ? 'bg-green-500' :
                                      nodeMetric.status === 'failed' ? 'bg-gold-500' : 'bg-green-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(100, (nodeMetric.duration / metrics.slowestNode.duration) * 100)}%`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Variables Section */}
              {instance.variables && Object.keys(instance.variables).length > 0 && (
                <div className="border border-green-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('variables')}
                    className="w-full flex items-center justify-between p-4 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {expandedSections.has('variables') ? (
                        <ChevronDown className="w-5 h-5 text-green-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-green-500" />
                      )}
                      <h3 className="text-lg font-semibold text-primary-900">Variables</h3>
                    </div>
                    <span className="text-sm text-primary-600">
                      {Object.keys(instance.variables).length} variables
                    </span>
                  </button>
                  
                  {expandedSections.has('variables') && (
                    <div className="p-4 border-t border-green-200 bg-green-50">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {Object.entries(instance.variables).map(([key, value]) => (
                          <div key={key} className="bg-white p-3 rounded border border-green-200">
                            <div className="text-sm font-medium text-primary-700 mb-1">{key}</div>
                            <div className="text-sm text-primary-600 font-mono">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Details Section */}
              {instance.error && (
                <div className="border border-gold-200 rounded-lg bg-gold-50">
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-gold-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gold-900 mb-2">Error Details</h3>
                        <div className="text-sm text-gold-800 mb-2">{instance.error}</div>
                        {instance.error_friendly && (
                          <div className="text-sm text-gold-700 bg-gold-100 border border-gold-200 rounded p-2">
                            💡 {instance.error_friendly}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-green-200 p-4 bg-green-50 flex justify-between items-center">
          <div className="text-sm text-primary-600">
            {instance?.status === 'running' && (
              <span className="flex items-center space-x-2">
                <Activity className="w-4 h-4 animate-pulse text-green-600" />
                <span>Auto-refreshing every 3 seconds</span>
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadDebugData}
              className="px-4 py-2 border border-gold-600 text-gold-600 rounded-lg hover:bg-gold-50 transition-colors text-sm font-medium"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubprocessDebugPanel;
