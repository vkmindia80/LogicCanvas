import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const VariablePanel = ({ workflowId, instanceId, onClose }) => {
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
      string: 'bg-green-100 text-green-700',
      number: 'bg-green-100 text-green-700',
      boolean: 'bg-gold-100 text-gold-700',
      object: 'bg-gold-100 text-gold-700',
      array: 'bg-pink-100 text-pink-700',
      date: 'bg-cyan-100 text-cyan-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const formatValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-primary-500 to-green-500">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center">
            Variables
          </h3>
          <p className="text-xs text-white opacity-90">
            {instanceId ? 'Runtime Variables' : 'Workflow Variables'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {instanceId && (
            <button
              onClick={loadInstanceVariables}
              disabled={loading}
              className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
              title="Refresh"
              data-testid="refresh-variables"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
            title={showValues ? 'Hide values' : 'Show values'}
            data-testid="toggle-values"
          >
            {showValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
            data-testid="close-variable-panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add New Variable */}
      {!instanceId && (
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Add Variable</h4>
          <div className="space-y-2">
            <input
              type="text"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              placeholder="Variable name"
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              data-testid="new-var-name"
            />
            <div className="flex space-x-2">
              <select
                value={newVarType}
                onChange={(e) => setNewVarType(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="new-var-value"
              />
            </div>
            <button
              onClick={addVariable}
              className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white px-3 py-1.5 rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
              data-testid="add-variable-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add Variable</span>
            </button>
          </div>
        </div>
      )}

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto p-4">
        {variables.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <p>No variables defined</p>
            {!instanceId && (
              <p className="text-xs mt-1">Add variables to store data in your workflow</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {variables.map((variable, index) => (
              <div
                key={`${variable.name}-${index}`}
                className="border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white"
              >
                {editingVar && editingVar.index === index ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingVar.name}
                      onChange={(e) => setEditingVar({ ...editingVar, name: e.target.value })}
                      className="w-full px-2 py-1 text-sm font-mono border border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
                      data-testid="edit-var-name"
                    />
                    <select
                      value={editingVar.type}
                      onChange={(e) => setEditingVar({ ...editingVar, type: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
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
                      className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
                      data-testid="edit-var-value"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 bg-primary-500 text-white px-3 py-1 rounded text-sm hover:bg-primary-600"
                        data-testid="save-edit-btn"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-slate-200 text-slate-700 px-3 py-1 rounded text-sm hover:bg-slate-300"
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
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-semibold text-slate-800">
                            {variable.name}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(variable.type)}`}>
                            {variable.type}
                          </span>
                          {variable.scope && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                              {variable.scope}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!instanceId && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => startEdit(index)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600"
                            title="Edit"
                            data-testid="edit-var-btn"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteVariable(index)}
                            className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                            title="Delete"
                            data-testid="delete-var-btn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {showValues && (
                      <div className="bg-slate-50 rounded p-2 mt-2">
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

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="text-xs text-slate-600 text-center">
          <p className="font-semibold">{variables.length} Variable{variables.length !== 1 ? 's' : ''}</p>
          <p className="text-slate-500 mt-1">
            {instanceId ? 'Runtime variable values' : 'Define workflow variables'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VariablePanel;
