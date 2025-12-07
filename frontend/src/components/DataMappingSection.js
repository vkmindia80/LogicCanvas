import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  ArrowRight,
  Code,
  Database,
  CheckCircle,
  AlertTriangle,
  Settings
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const DataMappingSection = ({ node, instanceId, onMappingChange }) => {
  const [inputMappings, setInputMappings] = useState([]);
  const [outputMappings, setOutputMappings] = useState([]);
  const [availableVariables, setAvailableVariables] = useState([]);
  const [showExpressionBuilder, setShowExpressionBuilder] = useState(false);
  const [currentMapping, setCurrentMapping] = useState(null);

  useEffect(() => {
    // Load existing mappings from node data
    const nodeData = node?.data || {};
    setInputMappings(nodeData.inputMappings || []);
    setOutputMappings(nodeData.outputMappings || []);

    // Load available variables if instance is provided
    if (instanceId) {
      loadAvailableVariables();
    }
  }, [node, instanceId]);

  const loadAvailableVariables = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/instances/${instanceId}/variables`);
      const data = await response.json();
      setAvailableVariables(data.variables || []);
    } catch (error) {
      console.error('Error loading variables:', error);
    }
  };

  const addInputMapping = () => {
    const newMapping = {
      id: `input_${Date.now()}`,
      sourceVariable: '',
      targetField: '',
      transformation: '',
      required: false
    };
    setInputMappings([...inputMappings, newMapping]);
    notifyChange([...inputMappings, newMapping], outputMappings);
  };

  const addOutputMapping = () => {
    const newMapping = {
      id: `output_${Date.now()}`,
      sourceField: '',
      targetVariable: '',
      transformation: '',
      createIfMissing: true
    };
    setOutputMappings([...outputMappings, newMapping]);
    notifyChange(inputMappings, [...outputMappings, newMapping]);
  };

  const updateInputMapping = (id, field, value) => {
    const updated = inputMappings.map((m) =>
      m.id === id ? { ...m, [field]: value } : m
    );
    setInputMappings(updated);
    notifyChange(updated, outputMappings);
  };

  const updateOutputMapping = (id, field, value) => {
    const updated = outputMappings.map((m) =>
      m.id === id ? { ...m, [field]: value } : m
    );
    setOutputMappings(updated);
    notifyChange(inputMappings, updated);
  };

  const removeInputMapping = (id) => {
    const updated = inputMappings.filter((m) => m.id !== id);
    setInputMappings(updated);
    notifyChange(updated, outputMappings);
  };

  const removeOutputMapping = (id) => {
    const updated = outputMappings.filter((m) => m.id !== id);
    setOutputMappings(updated);
    notifyChange(inputMappings, updated);
  };

  const notifyChange = (inputMaps, outputMaps) => {
    if (onMappingChange) {
      onMappingChange({
        inputMappings: inputMaps,
        outputMappings: outputMaps
      });
    }
  };

  const openExpressionBuilder = (mapping, type) => {
    setCurrentMapping({ ...mapping, type });
    setShowExpressionBuilder(true);
  };

  const saveExpression = (expression) => {
    if (!currentMapping) return;

    if (currentMapping.type === 'input') {
      updateInputMapping(currentMapping.id, 'transformation', expression);
    } else {
      updateOutputMapping(currentMapping.id, 'transformation', expression);
    }

    setShowExpressionBuilder(false);
    setCurrentMapping(null);
  };

  const validateMapping = (mapping, type) => {
    if (type === 'input') {
      return mapping.sourceVariable && mapping.targetField;
    } else {
      return mapping.sourceField && mapping.targetVariable;
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Mappings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Input Mappings</h4>
            <p className="text-xs text-gray-600">Map variables to node inputs</p>
          </div>
          <button
            onClick={addInputMapping}
            className="flex items-center space-x-1 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-100"
          >
            <Plus className="h-4 w-4" />
            <span>Add Input</span>
          </button>
        </div>

        {inputMappings.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <Database className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-600">No input mappings configured</p>
            <p className="text-xs text-gray-500">Click "Add Input" to create a mapping</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inputMappings.map((mapping) => (
              <div key={mapping.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start space-x-3">
                  {/* Source Variable */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Source Variable
                    </label>
                    <select
                      value={mapping.sourceVariable}
                      onChange={(e) =>
                        updateInputMapping(mapping.id, 'sourceVariable', e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Select variable...</option>
                      {availableVariables.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Arrow */}
                  <div className="mt-7">
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Target Field */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Target Field
                    </label>
                    <input
                      type="text"
                      value={mapping.targetField}
                      onChange={(e) =>
                        updateInputMapping(mapping.id, 'targetField', e.target.value)
                      }
                      placeholder="Field name"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="mt-7 flex space-x-1">
                    <button
                      onClick={() => openExpressionBuilder(mapping, 'input')}
                      className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
                      title="Add transformation"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                    {validateMapping(mapping, 'input') ? (
                      <CheckCircle className="h-5 w-5 text-green-500" title="Valid mapping" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500" title="Incomplete mapping" />
                    )}
                    <button
                      onClick={() => removeInputMapping(mapping.id)}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      title="Remove mapping"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Transformation Expression */}
                {mapping.transformation && (
                  <div className="mt-2 rounded-md bg-gray-700 p-2">
                    <code className="text-xs text-gray-100">{mapping.transformation}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Output Mappings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Output Mappings</h4>
            <p className="text-xs text-gray-600">Map node outputs to variables</p>
          </div>
          <button
            onClick={addOutputMapping}
            className="flex items-center space-x-1 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-100"
          >
            <Plus className="h-4 w-4" />
            <span>Add Output</span>
          </button>
        </div>

        {outputMappings.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <Database className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-600">No output mappings configured</p>
            <p className="text-xs text-gray-500">Click "Add Output" to create a mapping</p>
          </div>
        ) : (
          <div className="space-y-3">
            {outputMappings.map((mapping) => (
              <div key={mapping.id} className="rounded-lg border border-gray-200 bg-green-50 p-4">
                <div className="flex items-start space-x-3">
                  {/* Source Field */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Source Field
                    </label>
                    <input
                      type="text"
                      value={mapping.sourceField}
                      onChange={(e) =>
                        updateOutputMapping(mapping.id, 'sourceField', e.target.value)
                      }
                      placeholder="output.fieldName"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Arrow */}
                  <div className="mt-7">
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Target Variable */}
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Target Variable
                    </label>
                    <input
                      type="text"
                      value={mapping.targetVariable}
                      onChange={(e) =>
                        updateOutputMapping(mapping.id, 'targetVariable', e.target.value)
                      }
                      placeholder="Variable name"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="mt-7 flex space-x-1">
                    <button
                      onClick={() => openExpressionBuilder(mapping, 'output')}
                      className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
                      title="Add transformation"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                    {validateMapping(mapping, 'output') ? (
                      <CheckCircle className="h-5 w-5 text-green-500" title="Valid mapping" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500" title="Incomplete mapping" />
                    )}
                    <button
                      onClick={() => removeOutputMapping(mapping.id)}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      title="Remove mapping"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Transformation Expression */}
                {mapping.transformation && (
                  <div className="mt-2 rounded-md bg-gray-700 p-2">
                    <code className="text-xs text-gray-100">{mapping.transformation}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expression Builder Modal */}
      {showExpressionBuilder && (
        <ExpressionBuilderModal
          mapping={currentMapping}
          variables={availableVariables}
          onSave={saveExpression}
          onClose={() => {
            setShowExpressionBuilder(false);
            setCurrentMapping(null);
          }}
        />
      )}
    </div>
  );
};

// Expression Builder Modal Component
const ExpressionBuilderModal = ({ mapping, variables, onSave, onClose }) => {
  const [expression, setExpression] = useState(mapping?.transformation || '');

  const insertVariable = (variableName) => {
    setExpression((prev) => prev + `\${${variableName}}`);
  };

  const commonExpressions = [
    { label: 'To Uppercase', value: '.toUpperCase()' },
    { label: 'To Lowercase', value: '.toLowerCase()' },
    { label: 'Trim', value: '.trim()' },
    { label: 'To Number', value: 'Number()' },
    { label: 'To String', value: 'String()' },
    { label: 'To Boolean', value: 'Boolean()' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-2/3 max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900">Expression Builder</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-600 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Expression Input */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Transformation Expression
            </label>
            <textarea
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Enter JavaScript expression (e.g., ${variable}.toUpperCase())"
            />
            <p className="mt-1 text-xs text-gray-600">
              Use <code className="rounded bg-gray-100 px-1">${'{'}variable{'}'}</code> to reference
              variables
            </p>
          </div>

          {/* Available Variables */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Insert Variable
            </label>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <button
                  key={v.name}
                  onClick={() => insertVariable(v.name)}
                  className="rounded-md bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Common Expressions */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Common Transformations
            </label>
            <div className="flex flex-wrap gap-2">
              {commonExpressions.map((expr) => (
                <button
                  key={expr.label}
                  onClick={() => setExpression((prev) => prev + expr.value)}
                  className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  {expr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(expression)}
              className="flex-1 rounded-lg bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-600"
            >
              Save Expression
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMappingSection;
