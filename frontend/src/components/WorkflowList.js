import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Play, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const WorkflowList = ({ onSelectWorkflow, onCreateNew }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, draft, published

  useEffect(() => {
    loadWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const url = filter !== 'all' 
        ? `${BACKEND_URL}/api/workflows?status=${filter}`
        : `${BACKEND_URL}/api/workflows`;
      const response = await fetch(url);
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (workflowId, event) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await fetch(`${BACKEND_URL}/api/workflows/${workflowId}`, {
        method: 'DELETE'
      });
      loadWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    published: 'bg-green-100 text-green-800 border-green-300',
    paused: 'bg-gray-100 text-gray-800 border-gray-300',
    archived: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Workflows</h1>
          <p className="text-slate-600">Create and manage your visual workflows</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-slate-200">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search workflows..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  data-testid="workflow-search"
                />
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="workflow-filter"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={onCreateNew}
              className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
              data-testid="create-workflow-btn"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create Workflow</span>
            </button>
          </div>
        </div>

        {/* Workflows Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-slate-200">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No workflows found</h3>
            <p className="text-slate-600 mb-6">Get started by creating your first workflow</p>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Workflow</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => onSelectWorkflow(workflow)}
                className="bg-white rounded-lg shadow-md border border-slate-200 hover:shadow-xl transition-all cursor-pointer group"
                data-testid={`workflow-card-${workflow.id}`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {workflow.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[workflow.status] || statusColors.draft}`}>
                      {workflow.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {workflow.description || 'No description provided'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-xs text-slate-500 mb-4">
                    <span>{workflow.nodes?.length || 0} nodes</span>
                    <span>•</span>
                    <span>{workflow.edges?.length || 0} connections</span>
                    <span>•</span>
                    <span>v{workflow.version}</span>
                  </div>

                  {/* Tags */}
                  {workflow.tags && workflow.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {workflow.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWorkflow(workflow);
                      }}
                      className="flex-1 flex items-center justify-center space-x-1 text-primary-600 hover:bg-primary-50 px-3 py-2 rounded transition-colors"
                      data-testid="workflow-edit-btn"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center space-x-1 text-green-600 hover:bg-green-50 px-3 py-2 rounded transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm font-medium">Run</span>
                    </button>
                    <button
                      onClick={(e) => deleteWorkflow(workflow.id, e)}
                      className="flex items-center justify-center text-red-600 hover:bg-red-50 px-3 py-2 rounded transition-colors"
                      data-testid="workflow-delete-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowList;
