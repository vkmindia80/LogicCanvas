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
  string: 'bg-green-100 text-green-800 border-green-200',
  number: 'bg-gold-100 text-gold-800 border-gold-200',
  boolean: 'bg-green-100 text-green-800 border-green-200',
  object: 'bg-gold-100 text-gold-800 border-gold-200',
  array: 'bg-pink-100 text-pink-800 border-pink-200',
  date: 'bg-green-100 text-green-800 border-green-200',
  null: 'bg-green-100 text-primary-800 border-green-200'
};

const SCOPE_COLORS = {
  workflow: 'bg-green-100 text-green-800',
  node: 'bg-gold-100 text-gold-800',
  global: 'bg-green-100 text-green-800'
};

const VariableManagementPanel = ({ onClose, instanceId }) => {
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
      <div className="relative h-[90vh] w-[90vw] rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-green-200 bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Variable Management</h2>
              <p className="text-sm text-primary-100">
                {instanceId ? `Instance: ${instanceId.substring(0, 8)}...` : 'No instance selected'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadVariables}
              className="rounded-lg bg-white/20 p-2 hover:bg-white/30"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={exportVariables}
              className="rounded-lg bg-white/20 p-2 hover:bg-white/30"
              title="Export Variables"
              disabled={variables.length === 0}
            >
              <Download className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="rounded-lg bg-white/20 p-2 hover:bg-white/30">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-green-200 bg-green-50 px-6 py-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search variables..."
                  className="w-full rounded-lg border border-green-300 py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="min-w-[150px]">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
        <div className="h-[calc(90vh-180px)] overflow-auto p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary-500" />
                <p className="mt-2 text-primary-600">Loading variables...</p>
              </div>
            </div>
          ) : filteredVariables.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Database className="mx-auto h-16 w-16 text-green-300" />
                <p className="mt-4 text-lg font-medium text-primary-900">No variables found</p>
                <p className="mt-1 text-sm text-primary-600">
                  {searchQuery || typeFilter !== 'all' || scopeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Variables will appear here during workflow execution'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-green-200 bg-green-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-700">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-700">Scope</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-700">Updated</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariables.map((variable, index) => (
                    <tr
                      key={index}
                      className="border-b border-green-100 hover:bg-green-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-primary-900">
                          {variable.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center space-x-1 rounded-full border px-2 py-1 text-xs font-medium ${
                            TYPE_COLORS[variable.type] || TYPE_COLORS.null
                          }`}
                        >
                          {TYPE_ICONS[variable.type]}
                          <span className="capitalize">{variable.type}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-primary-700">
                          {formatValue(variable.value, variable.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                            SCOPE_COLORS[variable.scope] || SCOPE_COLORS.workflow
                          }`}
                        >
                          {variable.scope}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-primary-600">
                        {variable.updated_at
                          ? new Date(variable.updated_at).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => loadVariableHistory(variable.name)}
                            className="rounded p-1 text-primary-600 hover:bg-green-100 hover:text-primary-600"
                            title="View History"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => addToWatchList(variable.name)}
                            className="rounded p-1 text-primary-600 hover:bg-green-100 hover:text-primary-600"
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
        <div className="border-t border-green-200 bg-green-50 px-6 py-3">
          <div className="flex justify-between text-sm text-primary-600">
            <span>
              Showing {filteredVariables.length} of {variables.length} variables
            </span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Variable History Modal */}
        {showHistory && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-2/3 max-h-[80vh] overflow-auto rounded-xl bg-white shadow-2xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-green-200 bg-white px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-primary-900">Variable History</h3>
                  <p className="text-sm text-primary-600">
                    Changes for <span className="font-mono font-medium">{selectedVariable}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-lg p-2 text-primary-600 hover:bg-green-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                {variableHistory.length === 0 ? (
                  <p className="text-center text-primary-600">No history available</p>
                ) : (
                  <div className="space-y-3">
                    {variableHistory.map((change, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-green-200 bg-green-50 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center space-x-1 rounded-full border px-2 py-1 text-xs font-medium ${
                                  TYPE_COLORS[change.type] || TYPE_COLORS.null
                                }`}
                              >
                                {TYPE_ICONS[change.type]}
                                <span className="capitalize">{change.type}</span>
                              </span>
                              <span className="text-sm text-primary-600">
                                {new Date(change.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-primary-700">Value:</p>
                              <p className="font-mono text-sm text-primary-900">
                                {formatValue(change.value, change.type)}
                              </p>
                            </div>
                            {change.description && (
                              <p className="mt-2 text-sm text-primary-600">{change.description}</p>
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

export default VariableManagementPanel;
