import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const VariablePanelModern = ({ workflowId, instanceId, onClose }) => {
  const [variables, setVariables] = useState([]);
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [newVarType, setNewVarType] = useState('string');
  const [editingVar, setEditingVar] = useState(null);
  const [showValues, setShowValues] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (instanceId) {
      loadInstanceVariables();
    }
  }, [instanceId]);

  const loadInstanceVariables = async () => {
    if (!instanceId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflow-instances/${instanceId}`);
      if (response.ok) {
        const instance = await response.json();
        const vars = instance.variables || {};
        
        // Convert object to array format
        const varsArray = Object.entries(vars).map(([name, value]) => ({
          name,
          value,
          type: typeof value,
          scope: 'instance'
        }));
        
        setVariables(varsArray);
      }
    } catch (error) {
      console.error('Failed to load variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVariable = () => {
    if (!newVarName.trim()) return;

    let parsedValue = newVarValue;
    try {
      if (newVarType === 'number') {
        parsedValue = parseFloat(newVarValue);
      } else if (newVarType === 'boolean') {
        parsedValue = newVarValue === 'true';
      } else if (newVarType === 'object' || newVarType === 'array') {
        parsedValue = JSON.parse(newVarValue);
      }
    } catch (e) {
      alert('Invalid JSON for object/array type');
      return;
    }

    const newVar = {
      name: newVarName,
      value: parsedValue,
      type: newVarType,
      scope: 'workflow'
    };

    setVariables([...variables, newVar]);
    setNewVarName('');
    setNewVarValue('');
    setNewVarType('string');
  };

  const deleteVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const startEdit = (index) => {
    const v = variables[index];
    setEditingVar({
      index,
      name: v.name,
      value: typeof v.value === 'object' ? JSON.stringify(v.value, null, 2) : String(v.value),
      type: v.type
    });
  };

  const saveEdit = () => {
    if (!editingVar) return;

    let parsedValue = editingVar.value;
    try {
      if (editingVar.type === 'number') {
        parsedValue = parseFloat(editingVar.value);
      } else if (editingVar.type === 'boolean') {
        parsedValue = editingVar.value === 'true';
      } else if (editingVar.type === 'object') {
        parsedValue = JSON.parse(editingVar.value);
      }
    } catch (e) {
      alert('Invalid value format');
      return;
    }

    const updated = [...variables];
    updated[editingVar.index] = {
      ...updated[editingVar.index],
      name: editingVar.name,
      value: parsedValue,
      type: editingVar.type
    };

    setVariables(updated);
    setEditingVar(null);
  };

  const cancelEdit = () => {
    setEditingVar(null);
  };

  const getTypeColor = (type) => {
    const colors = {
      string: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      number: 'bg-purple-100 text-purple-700 border-purple-200',
      boolean: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      object: 'bg-violet-100 text-violet-700 border-violet-200',
      array: 'bg-blue-100 text-blue-700 border-blue-200',
      date: 'bg-teal-100 text-teal-700 border-teal-200'
    };
    return colors[type] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="h-full flex flex-col bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header - Modern Indigo Gradient */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center">
            Variables
          </h3>
          <p className="text-xs text-indigo-100 mt-0.5">
            {instanceId ? 'Runtime Variables' : 'Workflow Variables'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {instanceId && (
            <button
              onClick={loadInstanceVariables}
              disabled={loading}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Refresh"
              data-testid="refresh-variables"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            title={showValues ? 'Hide values' : 'Show values'}
            data-testid="toggle-values"
          >
            {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            data-testid="close-variable-panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add New Variable - Modern Slate Background */}
      {!instanceId && (
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Variable
          </h4>
          <div className="space-y-2.5">
            <input
              type="text"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              placeholder="Variable name"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              data-testid="new-var-name"
            />
            <div className="flex space-x-2">
              <select
                value={newVarType}
                onChange={(e) => setNewVarType(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                data-testid="new-var-type"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
                <option value="date">Date</option>
              </select>
              <input
                type="text"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                placeholder="Value"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                data-testid="new-var-value"
              />
            </div>
            <button
              onClick={addVariable}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm font-medium shadow-sm hover:shadow-md"
              data-testid="add-variable-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add Variable</span>
            </button>
          </div>
        </div>
      )}

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {variables.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-sm font-medium">No variables defined</p>
            {!instanceId && (
              <p className="text-xs mt-1.5 text-slate-400">Add variables to store data in your workflow</p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {variables.map((variable, index) => (
              <div
                key={`${variable.name}-${index}`}
                className="border border-slate-200 rounded-xl p-3.5 hover:shadow-md hover:shadow-indigo-500/5 transition-all bg-white"
              >
                {editingVar && editingVar.index === index ? (
                  // Edit Mode
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={editingVar.name}
                      onChange={(e) => setEditingVar({ ...editingVar, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      data-testid="edit-var-name"
                    />
                    <select
                      value={editingVar.type}
                      onChange={(e) => setEditingVar({ ...editingVar, type: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                      data-testid="edit-var-type"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="object">Object</option>
                    </select>
                    <textarea
                      value={editingVar.value}
                      onChange={(e) => setEditingVar({ ...editingVar, value: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      data-testid="edit-var-value"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        data-testid="save-edit-btn"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                        data-testid="cancel-edit-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-slate-800">
                            {variable.name}
                          </span>
                          <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium border ${getTypeColor(variable.type)}`}>
                            {variable.type}
                          </span>
                          {variable.scope && (
                            <span className="px-2.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium">
                              {variable.scope}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!instanceId && (
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => startEdit(index)}
                            className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-600"
                            title="Edit"
                            data-testid="edit-var-btn"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteVariable(index)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors text-rose-600"
                            title="Delete"
                            data-testid="delete-var-btn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {showValues && (
                      <div className="bg-slate-50 rounded-lg p-2.5 mt-2 border border-slate-200">
                        <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-all">
                          {formatValue(variable.value)}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Modern Slate Background */}
      <div className="p-3.5 border-t border-slate-200 bg-white">
        <div className="text-xs text-slate-600 text-center">
          <p className="font-semibold text-slate-700">{variables.length} Variable{variables.length !== 1 ? 's' : ''}</p>
          <p className="text-slate-500 mt-1">
            {instanceId ? 'Runtime variable values' : 'Define workflow variables'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VariablePanelModern;