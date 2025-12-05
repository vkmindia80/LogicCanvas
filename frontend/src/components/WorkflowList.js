import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Copy, CheckSquare, Square, Clock, Tag } from 'lucide-react';
import VersionHistory from './VersionHistory';
import { useRole } from '../contexts/RoleContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const WorkflowList = ({ onSelectWorkflow, onCreateNew, onLoadRecruitingSample, onNotify }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, draft, published, paused, archived
  const [selectedWorkflows, setSelectedWorkflows] = useState([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionWorkflowId, setVersionWorkflowId] = useState(null);
  const [tagFilter, setTagFilter] = useState('');

  const { can } = useRole();

  useEffect(() => {
    loadWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const url = filter !== 'all' ? `${BACKEND_URL}/api/workflows?status=${filter}` : `${BACKEND_URL}/api/workflows`;
      const response = await fetch(url);
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      onNotify?.('Failed to load workflows', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (workflowId, event) => {
    event.stopPropagation();
    if (!can('deleteWorkflows')) {
      onNotify?.('You do not have permission to delete workflows.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        onNotify?.(body.detail || 'Failed to delete workflow', 'error');
        return;
      }
      onNotify?.('Workflow deleted', 'success');
      loadWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      onNotify?.('Failed to delete workflow', 'error');
    }
  };

  const duplicateWorkflow = async (workflowId, event) => {
    event.stopPropagation();
    if (!can('duplicateWorkflows')) {
      onNotify?.('You do not have permission to duplicate workflows.', 'error');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/duplicate`, {
        method: 'POST',
      });
      if (response.ok) {
        onNotify?.('Workflow duplicated successfully!', 'success');
        loadWorkflows();
      } else {
        const body = await response.json().catch(() => ({}));
        onNotify?.(body.detail || 'Failed to duplicate workflow', 'error');
      }
    } catch (error) {
      console.error('Failed to duplicate workflow:', error);
      onNotify?.('Failed to duplicate workflow', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!can('deleteWorkflows')) {
      onNotify?.('You do not have permission to delete workflows.', 'error');
      return;
    }
    if (!window.confirm(`Delete ${selectedWorkflows.length} selected workflow(s)?`)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedWorkflows),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        onNotify?.(body.detail || 'Failed to bulk delete workflows', 'error');
      } else {
        onNotify?.('Selected workflows deleted', 'success');
      }
      setSelectedWorkflows([]);
      loadWorkflows();
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      onNotify?.('Failed to bulk delete workflows', 'error');
    }
  };

  const handleBulkUpdateStatus = async (status) => {
    if (!can('publishWorkflows') && (status === 'published' || status === 'paused' || status === 'archived')) {
      onNotify?.('You do not have permission to change workflow status.', 'error');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/bulk-update-status?status=${status}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedWorkflows),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        onNotify?.(body.detail || 'Failed to update workflow status', 'error');
      } else {
        onNotify?.(`Updated ${selectedWorkflows.length} workflow(s) to ${status}`, 'success');
      }
      setSelectedWorkflows([]);
      loadWorkflows();
    } catch (error) {
      console.error('Failed to bulk update status:', error);
      onNotify?.('Failed to update workflow status', 'error');
    }
  };

  const updateSingleWorkflowStatus = async (workflowId, status, event) => {
    event.stopPropagation();
    if (!can('publishWorkflows')) {
      onNotify?.('You do not have permission to change workflow status.', 'error');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows/bulk-update-status?status=${status}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([workflowId]),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        onNotify?.(body.detail || 'Failed to update workflow status', 'error');
      } else {
        onNotify?.(`Workflow marked as ${status}`, 'success');
      }
      loadWorkflows();
    } catch (error) {
      console.error('Failed to update workflow status:', error);
      onNotify?.('Failed to update workflow status', 'error');
    }
  };

  const toggleSelectWorkflow = (workflowId) => {
    setSelectedWorkflows((prev) => (prev.includes(workflowId) ? prev.filter((id) => id !== workflowId) : [...prev, workflowId]));
  };

  const toggleSelectAll = () => {
    if (selectedWorkflows.length === filteredWorkflows.length) {
      setSelectedWorkflows([]);
    } else {
      setSelectedWorkflows(filteredWorkflows.map((w) => w.id));
    }
  };

  const openVersionHistory = (workflowId, event) => {
    event.stopPropagation();
    setVersionWorkflowId(workflowId);
    setShowVersionHistory(true);
  };

  const filteredWorkflows = useMemo(
    () =>
      workflows.filter((workflow) => {
        const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = !tagFilter || (workflow.tags && workflow.tags.includes(tagFilter));
        return matchesSearch && matchesTag;
      }),
    [workflows, searchTerm, tagFilter],
  );

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    published: 'bg-green-100 text-green-800 border-green-300',
    paused: 'bg-gray-100 text-gray-800 border-gray-300',
    archived: 'bg-red-100 text-red-800 border-red-300',
  };

  const allTags = useMemo(() => [...new Set(workflows.flatMap((w) => w.tags || []))], [workflows]);

  const statusCounts = useMemo(() => {
    const counts = { draft: 0, published: 0, paused: 0, archived: 0 };
    workflows.forEach((wf) => {
      if (counts[wf.status] !== undefined) counts[wf.status] += 1;
    });
    return counts;
  }, [workflows]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-slate-900">Workflows</h1>
            <p className="text-slate-600">Create and manage your visual workflows</p>
          </div>
          {can('createWorkflows') && (
            <div className="hidden items-center space-x-2 md:flex">
              <button
                onClick={onCreateNew}
                className="flex items-center space-x-2 rounded-lg bg-primary-500 px-6 py-2 text-white shadow-sm transition-colors hover:bg-primary-600"
                data-testid="create-workflow-btn"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Create Workflow</span>
              </button>
              <button
                onClick={onLoadRecruitingSample}
                className="flex items-center space-x-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm text-white shadow-sm transition-colors hover:bg-emerald-600"
                data-testid="load-recruiting-sample-btn"
              >
                <FileText className="h-4 w-4" />
                <span>Load Recruiting Template</span>
              </button>
            </div>
          )}
        </div>

        {/* Status chips */}
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">Draft: {statusCounts.draft}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">Published: {statusCounts.published}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">Paused: {statusCounts.paused}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">Archived: {statusCounts.archived}</span>
        </div>

        {/* Action Bar */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            {/* Search + filters */}
            <div className="flex flex-1 items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search workflows..."
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  data-testid="workflow-search"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                data-testid="workflow-filter"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>

              {allTags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    data-testid="workflow-tag-filter"
                  >
                    <option value="">All Tags</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Create buttons (mobile) */}
            {can('createWorkflows') && (
              <div className="flex space-x-2 md:hidden">
                <button
                  onClick={onCreateNew}
                  className="inline-flex items-center space-x-1 rounded-lg bg-primary-500 px-3 py-2 text-xs font-medium text-white"
                  data-testid="create-workflow-btn-mobile"
                >
                  <Plus className="h-4 w-4" />
                  <span>New</span>
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {selectedWorkflows.length > 0 && can('manageWorkflows') && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  {selectedWorkflows.length === filteredWorkflows.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  <span>{selectedWorkflows.length} selected</span>
                </button>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => handleBulkUpdateStatus('published')}
                  className="rounded bg-green-500 px-3 py-1.5 text-white hover:bg-green-600"
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('draft')}
                  className="rounded bg-yellow-500 px-3 py-1.5 text-white hover:bg-yellow-600"
                >
                  Draft
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('archived')}
                  className="rounded bg-slate-500 px-3 py-1.5 text-white hover:bg-slate-600"
                >
                  Archive
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="rounded bg-red-500 px-3 py-1.5 text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Workflows Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500"></div>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-md">
            <FileText className="mx-auto mb-4 h-16 w-16 text-slate-300" />
            <h3 className="mb-2 text-xl font-semibold text-slate-900">No workflows found</h3>
            <p className="mb-6 text-slate-600">
              {searchTerm || tagFilter || filter !== 'all'
                ? 'Try adjusting your filters or search term.'
                : 'Get started by creating your first workflow.'}
            </p>
            {can('createWorkflows') && !searchTerm && !tagFilter && filter === 'all' && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center space-x-2 rounded-lg bg-primary-500 px-6 py-3 text-white transition-colors hover:bg-primary-600"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Workflow</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="group relative cursor-pointer rounded-lg border border-slate-200 bg-white shadow-md transition-all hover:shadow-xl"
                data-testid={`workflow-card-${workflow.id}`}
              >
                {/* Selection Checkbox */}
                {can('manageWorkflows') && (
                  <div className="absolute left-4 top-4 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectWorkflow(workflow.id);
                      }}
                      className="rounded p-1 hover:bg-slate-100"
                    >
                      {selectedWorkflows.includes(workflow.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                )}

                <div className="p-6 pl-14" onClick={() => onSelectWorkflow(workflow)}>
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-primary-600">
                      {workflow.name}
                    </h3>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${
                        statusColors[workflow.status] || statusColors.draft
                      }`}
                    >
                      {workflow.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mb-4 line-clamp-2 text-sm text-slate-600">
                    {workflow.description || 'No description provided'}
                  </p>

                  {/* Stats */}
                  <div className="mb-4 flex items-center space-x-4 text-xs text-slate-500">
                    <span>{workflow.nodes?.length || 0} nodes</span>
                    <span>•</span>
                    <span>{workflow.edges?.length || 0} connections</span>
                    <span>•</span>
                    <span>v{workflow.version}</span>
                  </div>

                  {/* Tags */}
                  {workflow.tags && workflow.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {workflow.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-1 border-t border-slate-100 pt-4 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWorkflow(workflow);
                      }}
                      className="flex flex-1 items-center justify-center space-x-1 rounded px-2 py-2 text-primary-600 transition-colors hover:bg-primary-50"
                      data-testid="workflow-edit-btn"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="font-medium">Edit</span>
                    </button>

                    {can('duplicateWorkflows') && (
                      <button
                        onClick={(e) => duplicateWorkflow(workflow.id, e)}
                        className="flex flex-1 items-center justify-center space-x-1 rounded px-2 py-2 text-blue-600 transition-colors hover:bg-blue-50"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                        <span className="font-medium">Copy</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => openVersionHistory(workflow.id, e)}
                      className="flex flex-1 items-center justify-center space-x-1 rounded px-2 py-2 text-purple-600 transition-colors hover:bg-purple-50"
                      title="Version History"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Versions</span>
                    </button>

                    {can('deleteWorkflows') && (
                      <button
                        onClick={(e) => deleteWorkflow(workflow.id, e)}
                        className="flex items-center justify-center rounded px-2 py-2 text-red-600 transition-colors hover:bg-red-50"
                        data-testid="workflow-delete-btn"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Per-workflow lifecycle quick actions */}
                  {can('publishWorkflows') && (
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                      <span className="text-slate-400">Status actions:</span>
                      <button
                        onClick={(e) => updateSingleWorkflowStatus(workflow.id, 'published', e)}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 hover:bg-emerald-100"
                      >
                        Publish
                      </button>
                      <button
                        onClick={(e) => updateSingleWorkflowStatus(workflow.id, 'paused', e)}
                        className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 hover:bg-amber-100"
                      >
                        Pause
                      </button>
                      <button
                        onClick={(e) => updateSingleWorkflowStatus(workflow.id, 'archived', e)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 hover:bg-slate-100"
                      >
                        Archive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Version History Modal */}
        {showVersionHistory && versionWorkflowId && (
          <VersionHistory
            workflowId={versionWorkflowId}
            onClose={() => {
              setShowVersionHistory(false);
              setVersionWorkflowId(null);
            }}
            onRollback={() => {
              loadWorkflows();
            }}
            onNotify={onNotify}
          />
        )}
      </div>
    </div>
  );
};

export default WorkflowList;
