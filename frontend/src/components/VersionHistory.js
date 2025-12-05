import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, Save, CheckCircle, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const VersionHistory = ({ workflowId, onClose, onRollback, onNotify }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [rolling, setRolling] = useState(null);

  useEffect(() => {
    if (workflowId) {
      loadVersions();
    }
  }, [workflowId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/versions`);
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      setCreating(true);
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/versions`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadVersions();
        alert('Version created successfully!');
      } else {
        alert('Failed to create version');
      }
    } catch (error) {
      console.error('Failed to create version:', error);
      alert('Failed to create version');
    } finally {
      setCreating(false);
    }
  };

  const handleRollback = async (versionId) => {
    if (!window.confirm('Are you sure you want to rollback to this version? Current changes will be overwritten.')) {
      return;
    }

    try {
      setRolling(versionId);
      const response = await fetch(
        `${BACKEND_URL}/api/workflows/${workflowId}/rollback/${versionId}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        alert('Rolled back successfully!');
        if (onRollback) {
          onRollback();
        }
        onClose();
      } else {
        alert('Failed to rollback');
      }
    } catch (error) {
      console.error('Failed to rollback:', error);
      alert('Failed to rollback');
    } finally {
      setRolling(null);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Version History</h2>
            <p className="text-sm text-slate-600 mt-1">View and manage workflow versions</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Create Version Button */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <button
            onClick={handleCreateVersion}
            disabled={creating}
            className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="create-version-btn"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Current as New Version</span>
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Create a snapshot of the current workflow state
          </p>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Versions Yet</h3>
              <p className="text-slate-600">
                Create your first version to track workflow changes over time
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  data-testid={`version-${version.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          Version {version.version_number}
                        </h3>
                        {index === 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Latest
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          version.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {version.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDate(version.created_at)}
                        </span>
                        <span>•</span>
                        <span>{version.nodes?.length || 0} nodes</span>
                        <span>•</span>
                        <span>{version.edges?.length || 0} edges</span>
                      </div>

                      {version.description && (
                        <p className="text-sm text-slate-600 mt-2">{version.description}</p>
                      )}

                      {version.tags && version.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {version.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRollback(version.id)}
                      disabled={rolling === version.id || index === 0}
                      className="ml-4 flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid={`rollback-btn-${version.id}`}
                    >
                      {rolling === version.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                          <span className="text-sm">Rolling back...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span className="text-sm">
                            {index === 0 ? 'Current' : 'Rollback'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="p-4 border-t border-slate-200 bg-blue-50">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Version Control Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Save versions before major changes</li>
                <li>• Rollback restores workflow to selected version</li>
                <li>• Version history is preserved permanently</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
