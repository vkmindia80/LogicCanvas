import React, { useState } from 'react';
import { Play, RefreshCw, Save, Download, Upload, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import TransformationFunctionLibrary from './TransformationFunctionLibrary';
import DataTransformationMapper from './DataTransformationMapper';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const TransformationPlayground = ({ onClose, sidebarCollapsed = false }) => {
  const [inputData, setInputData] = useState('{\n  "name": "John Doe",\n  "email": "john@example.com",\n  "age": 30\n}');
  const [transformations, setTransformations] = useState([]);
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('builder'); // 'builder', 'library', 'examples'
  const [error, setError] = useState(null);

  const exampleTransformations = [
    {
      name: 'Extract Email Domain',
      description: 'Extract domain from email address',
      input: '{"email": "user@example.com"}',
      transformations: [
        { id: 1, function: 'jsonpath', args: ['$', '$.email'] },
        { id: 2, function: 'split', args: ['{previous_result}', '@'] },
        { id: 3, function: 'last', args: ['{previous_result}'] }
      ]
    },
    {
      name: 'Calculate Total Price',
      description: 'Sum array of prices with tax',
      input: '{"prices": [10.99, 25.50, 8.75], "taxRate": 0.08}',
      transformations: [
        { id: 1, function: 'jsonpath', args: ['$', '$.prices'] },
        { id: 2, function: 'sum', args: ['{previous_result}'] },
        { id: 3, function: 'round', args: ['{previous_result}', 2] }
      ]
    },
    {
      name: 'Format Date',
      description: 'Parse and format date string',
      input: '{"orderDate": "2024-01-15"}',
      transformations: [
        { id: 1, function: 'jsonpath', args: ['$', '$.orderDate'] },
        { id: 2, function: 'format_date', args: ['{previous_result}', '%B %d, %Y'] }
      ]
    },
    {
      name: 'Clean & Uppercase Names',
      description: 'Trim whitespace and convert to uppercase',
      input: '{"names": ["  alice  ", "  bob  ", "  charlie  "]}',
      transformations: [
        { id: 1, function: 'jsonpath', args: ['$', '$.names'] },
        { id: 2, function: 'map', args: ['{previous_result}', null] },
        { id: 3, function: 'uppercase', args: ['{previous_result}'] }
      ]
    }
  ];

  const runTransformations = async () => {
    if (transformations.length === 0) {
      setError('Add at least one transformation step');
      return;
    }

    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      let parsedInput;
      try {
        parsedInput = JSON.parse(inputData);
      } catch {
        parsedInput = inputData;
      }

      const response = await fetch(`${API_URL}/api/transformations/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsedInput,
          transformations: transformations.map(t => ({
            function: t.function,
            args: t.args,
            kwargs: t.kwargs || {}
          }))
        })
      });

      const result = await response.json();
      setOutput(result);
    } catch (err) {
      setError(err.message || 'Failed to run transformations');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example) => {
    setInputData(example.input);
    setTransformations(example.transformations);
    setActiveTab('builder');
    setOutput(null);
    setError(null);
  };

  const resetPlayground = () => {
    setInputData('{\n  "data": "Enter your test data here"\n}');
    setTransformations([]);
    setOutput(null);
    setError(null);
  };

  const exportConfiguration = () => {
    const config = {
      input: inputData,
      transformations,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transformation-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfiguration = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result);
        if (config.input) setInputData(config.input);
        if (config.transformations) setTransformations(config.transformations);
        setOutput(null);
        setError(null);
      } catch (err) {
        setError('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`fixed inset-0 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'} bg-white z-50 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Transformation Playground</h2>
            <p className="text-sm text-indigo-100">Test and build data transformations interactively</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-6">
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'builder'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
            data-testid="tab-builder"
          >
            Transformation Builder
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'library'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
            data-testid="tab-library"
          >
            Function Library
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'examples'
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
            data-testid="tab-examples"
          >
            Examples
          </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'builder' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Input & Transformations */}
              <div className="space-y-4">
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={runTransformations}
                    disabled={loading || transformations.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    data-testid="run-transformations-btn"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetPlayground}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    data-testid="reset-btn"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={exportConfiguration}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Export configuration"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept=".json"
                      onChange={importConfiguration}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Input Data */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Input Data
                  </label>
                  <textarea
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter JSON or plain text..."
                    data-testid="input-data"
                  />
                </div>

                {/* Transformation Steps */}
                <div>
                  <DataTransformationMapper
                    value={transformations}
                    onChange={setTransformations}
                    variables={{ test_data: inputData }}
                  />
                </div>
              </div>

              {/* Right Column - Output */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Output
                  </label>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-red-800">Error</div>
                        <div className="text-sm text-red-600 mt-1">{error}</div>
                      </div>
                    </div>
                  )}

                  {output && output.success && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-green-800">Success</div>
                          <div className="text-sm text-green-600 mt-1">
                            Executed {output.transformation_count} transformations in {output.execution_time_ms?.toFixed(2)}ms
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-2">Final Result:</div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <pre className="text-sm font-mono overflow-x-auto">
                            {JSON.stringify(output.result, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {output.steps && output.steps.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-slate-700 mb-2">Transformation Steps:</div>
                          <div className="space-y-2">
                            {output.steps.map((step, idx) => (
                              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-slate-700">
                                    Step {step.step}: <code className="text-indigo-600">{step.function}</code>
                                  </span>
                                  {step.execution_time_ms && (
                                    <span className="text-xs text-slate-500">
                                      {step.execution_time_ms.toFixed(2)}ms
                                    </span>
                                  )}
                                </div>
                                {step.success && (
                                  <pre className="text-xs text-slate-600 bg-slate-50 rounded p-2 overflow-x-auto">
                                    {JSON.stringify(step.result, null, 2)}
                                  </pre>
                                )}
                                {step.error && (
                                  <div className="text-xs text-red-600 bg-red-50 rounded p-2">{step.error}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!output && !error && (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                      <p className="text-slate-600 font-medium">No output yet</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Add transformations and click "Run" to see results
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <TransformationFunctionLibrary />
          )}

          {activeTab === 'examples' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-1">Example Transformations</h3>
                <p className="text-sm text-blue-700">
                  Click on any example to load it into the playground
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {exampleTransformations.map((example, idx) => (
                  <div
                    key={idx}
                    onClick={() => loadExample(example)}
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group"
                    data-testid={`example-${idx}`}
                  >
                    <h4 className="font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                      {example.name}
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">{example.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{example.transformations.length} steps</span>
                      <span className="text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Load Example →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransformationPlayground;
