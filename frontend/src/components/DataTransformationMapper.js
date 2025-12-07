import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Eye, Info, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const DataTransformationMapper = ({ value = [], onChange, variables = {} }) => {
  const [transformations, setTransformations] = useState(value || []);
  const [availableFunctions, setAvailableFunctions] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('String Operations');
  const [testResult, setTestResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available transformation functions
    const fetchFunctions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/transformations/functions`);
        const data = await response.json();
        if (data.success) {
          setAvailableFunctions(data.functions);
        }
      } catch (error) {
        console.error('Failed to fetch transformation functions:', error);
      }
    };
    fetchFunctions();
  }, []);

  useEffect(() => {
    // Notify parent of changes
    if (onChange) {
      onChange(transformations);
    }
  }, [transformations]);

  const addTransformation = () => {
    const newTransform = {
      id: Date.now(),
      function: 'uppercase',
      args: [],
      kwargs: {},
      description: ''
    };
    setTransformations([...transformations, newTransform]);
    setExpandedSteps({ ...expandedSteps, [newTransform.id]: true });
  };

  const removeTransformation = (id) => {
    setTransformations(transformations.filter(t => t.id !== id));
    const newExpanded = { ...expandedSteps };
    delete newExpanded[id];
    setExpandedSteps(newExpanded);
  };

  const updateTransformation = (id, field, value) => {
    setTransformations(transformations.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const toggleStep = (id) => {
    setExpandedSteps({ ...expandedSteps, [id]: !expandedSteps[id] });
  };

  const testTransformations = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // Get initial data from variables
      const initialData = variables.test_data || 'Sample data';
      
      const response = await fetch(`${API_URL}/api/transformations/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: initialData,
          transformations: transformations.map(t => ({
            function: t.function,
            args: t.args,
            kwargs: t.kwargs
          }))
        })
      });
      
      const result = await response.json();
      setTestResult(result);
      setShowPreview(true);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getFunctionParameters = (functionName) => {
    for (const category in availableFunctions) {
      if (availableFunctions[category][functionName]) {
        return availableFunctions[category][functionName];
      }
    }
    return { params: [], description: '' };
  };

  const categories = Object.keys(availableFunctions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary-800">Data Transformations</h3>
        <div className="flex gap-2">
          <button
            onClick={testTransformations}
            disabled={transformations.length === 0 || loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Test
              </>
            )}
          </button>
          <button
            onClick={addTransformation}
            className="flex items-center gap-2 px-3 py-1.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </button>
        </div>
      </div>

      {/* Transformation Steps */}
      <div className="space-y-3">
        {transformations.length === 0 ? (
          <div className="text-center py-12 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
            <Info className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="text-primary-600 mb-2">No transformations added yet</p>
            <p className="text-sm text-green-500">Click "Add Step" to start building your transformation pipeline</p>
          </div>
        ) : (
          transformations.map((transform, index) => {
            const funcInfo = getFunctionParameters(transform.function);
            const isExpanded = expandedSteps[transform.id] !== false;

            return (
              <div key={transform.id} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-gold-100 text-gold-700 rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-primary-900">{transform.function}</div>
                      <div className="text-xs text-green-500">{funcInfo.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStep(transform.id)}
                      className="p-1 text-green-500 hover:text-primary-700 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeTransformation(transform.id)}
                      className="p-1 text-gold-500 hover:text-gold-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t border-green-100">
                    {/* Function Selection */}
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Function
                      </label>
                      <select
                        value={transform.function}
                        onChange={(e) => updateTransformation(transform.id, 'function', e.target.value)}
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      >
                        {categories.map(category => (
                          <optgroup key={category} label={category}>
                            {Object.keys(availableFunctions[category] || {}).map(funcName => (
                              <option key={funcName} value={funcName}>
                                {funcName} - {availableFunctions[category][funcName].description}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Parameters */}
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Parameters
                        <span className="text-xs text-green-500 ml-2">
                          ({funcInfo.params?.join(', ')})
                        </span>
                      </label>
                      <input
                        type="text"
                        value={JSON.stringify(transform.args)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            updateTransformation(transform.id, 'args', Array.isArray(parsed) ? parsed : [parsed]);
                          } catch (err) {
                            // Invalid JSON, ignore
                          }
                        }}
                        placeholder='["value", "param2"]'
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent font-mono text-sm"
                      />
                      <p className="mt-1 text-xs text-green-500">
                        Use {"{previous_result}"} to reference the previous step's output
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Test Results */}
      {showPreview && testResult && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-primary-800 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Test Results
            </h4>
            <button
              onClick={() => setShowPreview(false)}
              className="text-green-500 hover:text-primary-700"
            >
              ×
            </button>
          </div>

          {testResult.success ? (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-primary-700 mb-1">Final Output:</div>
                <pre className="bg-white p-3 rounded border border-green-200 text-sm overflow-x-auto">
                  {JSON.stringify(testResult.result, null, 2)}
                </pre>
              </div>

              {testResult.steps && testResult.steps.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-primary-700 mb-2">Steps:</div>
                  <div className="space-y-2">
                    {testResult.steps.map((step, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-green-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-primary-600">
                            Step {step.step}: {step.function}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            step.success ? 'bg-green-100 text-green-700' : 'bg-gold-100 text-gold-700'
                          }`}>
                            {step.success ? '✓ Success' : '✗ Failed'}
                          </span>
                        </div>
                        {step.success && (
                          <pre className="text-xs text-primary-600 overflow-x-auto">
                            {JSON.stringify(step.result, null, 2)}
                          </pre>
                        )}
                        {step.error && (
                          <div className="text-xs text-gold-600">{step.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gold-50 border border-gold-200 rounded p-3">
              <div className="text-sm font-medium text-gold-800 mb-1">Error</div>
              <div className="text-sm text-gold-600">{testResult.error}</div>
            </div>
          )}
        </div>
      )}

      {/* Quick Reference */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-green-600 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Quick Tips:</p>
            <ul className="list-disc list-inside space-y-0.5 text-green-700">
              <li>Add multiple steps to create a transformation pipeline</li>
              <li>Use {"{previous_result}"} to chain transformations</li>
              <li>Test your transformations before saving</li>
              <li>57 functions available across 7 categories</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTransformationMapper;
