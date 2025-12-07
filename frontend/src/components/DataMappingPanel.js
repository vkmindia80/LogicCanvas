import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Save, Code, Variable as VariableIcon, Link } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const DataMappingPanel = ({ node, workflowVariables = [], onUpdate }) => {
  const [mappings, setMappings] = useState(node.data.dataMappings || []);
  const [showExpressionBuilder, setShowExpressionBuilder] = useState(false);
  const [newMapping, setNewMapping] = useState({
    source: '',
    sourceType: 'variable', // 'variable', 'expression', 'constant'
    target: '',
    expression: ''
  });
  const [draggedVariable, setDraggedVariable] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  useEffect(() => {
    // Initialize mappings from node data
    if (node.data.dataMappings) {
      setMappings(node.data.dataMappings);
    }
  }, [node.data.dataMappings]);

  const addMapping = () => {
    if (!newMapping.target) return;

    const mapping = {
      id: `mapping-${Date.now()}`,
      source: newMapping.sourceType === 'variable' ? newMapping.source : '',
      sourceType: newMapping.sourceType,
      target: newMapping.target,
      expression: newMapping.sourceType === 'expression' ? newMapping.expression : '',
      constant: newMapping.sourceType === 'constant' ? newMapping.source : ''
    };

    const updatedMappings = [...mappings, mapping];
    setMappings(updatedMappings);
    
    // Reset form
    setNewMapping({
      source: '',
      sourceType: 'variable',
      target: '',
      expression: ''
    });
  };

  const removeMapping = (mappingId) => {
    const updatedMappings = mappings.filter(m => m.id !== mappingId);
    setMappings(updatedMappings);
  };

  const saveMappings = () => {
    if (onUpdate) {
      onUpdate(node.id, {
        data: {
          ...node.data,
          dataMappings: mappings
        }
      });
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, variable) => {
    setDraggedVariable(variable);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, targetField) => {
    e.preventDefault();
    if (draggedVariable) {
      const mapping = {
        id: `mapping-${Date.now()}`,
        source: draggedVariable.name,
        sourceType: 'variable',
        target: targetField,
        expression: '',
        constant: ''
      };
      setMappings([...mappings, mapping]);
      setDraggedVariable(null);
      setDropTarget(null);
    }
  };

  const handleDragEnter = (e, target) => {
    e.preventDefault();
    setDropTarget(target);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDropTarget(null);
  };

  const getNodeInputFields = () => {
    // Define input fields based on node type
    const fieldsByType = {
      task: ['title', 'description', 'assignedTo', 'priority', 'dueDate'],
      form: ['formId', 'formData'],
      decision: ['condition', 'inputData'],
      approval: ['approvers', 'approvalType', 'description'],
      action: ['url', 'method', 'headers', 'body'],
      assignment: ['variableName', 'value', 'expression'],
      create_record: ['collection', 'data'],
      update_record: ['collection', 'recordId', 'data'],
      delete_record: ['collection', 'recordId'],
      lookup_record: ['collection', 'query'],
    };
    return fieldsByType[node.type] || ['input'];
  };

  const getNodeOutputFields = () => {
    // Define output fields based on node type
    const fieldsByType = {
      task: ['result', 'completedBy', 'completedAt'],
      form: ['formData', 'submissionId'],
      decision: ['result', 'branch'],
      approval: ['decision', 'approvedBy', 'comment'],
      action: ['response', 'statusCode', 'error'],
      lookup_record: ['records', 'count'],
      create_record: ['recordId', 'createdAt'],
    };
    return fieldsByType[node.type] || ['output'];
  };

  const inputFields = getNodeInputFields();
  const outputFields = getNodeOutputFields();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
          <Link className="w-4 h-4 text-green-500" />
          <span>Data Mapping</span>
        </h4>
        <button
          onClick={saveMappings}
          className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium"
          data-testid="save-mappings-btn"
        >
          <Save className="w-3 h-3" />
          <span>Save</span>
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Map workflow variables to node inputs and outputs
      </p>

      {/* Available Variables (Drag Source) */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <h5 className="text-xs font-semibold text-slate-600 mb-2 flex items-center space-x-1">
          <VariableIcon className="w-3 h-3" />
          <span>Available Variables</span>
        </h5>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {workflowVariables.length === 0 ? (
            <p className="text-xs text-slate-400">No variables defined</p>
          ) : (
            workflowVariables.map((variable, index) => (
              <div
                key={`var-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, variable)}
                className="flex items-center space-x-2 px-2 py-1 bg-white border border-slate-200 rounded cursor-move hover:border-green-300 hover:bg-green-50 transition-all"
                data-testid="draggable-variable"
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-xs font-mono text-slate-700">{variable.name}</span>
                <span className="text-[10px] text-slate-500">({variable.type})</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Mappings (Drop Target) */}
      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
        <h5 className="text-xs font-semibold text-green-700 mb-2">Node Inputs</h5>
        <div className="space-y-1">
          {inputFields.map((field) => (
            <div
              key={`input-${field}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, field)}
              onDragEnter={(e) => handleDragEnter(e, field)}
              onDragLeave={handleDragLeave}
              className={`px-2 py-1.5 bg-white border rounded flex items-center justify-between transition-all ${
                dropTarget === field 
                  ? 'border-green-400 bg-green-50 shadow-md' 
                  : 'border-green-300 hover:border-green-400'
              }`}
              data-testid="drop-target-input"
            >
              <span className="text-xs font-mono text-slate-700">{field}</span>
              <span className="text-[10px] text-slate-400">Drop here</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Mappings */}
      {mappings.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-slate-600">Active Mappings</h5>
          {mappings.map((mapping) => (
            <div
              key={mapping.id}
              className="flex items-center space-x-2 p-2 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
              data-testid="mapping-item"
            >
              <div className="flex-1 flex items-center space-x-2 text-xs">
                <span className="font-mono text-slate-700 px-2 py-0.5 bg-slate-100 rounded">
                  {mapping.sourceType === 'variable' ? mapping.source : 
                   mapping.sourceType === 'expression' ? '{ expr }' : 
                   `"${mapping.constant}"`}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-mono text-slate-700 px-2 py-0.5 bg-green-100 rounded">
                  {mapping.target}
                </span>
              </div>
              <button
                onClick={() => removeMapping(mapping.id)}
                className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                title="Remove mapping"
                data-testid="remove-mapping-btn"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Mapping (Dropdown Method) */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
        <h5 className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
          <Plus className="w-3 h-3" />
          <span>Add Mapping</span>
        </h5>
        
        <select
          value={newMapping.sourceType}
          onChange={(e) => setNewMapping({ ...newMapping, sourceType: e.target.value })}
          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
          data-testid="mapping-source-type"
        >
          <option value="variable">Variable</option>
          <option value="expression">Expression</option>
          <option value="constant">Constant</option>
        </select>

        {newMapping.sourceType === 'variable' && (
          <select
            value={newMapping.source}
            onChange={(e) => setNewMapping({ ...newMapping, source: e.target.value })}
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            data-testid="mapping-source-variable"
          >
            <option value="">Select variable...</option>
            {workflowVariables.map((variable, index) => (
              <option key={`opt-${index}`} value={variable.name}>
                {variable.name} ({variable.type})
              </option>
            ))}
          </select>
        )}

        {newMapping.sourceType === 'expression' && (
          <div>
            <textarea
              value={newMapping.expression}
              onChange={(e) => setNewMapping({ ...newMapping, expression: e.target.value })}
              placeholder="e.g., ${variable1} + ${variable2}"
              rows={2}
              className="w-full px-2 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              data-testid="mapping-expression"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Use ${'{'}variableName{'}'} to reference variables
            </p>
          </div>
        )}

        {newMapping.sourceType === 'constant' && (
          <input
            type="text"
            value={newMapping.source}
            onChange={(e) => setNewMapping({ ...newMapping, source: e.target.value })}
            placeholder="Enter constant value"
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            data-testid="mapping-constant"
          />
        )}

        <select
          value={newMapping.target}
          onChange={(e) => setNewMapping({ ...newMapping, target: e.target.value })}
          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
          data-testid="mapping-target"
        >
          <option value="">Select target field...</option>
          {inputFields.map((field) => (
            <option key={`target-${field}`} value={field}>{field}</option>
          ))}
        </select>

        <button
          onClick={addMapping}
          disabled={!newMapping.target || (newMapping.sourceType === 'variable' && !newMapping.source)}
          className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="add-mapping-btn"
        >
          <Plus className="w-3 h-3" />
          <span>Add Mapping</span>
        </button>
      </div>

      {/* Output Fields Reference */}
      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
        <h5 className="text-xs font-semibold text-green-700 mb-2">Node Outputs</h5>
        <div className="space-y-1">
          {outputFields.map((field) => (
            <div
              key={`output-${field}`}
              className="px-2 py-1 bg-white border border-green-300 rounded"
            >
              <span className="text-xs font-mono text-slate-700">{field}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">
          These fields will be available to downstream nodes
        </p>
      </div>
    </div>
  );
};

export default DataMappingPanel;
