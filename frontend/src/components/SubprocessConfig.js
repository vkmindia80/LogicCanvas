import React, { useState, useEffect } from 'react';
import { X, Workflow, GitBranch, ArrowRight, Plus, Trash2, AlertCircle, CheckCircle, Settings } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const SubprocessConfig = ({ nodeData, onChange, onClose }) => {
  const [workflows, setWorkflows] = useState([]);
  const [versions, setVersions] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(nodeData?.subprocessWorkflowId || '');
  const [selectedVersion, setSelectedVersion] = useState(nodeData?.subprocessVersion || 'latest');
  const [inputMapping, setInputMapping] = useState(nodeData?.inputMapping || {});
  const [outputMapping, setOutputMapping] = useState(nodeData?.outputMapping || {});
  const [contextIsolation, setContextIsolation] = useState(nodeData?.contextIsolation !== false);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubprocessWorkflows();
  }, []);

  useEffect(() => {
    if (selectedWorkflow) {
      loadVersions();
      validateSubprocess();
    }
  }, [selectedWorkflow, selectedVersion]);

  const loadSubprocessWorkflows = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows/subprocess-compatible`);
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadVersions = async () => {
    if (!selectedWorkflow) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows/${selectedWorkflow}/versions/list`);
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const validateSubprocess = async () => {
    if (!selectedWorkflow) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows/${selectedWorkflow}/validate-subprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: selectedVersion })
      });
      const data = await response.json();
      setValidation(data);
    } catch (error) {
      console.error('Failed to validate:', error);
      setValidation({ valid: false, errors: ['Validation failed'] });
    } finally {
      setLoading(false);
    }
  };

  const addInputMapping = () => {
    const newKey = `input_${Object.keys(inputMapping).length + 1}`;
    setInputMapping({ ...inputMapping, [newKey]: '' });
  };

  const removeInputMapping = (key) => {
    const updated = { ...inputMapping };
    delete updated[key];
    setInputMapping(updated);
  };

  const updateInputMapping = (oldKey, newKey, value) => {
    const updated = { ...inputMapping };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = value;
    setInputMapping(updated);
  };

  const addOutputMapping = () => {
    const newKey = `output_${Object.keys(outputMapping).length + 1}`;
    setOutputMapping({ ...outputMapping, [newKey]: '' });
  };

  const removeOutputMapping = (key) => {
    const updated = { ...outputMapping };
    delete updated[key];
    setOutputMapping(updated);
  };

  const updateOutputMapping = (oldKey, newKey, value) => {
    const updated = { ...outputMapping };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = value;
    setOutputMapping(updated);
  };

  const handleSave = () => {
    const config = {
      subprocessWorkflowId: selectedWorkflow,
      subprocessVersion: selectedVersion,
      inputMapping,
      outputMapping,
      contextIsolation
    };
    
    onChange(config);
    onClose();
  };

  const selectedWorkflowObj = workflows.find(w => w.id === selectedWorkflow);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Workflow className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Configure Subprocess</h2>
                <p className="text-violet-100 text-sm">Set up nested workflow execution</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-subprocess-config"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Workflow Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Subprocess Workflow <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              data-testid="subprocess-workflow-select"
            >
              <option value="">-- Select a workflow --</option>
              {workflows.map(workflow => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name} {workflow.lifecycle_state && `(${workflow.lifecycle_state})`}
                </option>
              ))}
            </select>
            {selectedWorkflowObj && (
              <p className="mt-1 text-sm text-gray-600">{selectedWorkflowObj.description}</p>
            )}
          </div>

          {/* Version Selection */}
          {selectedWorkflow && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Workflow Version
              </label>
              <div className="flex items-center space-x-3">
                <GitBranch className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  data-testid="subprocess-version-select"
                >
                  <option value="latest">Latest Version</option>
                  <option value="published">Latest Published</option>
                  {versions.map(version => (
                    <option key={version.id} value={version.version}>
                      v{version.version} {version.comment && `- ${version.comment}`}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Pin to a specific version for consistency, or use 'Latest' for automatic updates
              </p>
            </div>
          )}

          {/* Validation Status */}
          {validation && (
            <div className={`border rounded-lg p-4 ${
              validation.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start space-x-3">
                {validation.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold ${validation.valid ? 'text-green-900' : 'text-red-900'}`}>
                    {validation.valid ? 'Workflow Valid' : 'Validation Failed'}
                  </h4>
                  {validation.errors && validation.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-800 space-y-1">
                      {validation.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  )}
                  {validation.warnings && validation.warnings.length > 0 && (
                    <ul className="mt-2 text-sm text-yellow-800 space-y-1">
                      {validation.warnings.map((warning, idx) => (
                        <li key={idx}>⚠ {warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Context Isolation */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Settings className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contextIsolation}
                    onChange={(e) => setContextIsolation(e.target.checked)}
                    className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                    data-testid="context-isolation-checkbox"
                  />
                  <span className="font-medium text-gray-900">Enable Context Isolation</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, the subprocess runs in an isolated context with only explicitly mapped variables
                </p>
              </div>
            </div>
          </div>

          {/* Input Mapping */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Input Mapping</h3>
              <button
                onClick={addInputMapping}
                className="flex items-center space-x-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors text-sm"
                data-testid="add-input-mapping"
              >
                <Plus className="w-4 h-4" />
                <span>Add Input</span>
              </button>
            </div>
            <div className="space-y-2">
              {Object.keys(inputMapping).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No input mappings defined</p>
                  <p className="text-sm">Click "Add Input" to map parent variables to subprocess inputs</p>
                </div>
              ) : (
                Object.entries(inputMapping).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => updateInputMapping(key, e.target.value, value)}
                      placeholder="Subprocess variable name"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateInputMapping(key, key, e.target.value)}
                      placeholder="Parent variable or ${expression}"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeInputMapping(key)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Output Mapping */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Output Mapping</h3>
              <button
                onClick={addOutputMapping}
                className="flex items-center space-x-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors text-sm"
                data-testid="add-output-mapping"
              >
                <Plus className="w-4 h-4" />
                <span>Add Output</span>
              </button>
            </div>
            <div className="space-y-2">
              {Object.keys(outputMapping).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No output mappings defined</p>
                  <p className="text-sm">Click "Add Output" to map subprocess results back to parent variables</p>
                </div>
              ) : (
                Object.entries(outputMapping).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => updateOutputMapping(key, e.target.value, value)}
                      placeholder="Parent variable name"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateOutputMapping(key, key, e.target.value)}
                      placeholder="Subprocess result variable"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeOutputMapping(key)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedWorkflow || (validation && !validation.valid)}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            data-testid="save-subprocess-config"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubprocessConfig;
