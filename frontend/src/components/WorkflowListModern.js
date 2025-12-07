import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Copy, CheckSquare, Square, Clock, Tag, Sparkles, BookOpen, Zap, Workflow as WorkflowIcon, Filter, MoreVertical } from 'lucide-react';
import VersionHistory from './VersionHistory';
import TemplateLibrary from './TemplateLibrary';
import QuickStartWizard from './QuickStartWizard';
import EmptyState from './EmptyState';
import Tooltip from './Tooltip';
import { SkeletonCard } from './Skeleton';
import { useRole } from '../contexts/RoleContext';
import NewUserWelcome from './NewUserWelcome';
import AIWorkflowWizard from './AIWorkflowWizard';
import { modernButtonStyles, modernCardStyles, modernSearchBarStyles, getModernBadgeStyle } from '../utils/modernDesignSystem';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const WorkflowListModern = ({ onSelectWorkflow, onCreateNew, onLoadRecruitingSample, onNotify }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedWorkflows, setSelectedWorkflows] = useState([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionWorkflowId, setVersionWorkflowId] = useState(null);
  const [tagFilter, setTagFilter] = useState('');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showQuickStartWizard, setShowQuickStartWizard] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    return localStorage.getItem('lc_welcome_dismissed') !== 'true';
  });

  const { can } = useRole();

  useEffect(() => {
    loadWorkflows();
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

  const toggleSelectWorkflow = (workflowId) => {
    setSelectedWorkflows((prev) => 
      prev.includes(workflowId) ? prev.filter((id) => id !== workflowId) : [...prev, workflowId]
    );
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

  const allTags = useMemo(() => [...new Set(workflows.flatMap((w) => w.tags || []))], [workflows]);

  const statusCounts = useMemo(() => {
    const counts = { draft: 0, published: 0, paused: 0, archived: 0 };
    workflows.forEach((wf) => {
      if (counts[wf.status] !== undefined) counts[wf.status] += 1;
    });
    return counts;
  }, [workflows]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Workflows
              </h1>
              <p className="text-base text-slate-600">
                Design, manage, and automate your business processes
              </p>
            </div>
            {can('createWorkflows') && (
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={onCreateNew}
                  className={modernButtonStyles.primary}
                  data-testid="create-workflow-btn"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Workflow</span>
                </button>
                <button
                  onClick={() => setShowQuickStartWizard(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-purple-700"
                  data-testid="quick-start-wizard-btn"
                >
                  <Zap className="h-4 w-4" />
                  <span>Quick Start</span>
                </button>
                <button
                  onClick={() => setShowTemplateLibrary(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-cyan-700"
                  data-testid="template-library-btn"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Templates</span>
                </button>
              </div>
            )}
          </div>

          {/* Status Overview */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-slate-200">
              <div className="h-2 w-2 rounded-full bg-slate-400"></div>
              <span className="text-sm font-medium text-slate-600">Draft:</span>
              <span className="text-sm font-semibold text-slate-900">{statusCounts.draft}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-slate-200">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-slate-600">Published:</span>
              <span className="text-sm font-semibold text-slate-900">{statusCounts.published}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-slate-200">
              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
              <span className="text-sm font-medium text-slate-600">Paused:</span>
              <span className="text-sm font-semibold text-slate-900">{statusCounts.paused}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-slate-200">
              <div className="h-2 w-2 rounded-full bg-slate-300"></div>
              <span className="text-sm font-medium text-slate-600">Archived:</span>
              <span className="text-sm font-semibold text-slate-900">{statusCounts.archived}</span>
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        {showWelcomeBanner && workflows.length === 0 && !loading && (
          <NewUserWelcome
            onStartTour={() => {
              window.dispatchEvent(new CustomEvent('startOnboardingTour'));
              setShowWelcomeBanner(false);
              localStorage.setItem('lc_welcome_dismissed', 'true');
            }}
            onQuickStart={() => {
              setShowQuickStartWizard(true);
              setShowWelcomeBanner(false);
              localStorage.setItem('lc_welcome_dismissed', 'true');
            }}
            onTemplates={() => {
              setShowTemplateLibrary(true);
              setShowWelcomeBanner(false);
              localStorage.setItem('lc_welcome_dismissed', 'true');
            }}
            onDismiss={() => {
              setShowWelcomeBanner(false);
              localStorage.setItem('lc_welcome_dismissed', 'true');
            }}
          />
        )}

        {/* Filters and Search */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className={modernSearchBarStyles.wrapper + " flex-1 min-w-[300px]"}>
              <Search className={modernSearchBarStyles.icon} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search workflows..."
                className={modernSearchBarStyles.input}
                data-testid="workflow-search"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                data-testid="workflow-filter"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {allTags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
        </div>

        {/* Workflows Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <EmptyState
            icon={searchTerm || tagFilter || filter !== 'all' ? Search : WorkflowIcon}
            title={searchTerm || tagFilter || filter !== 'all' ? 'No workflows found' : 'No workflows yet'}
            description={
              searchTerm || tagFilter || filter !== 'all'
                ? 'Try adjusting your filters or search term.'
                : 'Get started by creating your first workflow.'
            }
            action={
              can('createWorkflows') && !searchTerm && !tagFilter && filter === 'all' ? (
                <button
                  onClick={onCreateNew}
                  className={modernButtonStyles.primary}
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Your First Workflow</span>
                </button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10"
                onClick={() => onSelectWorkflow(workflow)}
                data-testid={`workflow-card-${workflow.id}`}
              >
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                      {workflow.name}
                    </h3>
                    <span className={getModernBadgeStyle(workflow.status)}>
                      {workflow.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {workflow.description || 'No description provided'}
                  </p>
                </div>

                {/* Stats */}
                <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                    {workflow.nodes?.length || 0} nodes
                  </span>
                  <span>•</span>
                  <span>{workflow.edges?.length || 0} connections</span>
                  <span>•</span>
                  <span className="text-slate-400">v{workflow.version}</span>
                </div>

                {/* Tags */}
                {workflow.tags && workflow.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {workflow.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectWorkflow(workflow);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                    data-testid="workflow-edit-btn"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>

                  {can('duplicateWorkflows') && (
                    <button
                      onClick={(e) => duplicateWorkflow(workflow.id, e)}
                      className="flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => openVersionHistory(workflow.id, e)}
                    className="flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Clock className="h-4 w-4" />
                  </button>

                  {can('deleteWorkflows') && (
                    <button
                      onClick={(e) => deleteWorkflow(workflow.id, e)}
                      className="flex items-center justify-center rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50"
                      data-testid="workflow-delete-btn"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showVersionHistory && versionWorkflowId && (
          <VersionHistory
            workflowId={versionWorkflowId}
            onClose={() => {
              setShowVersionHistory(false);
              setVersionWorkflowId(null);
            }}
            onRollback={() => loadWorkflows()}
            onNotify={onNotify}
          />
        )}

        <TemplateLibrary
          isOpen={showTemplateLibrary}
          onClose={() => setShowTemplateLibrary(false)}
          onSelectTemplate={(workflow) => {
            onSelectWorkflow(workflow);
            setShowTemplateLibrary(false);
            onNotify?.('Template loaded successfully!', 'success');
          }}
        />

        <QuickStartWizard
          isOpen={showQuickStartWizard}
          onClose={() => setShowQuickStartWizard(false)}
          onCreate={(workflow) => {
            onSelectWorkflow(workflow);
            setShowQuickStartWizard(false);
            onNotify?.('Workflow created!', 'success');
          }}
        />

        {showAIWizard && (
          <AIWorkflowWizard
            onClose={() => setShowAIWizard(false)}
            onWorkflowCreated={(workflow) => {
              onSelectWorkflow(workflow);
              setShowAIWizard(false);
              onNotify?.('AI-generated workflow created!', 'success');
              loadWorkflows();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WorkflowListModern;
