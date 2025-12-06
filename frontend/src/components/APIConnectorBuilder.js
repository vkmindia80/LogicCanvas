import React, { useState, useEffect } from 'react';
import {
  X, Save, Play, Code, Key, Settings, Globe,
  Plus, Trash2, ChevronDown, ChevronRight, Info, Check
} from 'lucide-react';

const APIConnectorBuilder = ({ onClose, connectorId = null, onSave }) => {
  const [connector, setConnector] = useState({
    name: '',
    description: '',
    category: 'custom',
    config: {
      method: 'GET',
      url: '',
      headers: {},
      query_params: {},
      body: null,
      auth: { type: 'none', config: {} }
    },
    response_mapping: [],
    error_handling: {
      retry_count: 3,
      retry_delay: 1000,
      timeout: 30000,
      on_error: 'fail'
    }
  });

  const [activeTab, setActiveTab] = useState('request'); // request, auth, response, test
  const [testVariables, setTestVariables] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    fetchTemplates();
    if (connectorId) {
      fetchConnector();
    }
  }, [connectorId]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/templates`);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchConnector = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/${connectorId}`);
      const data = await response.json();
      setConnector(data);
    } catch (error) {
      console.error('Failed to fetch connector:', error);
    }
  };

  const handleSave = async () => {
    try {
      const url = connectorId
        ? `${BACKEND_URL}/api/connectors/${connectorId}`
        : `${BACKEND_URL}/api/connectors`;

      const method = connectorId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connector)
      });

      const result = await response.json();
      onSave?.(result);
      onClose();
    } catch (error) {
      console.error('Failed to save connector:', error);
      alert('Failed to save connector');
    }
  };

  const handleTest = async () => {
    if (!connector.config.url) {
      alert('Please enter a URL first');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connector_id: connector.id || 'temp',
          config: connector.config,
          variables: testVariables
        })
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const loadTemplate = (template) => {
    setConnector({
      ...connector,
      name: template.name,
      description: template.description,
      category: template.category,
      config: template.config,
      response_mapping: template.response_mapping || []
    });
    setShowTemplates(false);
  };

  const addHeader = () => {
    const key = prompt('Header name:');
    if (key) {
      setConnector({
        ...connector,
        config: {
          ...connector.config,
          headers: { ...connector.config.headers, [key]: '' }
        }
      });
    }
  };

  const removeHeader = (key) => {
    const headers = { ...connector.config.headers };
    delete headers[key];
    setConnector({
      ...connector,
      config: { ...connector.config, headers }
    });
  };

  const addResponseMapping = () => {
    setConnector({
      ...connector,
      response_mapping: [
        ...connector.response_mapping,
        {
          source_path: '$.', 
          target_variable: '',
          type: 'string',
          transform: 'none'
        }
      ]
    });
  };

  const updateResponseMapping = (index, field, value) => {
    const mappings = [...connector.response_mapping];
    mappings[index][field] = value;
    setConnector({ ...connector, response_mapping: mappings });
  };

  const removeResponseMapping = (index) => {
    setConnector({
      ...connector,
      response_mapping: connector.response_mapping.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {connectorId ? 'Edit' : 'Create'} API Connector
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Build and configure API integrations visually
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Code size={18} className="inline mr-2" />
              Templates
            </button>
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Play size={18} className="inline mr-2" />
              {isTesting ? 'Testing...' : 'Test'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={18} className="inline mr-2" />
              Save
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Templates or Basic Info */}
            <div className="col-span-1 space-y-4">
              {showTemplates ? (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Templates</h3>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => loadTemplate(template)}
                        className="p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {template.description}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {template.category}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Info</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={connector.name}
                        onChange={(e) => setConnector({ ...connector, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Stripe Payment"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={connector.description}
                        onChange={(e) => setConnector({ ...connector, description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="What does this connector do?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={connector.category}
                        onChange={(e) => setConnector({ ...connector, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="payment">Payment</option>
                        <option value="communication">Communication</option>
                        <option value="storage">Storage</option>
                        <option value="ai">AI</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Configuration */}
            <div className="col-span-2">
              {/* Tabs */}
              <div className="flex border-b mb-4">
                {['request', 'auth', 'response', 'test'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-medium capitalize ${
                      activeTab === tab
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Request Tab */}
              {activeTab === 'request' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Method
                      </label>
                      <select
                        value={connector.config.method}
                        onChange={(e) => setConnector({
                          ...connector,
                          config: { ...connector.config, method: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL *
                      </label>
                      <input
                        type="text"
                        value={connector.config.url}
                        onChange={(e) => setConnector({
                          ...connector,
                          config: { ...connector.config, url: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://api.example.com/endpoint"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use ${'{variable}'} for dynamic values
                      </p>
                    </div>
                  </div>

                  {/* Headers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Headers
                      </label>
                      <button
                        onClick={addHeader}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        <Plus size={14} className="inline" /> Add Header
                      </button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(connector.config.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <input
                            type="text"
                            value={key}
                            disabled
                            className="w-1/3 px-3 py-2 border rounded-lg bg-gray-50"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setConnector({
                              ...connector,
                              config: {
                                ...connector.config,
                                headers: { ...connector.config.headers, [key]: e.target.value }
                              }
                            })}
                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Value"
                          />
                          <button
                            onClick={() => removeHeader(key)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  {['POST', 'PUT', 'PATCH'].includes(connector.config.method) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Request Body (JSON)
                      </label>
                      <textarea
                        value={typeof connector.config.body === 'string'
                          ? connector.config.body
                          : JSON.stringify(connector.config.body, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setConnector({
                              ...connector,
                              config: { ...connector.config, body: parsed }
                            });
                          } catch {
                            setConnector({
                              ...connector,
                              config: { ...connector.config, body: e.target.value }
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        rows="8"
                        placeholder='{\n  "key": "value"\n}'
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Auth Tab */}
              {activeTab === 'auth' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Authentication Type
                    </label>
                    <select
                      value={connector.config.auth.type}
                      onChange={(e) => setConnector({
                        ...connector,
                        config: {
                          ...connector.config,
                          auth: { type: e.target.value, config: {} }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="api_key">API Key</option>
                      <option value="basic">Basic Auth</option>
                      <option value="oauth2">OAuth 2.0</option>
                    </select>
                  </div>

                  {connector.config.auth.type !== 'none' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <Info size={16} className="inline mr-1" />
                        Configure authentication in headers using workflow variables.
                        Example: Authorization: Bearer ${'{api_token}'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Response Tab */}
              {activeTab === 'response' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Response Mapping
                    </label>
                    <button
                      onClick={addResponseMapping}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Plus size={14} className="inline" /> Add Mapping
                    </button>
                  </div>
                  <div className="space-y-3">
                    {connector.response_mapping.map((mapping, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Source Path (JSONPath)
                            </label>
                            <input
                              type="text"
                              value={mapping.source_path}
                              onChange={(e) => updateResponseMapping(index, 'source_path', e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="$.data.id"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Target Variable
                            </label>
                            <input
                              type="text"
                              value={mapping.target_variable}
                              onChange={(e) => updateResponseMapping(index, 'target_variable', e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="user_id"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Type
                            </label>
                            <select
                              value={mapping.type}
                              onChange={(e) => updateResponseMapping(index, 'type', e.target.value)}
                              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="boolean">Boolean</option>
                              <option value="array">Array</option>
                              <option value="object">Object</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => removeResponseMapping(index)}
                              className="w-full px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {connector.response_mapping.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No response mappings configured. Add mappings to extract data from API responses.
                    </p>
                  )}
                </div>
              )}

              {/* Test Tab */}
              {activeTab === 'test' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Variables (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(testVariables, null, 2)}
                      onChange={(e) => {
                        try {
                          setTestVariables(JSON.parse(e.target.value));
                        } catch {}
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows="6"
                      placeholder='{\n  "api_key": "test-key",\n  "user_id": "123"\n}'
                    />
                  </div>

                  {testResult && (
                    <div className={`p-4 rounded-lg ${
                      testResult.success ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center mb-2">
                        {testResult.success ? (
                          <Check size={18} className="text-green-600 mr-2" />
                        ) : (
                          <X size={18} className="text-red-600 mr-2" />
                        )}
                        <span className={`font-medium ${
                          testResult.success ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {testResult.success ? 'Success' : 'Failed'}
                        </span>
                        {testResult.status_code && (
                          <span className="ml-auto text-sm text-gray-600">
                            Status: {testResult.status_code}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Response:
                        </label>
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-64">
                          {JSON.stringify(testResult.response || testResult.error, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIConnectorBuilder;
