import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Play, Save, Code, Key, Lock,
  Globe, Send, Check, AlertCircle, Copy, FileJson
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const APIConnectorBuilder = ({ isOpen, onClose, connectorId = null }) => {
  const [connector, setConnector] = useState({
    name: '',
    description: '',
    base_url: '',
    auth_type: 'none',
    auth_config: {},
    headers: {},
    endpoints: [],
    tags: []
  });

  const [testResult, setTestResult] = useState(null);
  const [isT esting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);

  useEffect(() => {
    if (connectorId) {
      loadConnector();
    }
  }, [connectorId]);

  const loadConnector = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/${connectorId}`);
      if (response.ok) {
        const data = await response.json();
        setConnector(data);
      }
    } catch (error) {
      console.error('Failed to load connector:', error);
    }
  };

  const saveConnector = async () => {
    setIsSaving(true);
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

      if (response.ok) {
        alert('Connector saved successfully!');
        onClose();
      } else {
        alert('Failed to save connector');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving connector');
    } finally {
      setIsSaving(false);
    }
  };

  const testEndpoint = async (endpoint) => {
    setIsTesting(true);
    setTestResult(null);
    setSelectedEndpoint(endpoint);

    try {
      const testRequest = {
        method: endpoint.method || 'GET',
        url: `${connector.base_url}${endpoint.path || ''}`,
        headers: { ...connector.headers },
        body: endpoint.body || null,
        auth_type: connector.auth_type,
        auth_config: connector.auth_config
      };

      const response = await fetch(`${BACKEND_URL}/api/connectors/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
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

  const addEndpoint = () => {
    setConnector({
      ...connector,
      endpoints: [
        ...connector.endpoints,
        { method: 'GET', path: '/new-endpoint', description: 'New endpoint' }
      ]
    });
  };

  const updateEndpoint = (index, field, value) => {
    const updatedEndpoints = [...connector.endpoints];
    updatedEndpoints[index] = { ...updatedEndpoints[index], [field]: value };
    setConnector({ ...connector, endpoints: updatedEndpoints });
  };

  const removeEndpoint = (index) => {
    const updatedEndpoints = connector.endpoints.filter((_, i) => i !== index);
    setConnector({ ...connector, endpoints: updatedEndpoints });
  };

  const addHeader = () => {
    const key = prompt('Header name:');
    if (key) {
      setConnector({
        ...connector,
        headers: { ...connector.headers, [key]: '' }
      });
    }
  };

  const updateHeader = (key, value) => {
    setConnector({
      ...connector,
      headers: { ...connector.headers, [key]: value }
    });
  };

  const removeHeader = (key) => {
    const { [key]: removed, ...remainingHeaders } = connector.headers;
    setConnector({ ...connector, headers: remainingHeaders });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {connectorId ? 'Edit' : 'Create'} API Connector
              </h2>
              <p className="text-sm text-gray-600">Configure API endpoints and authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connector Name *
                  </label>
                  <input
                    type="text"
                    value={connector.name}
                    onChange={(e) => setConnector({ ...connector, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="My API Connector"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={connector.description}
                    onChange={(e) => setConnector({ ...connector, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Describe what this API connector does..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base URL *
                  </label>
                  <input
                    type="url"
                    value={connector.base_url}
                    onChange={(e) => setConnector({ ...connector, base_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://api.example.com"
                  />
                </div>
              </div>
            </div>

            {/* Authentication */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Authentication
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auth Type
                  </label>
                  <select
                    value={connector.auth_type}
                    onChange={(e) => setConnector({ ...connector, auth_type: e.target.value, auth_config: {} })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="api_key">API Key</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="oauth">OAuth 2.0</option>
                  </select>
                </div>

                {/* Auth Config Fields */}
                {connector.auth_type === 'api_key' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Key Name (Header)
                      </label>
                      <input
                        type="text"
                        value={connector.auth_config.key_name || ''}
                        onChange={(e) => setConnector({
                          ...connector,
                          auth_config: { ...connector.auth_config, key_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="X-API-Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key Value
                      </label>
                      <input
                        type="password"
                        value={connector.auth_config.key_value || ''}
                        onChange={(e) => setConnector({
                          ...connector,
                          auth_config: { ...connector.auth_config, key_value: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter API key..."
                      />
                    </div>
                  </div>
                )}

                {connector.auth_type === 'bearer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bearer Token
                    </label>
                    <input
                      type="password"
                      value={connector.auth_config.token || ''}
                      onChange={(e) => setConnector({
                        ...connector,
                        auth_config: { ...connector.auth_config, token: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter bearer token..."
                    />
                  </div>
                )}

                {connector.auth_type === 'basic' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={connector.auth_config.username || ''}
                        onChange={(e) => setConnector({
                          ...connector,
                          auth_config: { ...connector.auth_config, username: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={connector.auth_config.password || ''}
                        onChange={(e) => setConnector({
                          ...connector,
                          auth_config: { ...connector.auth_config, password: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Password"
                      />
                    </div>
                  </div>
                )}

                {connector.auth_type === 'oauth' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={connector.auth_config.client_id || ''}
                        onChange={(e) => setConnector({
                          ...connector,
                          auth_config: { ...connector.auth_config, client_id: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Client ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={connector.auth_config.client_secret || ''}
                        onChange={(e) => setConnector({
                          ...connector,
                          auth_config: { ...connector.auth_config, client_secret: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Client Secret"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Token URL
                      </label>
                      <input
                        type="url"
                        value={connector.auth_config.token_url || ''}
                        onChange={(e) => setConnector({
                          ...connector,
                          auth_config: { ...connector.auth_config, token_url: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="https://oauth.example.com/token"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Headers */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Request Headers
                </h3>
                <button
                  onClick={addHeader}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Header
                </button>
              </div>

              <div className="space-y-2">
                {Object.entries(connector.headers).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={key}
                      disabled
                      className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateHeader(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Header value"
                    />
                    <button
                      onClick={() => removeHeader(key)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {Object.keys(connector.headers).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No custom headers configured
                  </p>
                )}
              </div>
            </div>

            {/* Endpoints */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Endpoints
                </h3>
                <button
                  onClick={addEndpoint}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Endpoint
                </button>
              </div>

              <div className="space-y-4">
                {connector.endpoints.map((endpoint, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <select
                          value={endpoint.method || 'GET'}
                          onChange={(e) => updateEndpoint(index, 'method', e.target.value)}
                          className="w-28 px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                          <option value="PATCH">PATCH</option>
                        </select>
                        <input
                          type="text"
                          value={endpoint.path || ''}
                          onChange={(e) => updateEndpoint(index, 'path', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="/api/endpoint"
                        />
                        <button
                          onClick={() => testEndpoint(endpoint)}
                          disabled={isTesting}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                          title="Test endpoint"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeEndpoint(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={endpoint.description || ''}
                        onChange={(e) => updateEndpoint(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Endpoint description..."
                      />
                    </div>
                  </div>
                ))}
                {connector.endpoints.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No endpoints configured. Add an endpoint to get started.
                  </p>
                )}
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`rounded-lg p-4 border ${
                testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      testResult.success ? 'text-green-900' : 'text-red-900'
                    } mb-2`}>
                      {testResult.success ? 'Test Successful' : 'Test Failed'}
                    </h4>
                    {testResult.success && (
                      <div className="space-y-2 text-sm">
                        <p className="text-green-800">
                          Status: {testResult.status_code} ({testResult.elapsed_ms?.toFixed(0)}ms)
                        </p>
                        <div className="bg-white rounded p-3 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700">Response:</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(testResult.data, null, 2));
                                alert('Copied to clipboard!');
                              }}
                              className="text-blue-600 hover:text-blue-700"
                              title="Copy response"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <pre className="text-xs text-gray-600 overflow-x-auto max-h-48">
                            {JSON.stringify(testResult.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    {!testResult.success && (
                      <p className="text-sm text-red-800">
                        {testResult.error || 'Unknown error occurred'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveConnector}
            disabled={isSaving || !connector.name || !connector.base_url}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Connector'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default APIConnectorBuilder;
