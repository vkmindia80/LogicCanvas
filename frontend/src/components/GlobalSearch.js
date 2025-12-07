import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Workflow as WorkflowIcon, CheckSquare, ClipboardCheck, Loader2, Menu } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const GlobalSearch = ({ isOpen, onClose, onSelectWorkflow, onSelectForm, onOpenMobileSidebar, sidebarCollapsed = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        performSearch(query);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults(null);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults(null);
    onClose();
  };

  const handleSelectWorkflow = (workflow) => {
    onSelectWorkflow(workflow);
    handleClose();
  };

  const handleSelectForm = (form) => {
    onSelectForm(form);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'} bg-white z-50 flex flex-col`} data-testid="global-search">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Hamburger Menu for Mobile */}
              <button 
                onClick={onOpenMobileSidebar}
                className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
                data-testid="mobile-menu-btn"
                aria-label="Open Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Search className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Global Search</h1>
                <p className="text-primary-100 text-sm">Search workflows, forms, tasks, and approvals</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-search-btn"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search workflows, forms, tasks, approvals..."
              className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              data-testid="global-search-input"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 animate-spin" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Type at least 2 characters to search
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {!results && !loading && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Start typing to search across all resources</p>
            </div>
          )}

          {results && results.total === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No results found for {`"${query}"`}</p>
            </div>
          )}

          {results && results.total > 0 && (
            <div className="space-y-6">
              {/* Workflows */}
              {results.results.workflows.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <WorkflowIcon className="w-4 h-4 mr-2" />
                    Workflows ({results.results.workflows.length})
                  </h3>
                  <div className="space-y-2">
                    {results.results.workflows.map((workflow) => (
                      <button
                        key={workflow.id}
                        onClick={() => handleSelectWorkflow(workflow)}
                        className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
                        data-testid={`search-result-workflow-${workflow.id}`}
                      >
                        <p className="font-medium text-slate-900">{workflow.name}</p>
                        {workflow.description && (
                          <p className="text-sm text-slate-600 mt-1">{workflow.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-slate-500">
                            {workflow.nodes?.length || 0} nodes
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            workflow.status === 'published' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {workflow.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Forms */}
              {results.results.forms.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Forms ({results.results.forms.length})
                  </h3>
                  <div className="space-y-2">
                    {results.results.forms.map((form) => (
                      <button
                        key={form.id}
                        onClick={() => handleSelectForm(form)}
                        className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors"
                        data-testid={`search-result-form-${form.id}`}
                      >
                        <p className="font-medium text-slate-900">{form.name}</p>
                        {form.description && (
                          <p className="text-sm text-slate-600 mt-1">{form.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          {form.fields?.length || 0} fields
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.results.tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Tasks ({results.results.tasks.length})
                  </h3>
                  <div className="space-y-2">
                    {results.results.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <p className="font-medium text-slate-900">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : task.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approvals */}
              {results.results.approvals.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    Approvals ({results.results.approvals.length})
                  </h3>
                  <div className="space-y-2">
                    {results.results.approvals.map((approval) => (
                      <div
                        key={approval.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <p className="font-medium text-slate-900">{approval.title}</p>
                        {approval.description && (
                          <p className="text-sm text-slate-600 mt-1">{approval.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            approval.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : approval.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {approval.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GlobalSearch;
