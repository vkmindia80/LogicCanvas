import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Clock,
  Database,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  List,
  Box,
  AlertCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const TYPE_ICONS = {
  string: <Type className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  boolean: <ToggleLeft className="h-4 w-4" />,
  object: <Box className="h-4 w-4" />,
  array: <List className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  null: <AlertCircle className="h-4 w-4" />
};

const TYPE_COLORS = {
  string: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  number: 'bg-purple-100 text-purple-800 border-purple-200',
  boolean: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  object: 'bg-violet-100 text-violet-800 border-violet-200',
  array: 'bg-blue-100 text-blue-800 border-blue-200',
  date: 'bg-teal-100 text-teal-800 border-teal-200',
  null: 'bg-slate-100 text-slate-800 border-slate-200'
};

const SCOPE_COLORS = {
  workflow: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  node: 'bg-purple-100 text-purple-800 border-purple-200',
  global: 'bg-cyan-100 text-cyan-800 border-cyan-200'
};

const VariableManagementPanelModern = ({ onClose, instanceId }) => {
  const [variables, setVariables] = useState([]);
  const [filteredVariables, setFilteredVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [selectedVariable, setSelectedVariable] = useState(null);
  const [variableHistory, setVariableHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (instanceId) {
      loadVariables();
      const interval = setInterval(loadVariables, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [instanceId]);

  useEffect(() => {
    applyFilters();
  }, [variables, searchQuery, typeFilter, scopeFilter]);

  const loadVariables = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (scopeFilter !== 'all') params.append('scope', scopeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/variables?${params}`);
      const data = await response.json();
      setVariables(data.variables || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading variables:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...variables];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(query) || String(v.value).toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((v) => v.type === typeFilter);
    }

    // Apply scope filter
    if (scopeFilter !== 'all') {
      filtered = filtered.filter((v) => v.scope === scopeFilter);
    }

    setFilteredVariables(filtered);
  };

  const loadVariableHistory = async (variableName) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/instances/${instanceId}/variables/${variableName}/history`
      );
      const data = await response.json();
      setVariableHistory(data.history || []);
      setSelectedVariable(variableName);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading variable history:', error);
    }
  };

  const addToWatchList = async (variableName) => {
    try {
      await fetch(`${BACKEND_URL}/api/instances/${instanceId}/variables/watch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variable_name: variableName })
      });
      alert(`Variable "${variableName}" added to watch list`);
    } catch (error) {
      console.error('Error adding to watch list:', error);
    }
  };

  const exportVariables = () => {
    const dataStr = JSON.stringify(variables, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `variables_${instanceId}_${new Date().toISOString()}.json`;
    link.click();
  };

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return 'null';
    if (type === 'object' || type === 'array') {
      const str = JSON.stringify(value);
      return str.length > 100 ? str.substring(0, 100) + '...' : str;
    }
    const str = String(value);
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative h-[90vh] w-[90vw] rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header - Modern Indigo Gradient */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Variable Management</h2>
              <p className="text-sm text-indigo-100">
                {instanceId ? `Instance: ${instanceId.substring(0, 8)}...` : 'No instance selected'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadVariables}
              className="rounded-xl bg-white/20 p-2 hover:bg-white/30 transition-all"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={exportVariables}
              className="rounded-xl bg-white/20 p-2 hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export Variables"
              disabled={variables.length === 0}
            >
              <Download className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="rounded-xl bg-white/20 p-2 hover:bg-white/30 transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters - Modern Slate Background */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search variables..."
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="min-w-[150px]">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white"
              >
                <option value="all">All Types</option>
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
                <option value="date">Date</option>
              </select>
            </div>

            {/* Scope Filter */}
            <div className="min-w-[150px]">
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white"
              >
                <option value="all">All Scopes</option>
                <option value="workflow">Workflow</option>
                <option value="node">Node</option>
                <option value="global">Global</option>
              </select>
            </div>
          </div>
        </div>

        {/* Variables Table */}
        <div className="h-[calc(90vh-200px)] overflow-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <RefreshCw className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
                <p className="mt-3 text-slate-600 font-medium">Loading variables...</p>
              </div>
            </div>
          ) : filteredVariables.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                  <Database className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-900">No variables found</p>
                <p className="mt-2 text-sm text-slate-600">
                  {searchQuery || typeFilter !== 'all' || scopeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Variables will appear here during workflow execution'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Type</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Value</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Scope</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Updated</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariables.map((variable, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 hover:bg-indigo-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {variable.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center space-x-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                            TYPE_COLORS[variable.type] || TYPE_COLORS.null
                          }`}
                        >
                          {TYPE_ICONS[variable.type]}
                          <span className="capitalize">{variable.type}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-700">
                          {formatValue(variable.value, variable.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                            SCOPE_COLORS[variable.scope] || SCOPE_COLORS.workflow
                          }`}
                        >
                          {variable.scope}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {variable.updated_at
                          ? new Date(variable.updated_at).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => loadVariableHistory(variable.name)}
                            className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View History"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => addToWatchList(variable.name)}
                            className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Add to Watch List"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-3.5">
          <div className="flex justify-between text-sm text-slate-600">
            <span className="font-medium">
              Showing {filteredVariables.length} of {variables.length} variables
            </span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Variable History Modal */}
        {showHistory && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-2/3 max-h-[80vh] overflow-auto rounded-2xl bg-white shadow-2xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Variable History</h3>
                  <p className="text-sm text-slate-600">
                    Changes for <span className="font-mono font-medium text-indigo-600">{selectedVariable}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 bg-slate-50">
                {variableHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600">No history available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variableHistory.map((change, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span
                                className={`inline-flex items-center space-x-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                                  TYPE_COLORS[change.type] || TYPE_COLORS.null
                                }`}
                              >
                                {TYPE_ICONS[change.type]}
                                <span className="capitalize">{change.type}</span>
                              </span>
                              <span className="text-sm text-slate-600">
                                {new Date(change.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-slate-700 mb-1">Value:</p>
                              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                                <p className="font-mono text-sm text-slate-900">
                                  {formatValue(change.value, change.type)}
                                </p>
                              </div>
                            </div>
                            {change.description && (
                              <p className="mt-2 text-sm text-slate-600">{change.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VariableManagementPanelModern;