import React, { useState, useEffect } from 'react';
import { X, Filter, Search, Clock, Eye, AlertCircle, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const VariableInspector = ({ instanceId, currentNodeId, onClose }) => {
  const [variables, setVariables] = useState([]);
  const [variableHistory, setVariableHistory] = useState([]);
  const [filterScope, setFilterScope] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [highlightChanges, setHighlightChanges] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (instanceId) {
      loadVariables();
      const interval = setInterval(loadVariables, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [instanceId]);

  const loadVariables = async () => {
    if (!instanceId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflow-instances/${instanceId}`);
      if (response.ok) {
        const instance = await response.json();
        const vars = instance.variables || {};
        const executionLog = instance.execution_log || [];
        
        // Convert to array with metadata
        const varsArray = Object.entries(vars).map(([name, value]) => ({
          name,
          value,
          type: Array.isArray(value) ? 'array' : typeof value,
          scope: 'instance',
          isActive: currentNodeId ? isVariableActiveInNode(name, currentNodeId, executionLog) : false,
          lastModified: getLastModifiedTime(name, executionLog)
        }));
        
        // Track changes for highlighting
        if (variables.length > 0 && highlightChanges) {
          const changes = detectChanges(variables, varsArray);
          if (changes.length > 0) {
            setVariableHistory(prev => [...changes, ...prev].slice(0, 50)); // Keep last 50 changes
          }
        }
        
        setVariables(varsArray);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to load variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectChanges = (oldVars, newVars) => {
    const changes = [];
    newVars.forEach(newVar => {
      const oldVar = oldVars.find(v => v.name === newVar.name);
      if (oldVar && JSON.stringify(oldVar.value) !== JSON.stringify(newVar.value)) {
        changes.push({
          name: newVar.name,
          oldValue: oldVar.value,
          newValue: newVar.value,
          timestamp: new Date(),
          type: newVar.type
        });
      }
    });
    return changes;
  };

  const isVariableActiveInNode = (varName, nodeId, executionLog) => {
    // Check if variable was recently used in current node
    const recentLogs = executionLog.slice(-5);
    return recentLogs.some(log => 
      log.node_id === nodeId && 
      log.message && 
      log.message.includes(varName)
    );
  };

  const getLastModifiedTime = (varName, executionLog) => {
    const relevantLog = executionLog
      .reverse()
      .find(log => log.message && log.message.includes(varName));
    return relevantLog ? new Date(relevantLog.timestamp) : null;
  };

  const filteredVariables = variables.filter(variable => {
    // Filter by scope
    if (filterScope !== 'all' && variable.scope !== filterScope) return false;
    
    // Filter by type
    if (filterType !== 'all' && variable.type !== filterType) return false;
    
    // Filter by search query
    if (searchQuery && !variable.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const getTypeColor = (type) => {
    const colors = {
      string: 'bg-green-100 text-green-700 border-green-200',
      number: 'bg-green-100 text-green-700 border-green-200',
      boolean: 'bg-gold-100 text-gold-700 border-gold-200',
      object: 'bg-gold-100 text-gold-700 border-gold-200',
      array: 'bg-pink-100 text-pink-700 border-pink-200',
      date: 'bg-cyan-100 text-cyan-700 border-cyan-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatValue = (value) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-green-500 to-gold-500">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Variable Inspector</span>
          </h3>
          <p className="text-xs text-white opacity-90">
            Real-time variable debugging
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadVariables}
            disabled={loading}
            className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
            title="Refresh"
            data-testid="refresh-inspector"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
            data-testid="close-inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search variables..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            data-testid="search-variables"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            data-testid="filter-scope"
          >
            <option value="all">All Scopes</option>
            <option value="workflow">Workflow</option>
            <option value="node">Node</option>
            <option value="global">Global</option>
            <option value="instance">Instance</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            data-testid="filter-type"
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

        {/* Status */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Filter className="w-3 h-3" />
            <span>{filteredVariables.length} of {variables.length} variables</span>
          </div>
          {lastUpdated && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Updated {formatTimeAgo(lastUpdated)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredVariables.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p>No variables found</p>
            {searchQuery && (
              <p className="text-xs mt-1">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredVariables.map((variable, index) => (
              <div
                key={`${variable.name}-${index}`}
                className={`border rounded-lg p-3 transition-all ${
                  variable.isActive 
                    ? 'border-green-400 bg-green-50 shadow-md animate-pulse-subtle' 
                    : 'border-slate-200 bg-white hover:shadow-md'
                }`}
                data-testid="variable-item"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {variable.isActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Active in current node" />
                      )}
                      <span className="font-mono text-sm font-semibold text-slate-800">
                        {variable.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getTypeColor(variable.type)}`}>
                        {variable.type}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                        {variable.scope}
                      </span>
                      {variable.lastModified && (
                        <span className="text-xs text-slate-500">
                          {formatTimeAgo(variable.lastModified)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded p-2 mt-2">
                  <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                    {formatValue(variable.value)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variable History */}
      {variableHistory.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 max-h-48 overflow-y-auto">
          <div className="p-3">
            <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Recent Changes</span>
            </h4>
            <div className="space-y-1">
              {variableHistory.slice(0, 10).map((change, index) => (
                <div 
                  key={`${change.name}-${index}`} 
                  className="text-xs text-slate-600 bg-white rounded p-2 border border-slate-200"
                >
                  <div className="font-mono font-semibold">{change.name}</div>
                  <div className="text-slate-500 mt-1">
                    <span className="line-through">{formatValue(change.oldValue)}</span>
                    {' → '}
                    <span className="text-green-600 font-semibold">{formatValue(change.newValue)}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] mt-1">
                    {formatTimeAgo(change.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="text-xs text-slate-600 text-center">
          <p className="font-semibold">{filteredVariables.length} Active Variable{filteredVariables.length !== 1 ? 's' : ''}</p>
          <p className="text-slate-500 mt-1">Real-time monitoring enabled</p>
        </div>
      </div>
    </div>
  );
};

export default VariableInspector;
