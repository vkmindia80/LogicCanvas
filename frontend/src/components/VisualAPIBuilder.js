import React, { useState } from 'react';
import { Plus, Trash2, Code, Eye, AlertCircle } from 'lucide-react';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const AUTH_TYPES = [
  { value: 'none', label: 'No Authentication' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apikey', label: 'API Key' }
];

const VisualAPIBuilder = ({ value, onChange }) => {
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'json'
  const [config, setConfig] = useState(() => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {
          url: '',
          method: 'GET',
          headers: [],
          queryParams: [],
          body: {},
          auth: { type: 'none' }
        };
      }
    }
    return value || {
      url: '',
      method: 'GET',
      headers: [],
      queryParams: [],
      body: {},
      auth: { type: 'none' }
    };
  });

  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    if (onChange) {
      onChange(newConfig);
    }
  };

  const addHeader = () => {
    const newHeaders = [...(config.headers || []), { key: '', value: '' }];
    updateConfig({ headers: newHeaders });
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...config.headers];
    newHeaders[index][field] = value;
    updateConfig({ headers: newHeaders });
  };

  const removeHeader = (index) => {
    const newHeaders = config.headers.filter((_, i) => i !== index);
    updateConfig({ headers: newHeaders });
  };

  const addQueryParam = () => {
    const newParams = [...(config.queryParams || []), { key: '', value: '' }];
    updateConfig({ queryParams: newParams });
  };

  const updateQueryParam = (index, field, value) => {
    const newParams = [...config.queryParams];
    newParams[index][field] = value;
    updateConfig({ queryParams: newParams });
  };

  const removeQueryParam = (index) => {
    const newParams = config.queryParams.filter((_, i) => i !== index);
    updateConfig({ queryParams: newParams });
  };

  if (viewMode === 'json') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-700">API Configuration (JSON)</label>
          <button
            onClick={() => setViewMode('visual')}
            className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <Eye className="w-4 h-4" />
            <span>Visual Editor</span>
          </button>
        </div>
        <textarea
          value={JSON.stringify(config, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setConfig(parsed);
              if (onChange) onChange(parsed);
            } catch {
              // Invalid JSON, don't update
            }
          }}
          className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="visual-api-builder">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">API Configuration</label>
        <button
          onClick={() => setViewMode('json')}
          className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
        >
          <Code className="w-4 h-4" />
          <span>JSON View</span>
        </button>
      </div>

      {/* URL & Method */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Method</label>
          <select
            value={config.method}
            onChange={(e) => updateConfig({ method: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            data-testid="api-method"
          >
            {HTTP_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        <div className="col-span-9">
          <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
          <input
            type="text"
            value={config.url}
            onChange={(e) => updateConfig({ url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            data-testid="api-url"
          />
        </div>
      </div>

      {/* Authentication */}
      <div className="border-t pt-3">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Authentication</label>
        <select
          value={config.auth?.type || 'none'}
          onChange={(e) => updateConfig({ auth: { ...config.auth, type: e.target.value } })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm mb-2"
          data-testid="auth-type"
        >
          {AUTH_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        {config.auth?.type === 'bearer' && (
          <input
            type="text"
            value={config.auth?.token || ''}
            onChange={(e) => updateConfig({ auth: { ...config.auth, token: e.target.value } })}
            placeholder="Bearer token"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            data-testid="auth-token"
          />
        )}

        {config.auth?.type === 'basic' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={config.auth?.username || ''}
              onChange={(e) => updateConfig({ auth: { ...config.auth, username: e.target.value } })}
              placeholder="Username"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <input
              type="password"
              value={config.auth?.password || ''}
              onChange={(e) => updateConfig({ auth: { ...config.auth, password: e.target.value } })}
              placeholder="Password"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
        )}

        {config.auth?.type === 'apikey' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={config.auth?.keyName || ''}
              onChange={(e) => updateConfig({ auth: { ...config.auth, keyName: e.target.value } })}
              placeholder="Key name (e.g., X-API-Key)"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <input
              type="text"
              value={config.auth?.keyValue || ''}
              onChange={(e) => updateConfig({ auth: { ...config.auth, keyValue: e.target.value } })}
              placeholder="API key value"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
        )}
      </div>

      {/* Headers */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">Headers</label>
          <button
            onClick={addHeader}
            className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
            data-testid="add-header"
          >
            <Plus className="w-4 h-4" />
            <span>Add Header</span>
          </button>
        </div>
        <div className="space-y-2">
          {(config.headers || []).map((header, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                placeholder="Header name"
                className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                placeholder="Header value"
                className="col-span-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <button
                onClick={() => removeHeader(index)}
                className="col-span-1 flex items-center justify-center text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Query Parameters */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">Query Parameters</label>
          <button
            onClick={addQueryParam}
            className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
            data-testid="add-query-param"
          >
            <Plus className="w-4 h-4" />
            <span>Add Parameter</span>
          </button>
        </div>
        <div className="space-y-2">
          {(config.queryParams || []).map((param, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={param.key}
                onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                placeholder="Parameter name"
                className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <input
                type="text"
                value={param.value}
                onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                placeholder="Parameter value (use ${variable} for dynamic)"
                className="col-span-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <button
                onClick={() => removeQueryParam(index)}
                className="col-span-1 flex items-center justify-center text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Request Body (for POST/PUT/PATCH) */}
      {['POST', 'PUT', 'PATCH'].includes(config.method) && (
        <div className="border-t pt-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Request Body</label>
          <textarea
            value={typeof config.body === 'string' ? config.body : JSON.stringify(config.body, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateConfig({ body: parsed });
              } catch {
                updateConfig({ body: e.target.value });
              }
            }}
            placeholder='{\n  "key": "value"\n}'
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            data-testid="request-body"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Use ${'{variable}'} syntax to insert workflow variables
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Dynamic Variables</p>
            <p>Use ${'{variableName}'} to reference workflow variables in URL, headers, query params, or body.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualAPIBuilder;
