import React, { useState, useEffect } from 'react';
import { X, GitBranch, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const SubprocessExecutionTree = ({ instanceId, isOpen, onClose }) => {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    if (isOpen && instanceId) {
      loadTree();
    }
  }, [isOpen, instanceId]);

  const loadTree = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflow-instances/${instanceId}/subprocess-tree`);
      const data = await response.json();
      
      if (response.ok) {
        setTree(data);
        // Auto-expand root
        setExpandedNodes(new Set([instanceId]));
      } else {
        setError(data.detail || 'Failed to load execution tree');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeInstanceId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeInstanceId)) {
      newExpanded.delete(nodeInstanceId);
    } else {
      newExpanded.add(nodeInstanceId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'waiting':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'waiting':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const renderTreeNode = (node, depth = 0) => {
    if (!node) return null;

    const isExpanded = expandedNodes.has(node.instance_id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.instance_id} className="mb-2">
        <div 
          className={`border rounded-lg p-3 ${getStatusColor(node.status)} hover:shadow-md transition-shadow`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Expand/Collapse Button */}
              {hasChildren && (
                <button
                  onClick={() => toggleNode(node.instance_id)}
                  className="p-1 hover:bg-white/50 rounded transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}

              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(node.status)}
              </div>

              {/* Node Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {node.workflow_name}
                  </h4>
                  {node.nesting_level > 0 && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      Level {node.nesting_level}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span className="flex items-center space-x-1">
                    <span className="font-medium">Status:</span>
                    <span className="capitalize">{node.status}</span>
                  </span>
                  {node.duration_seconds !== null && (
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(node.duration_seconds)}</span>
                    </span>
                  )}
                  {hasChildren && (
                    <span className="flex items-center space-x-1">
                      <GitBranch className="w-3 h-3" />
                      <span>{node.child_count} subprocess{node.child_count !== 1 ? 'es' : ''}</span>
                    </span>
                  )}
                </div>

                {node.has_errors && (
                  <div className="mt-2 text-xs text-red-700 bg-red-100 border border-red-200 rounded px-2 py-1">
                    ⚠ Execution failed
                  </div>
                )}

                <div className="mt-1 text-xs text-gray-500">
                  ID: {node.instance_id}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Render Children */}
        {isExpanded && hasChildren && (
          <div className="mt-2">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GitBranch className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Subprocess Execution Tree</h2>
                <p className="text-purple-100 text-sm">View nested workflow execution hierarchy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-tree-viewer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading execution tree...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Error Loading Tree</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && tree && (
            <div>
              {/* Summary */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-indigo-900 mb-2">Execution Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Root Workflow</div>
                    <div className="font-semibold text-gray-900">{tree.workflow_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <div className="font-semibold text-gray-900 capitalize">{tree.status}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Duration</div>
                    <div className="font-semibold text-gray-900">{formatDuration(tree.duration_seconds)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Subprocesses</div>
                    <div className="font-semibold text-gray-900">{tree.child_count}</div>
                  </div>
                </div>
              </div>

              {/* Tree */}
              <div className="space-y-2">
                {renderTreeNode(tree)}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Failed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Running</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span>Waiting</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end space-x-3">
          {!loading && !error && (
            <button
              onClick={loadTree}
              className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
            >
              Refresh
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubprocessExecutionTree;
