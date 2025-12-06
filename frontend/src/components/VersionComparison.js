import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  Clock, 
  User, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Link,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const VersionComparison = ({ workflowId, onClose, onRollback }) => {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selectedVersionA, setSelectedVersionA] = useState(null);
  const [selectedVersionB, setSelectedVersionB] = useState(null);
  const [diff, setDiff] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [workflowId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/versions`);
      const data = await response.json();
      
      const versionList = data.versions || [];
      setVersions(versionList.sort((a, b) => b.version - a.version));
      
      // Auto-select last two versions for comparison
      if (versionList.length >= 2) {
        setSelectedVersionA(versionList[1].version);
        setSelectedVersionB(versionList[0].version);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = async () => {
    if (!selectedVersionA || !selectedVersionB) {
      alert('Please select two versions to compare');
      return;
    }

    try {
      setComparing(true);
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/versions/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_a: selectedVersionA,
          version_b: selectedVersionB
        })
      });

      const data = await response.json();
      setDiff(data.diff);
    } catch (error) {
      console.error('Failed to compare versions:', error);
      alert('Failed to compare versions');
    } finally {
      setComparing(false);
    }
  };

  const handleRollback = async (version) => {
    const versionData = versions.find(v => v.version === version);
    const confirmMessage = `Are you sure you want to rollback to version ${version}?\n\nCreated: ${new Date(versionData.created_at).toLocaleString()}\nBy: ${versionData.created_by}\n\nThis will create a new version with the content from version ${version}.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const comment = prompt('Please provide a reason for rollback:');
    if (comment === null) return;

    try {
      setRollbackLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/api/workflows/${workflowId}/versions/${version}/rollback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: comment || `Rolled back to version ${version}`,
            changed_by: 'current_user'
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        if (onRollback) {
          onRollback(version);
        }
        await loadVersions();
      } else {
        alert(result.detail || 'Rollback failed');
      }
    } catch (error) {
      console.error('Rollback failed:', error);
      alert('Failed to rollback version');
    } finally {
      setRollbackLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVersionA && selectedVersionB) {
      compareVersions();
    }
  }, [selectedVersionA, selectedVersionB]);

  const renderDiffSection = (title, items, type) => {
    if (!items || items.length === 0) return null;

    const colorClass = 
      type === 'added' ? 'bg-green-50 border-green-200' :
      type === 'removed' ? 'bg-red-50 border-red-200' :
      'bg-yellow-50 border-yellow-200';

    const iconColor =
      type === 'added' ? 'text-green-600' :
      type === 'removed' ? 'text-red-600' :
      'text-yellow-600';

    const Icon = 
      type === 'added' ? CheckCircle :
      type === 'removed' ? XCircle :
      Edit;

    return (
      <div className={`rounded-lg border-2 p-4 ${colorClass}`}>
        <div className="mb-3 flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <h4 className="font-semibold text-slate-900">{title}</h4>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
            {items.length}
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="rounded-md bg-white p-3 text-sm">
              {item.id && (
                <div className="mb-1 font-mono text-xs text-slate-500">
                  ID: {item.id}
                </div>
              )}
              {item.data?.label && (
                <div className="font-medium text-slate-900">{item.data.label}</div>
              )}
              {item.type && (
                <div className="text-slate-600">Type: {item.type}</div>
              )}
              {item.before && item.after && (
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-red-600">Before:</div>
                    <div className="mt-1 rounded bg-red-50 p-2 text-xs">
                      <pre className="overflow-x-auto">{JSON.stringify(item.before.data, null, 2)}</pre>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-green-600">After:</div>
                    <div className="mt-1 rounded bg-green-50 p-2 text-xs">
                      <pre className="overflow-x-auto">{JSON.stringify(item.after.data, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <GitBranch className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Version Comparison</h2>
                <p className="text-sm text-slate-500">Compare workflow versions and rollback if needed</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <GitBranch className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <h3 className="mb-1 text-lg font-semibold text-slate-900">No Version History</h3>
              <p className="text-sm text-slate-600">This workflow doesn't have any saved versions yet.</p>
            </div>
          ) : (
            <>
              {/* Version Selector */}
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Version A (Older)
                  </label>
                  <select
                    value={selectedVersionA || ''}
                    onChange={(e) => setSelectedVersionA(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="">Select version...</option>
                    {versions.map((v) => (
                      <option key={v.version} value={v.version}>
                        Version {v.version} - {new Date(v.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Version B (Newer)
                  </label>
                  <select
                    value={selectedVersionB || ''}
                    onChange={(e) => setSelectedVersionB(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="">Select version...</option>
                    {versions.map((v) => (
                      <option key={v.version} value={v.version}>
                        Version {v.version} - {new Date(v.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Result */}
              {comparing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
                    <p className="text-sm text-slate-600">Comparing versions...</p>
                  </div>
                </div>
              ) : diff ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                    <h3 className="mb-3 font-semibold text-slate-900">Comparison Summary</h3>
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg bg-white p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{diff.nodes_added?.length || 0}</div>
                        <div className="text-xs text-slate-600">Nodes Added</div>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{diff.nodes_removed?.length || 0}</div>
                        <div className="text-xs text-slate-600">Nodes Removed</div>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{diff.nodes_modified?.length || 0}</div>
                        <div className="text-xs text-slate-600">Nodes Modified</div>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(diff.edges_added?.length || 0) + (diff.edges_removed?.length || 0)}
                        </div>
                        <div className="text-xs text-slate-600">Edge Changes</div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Changes */}
                  {Object.keys(diff.metadata_changes || {}).length > 0 && (
                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                      <h4 className="mb-3 font-semibold text-slate-900">Metadata Changes</h4>
                      <div className="space-y-2">
                        {Object.entries(diff.metadata_changes).map(([key, change]) => (
                          <div key={key} className="rounded-md bg-white p-3">
                            <div className="mb-1 text-sm font-medium text-slate-900 capitalize">{key}</div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="rounded bg-red-50 p-2">
                                <div className="text-xs font-medium text-red-600">From:</div>
                                <div className="text-sm text-slate-700">{JSON.stringify(change.from)}</div>
                              </div>
                              <div className="rounded bg-green-50 p-2">
                                <div className="text-xs font-medium text-green-600">To:</div>
                                <div className="text-sm text-slate-700">{JSON.stringify(change.to)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Node Changes */}
                  {renderDiffSection('Nodes Added', diff.nodes_added, 'added')}
                  {renderDiffSection('Nodes Removed', diff.nodes_removed, 'removed')}
                  {renderDiffSection('Nodes Modified', diff.nodes_modified, 'modified')}

                  {/* Edge Changes */}
                  {(diff.edges_added?.length > 0 || diff.edges_removed?.length > 0) && (
                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                      <div className="mb-3 flex items-center space-x-2">
                        <Link className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-slate-900">Edge Changes</h4>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {diff.edges_added?.length > 0 && (
                          <div>
                            <div className="mb-2 text-sm font-medium text-green-600">Added ({diff.edges_added.length})</div>
                            <div className="space-y-2">
                              {diff.edges_added.map((edge, index) => (
                                <div key={index} className="rounded-md bg-white p-2 text-xs">
                                  {edge.source} → {edge.target}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {diff.edges_removed?.length > 0 && (
                          <div>
                            <div className="mb-2 text-sm font-medium text-red-600">Removed ({diff.edges_removed.length})</div>
                            <div className="space-y-2">
                              {diff.edges_removed.map((edge, index) => (
                                <div key={index} className="rounded-md bg-white p-2 text-xs">
                                  {edge.source} → {edge.target}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                  <p className="text-slate-600">Select two versions to compare</p>
                </div>
              )}

              {/* Version List */}
              <div className="mt-6">
                <h3 className="mb-3 text-lg font-semibold text-slate-900">All Versions</h3>
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div key={version.version} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                          v{version.version}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            Version {version.version}
                            {version.is_rollback && (
                              <span className="ml-2 rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                                Rollback
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-slate-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(version.created_at).toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{version.created_by}</span>
                            </span>
                          </div>
                          {version.change_notes && (
                            <div className="mt-1 text-sm text-slate-600">{version.change_notes}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRollback(version.version)}
                        disabled={rollbackLoading}
                        className="flex items-center space-x-2 rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Rollback</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionComparison;
