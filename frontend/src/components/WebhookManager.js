import React, { useState, useEffect } from 'react';
import {
  X, Plus, Webhook, Search, Edit, Trash2, Play, RefreshCw,
  CheckCircle, XCircle, Eye, Code, Activity, AlertCircle
} from 'lucide-react';

const WebhookManager = ({ onClose }) => {
  const [webhooks, setWebhooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(null);
  const [editingWebhook, setEditingWebhook] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/webhooks`);
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    }
  };

  const fetchWebhookLogs = async (webhookId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/webhooks/${webhookId}/logs`);
      const data = await response.json();
      setLogs(data.logs || []);
      setShowLogsModal(webhookId);
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error);
    }
  };

  const handleDelete = async (webhookId) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      await fetch(`${BACKEND_URL}/api/webhooks/${webhookId}`, {
        method: 'DELETE'
      });
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook');
    }
  };

  const handleTest = async (webhookId) => {
    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        event: 'test_event',
        data: { message: 'This is a test webhook' }
      };

      const response = await fetch(`${BACKEND_URL}/api/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();
      if (result.success) {
        alert('Webhook test successful!');
      } else {
        alert(`Webhook test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to test webhook');
    }
  };

  const filteredWebhooks = webhooks.filter(webhook =>
    webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webhook.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-primary-900">Webhook Manager</h2>
              <p className="text-sm text-green-500 mt-1">
                Configure and monitor webhook endpoints
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={18} className="inline mr-2" />
                New Webhook
              </button>
              <button
                onClick={onClose}
                className="p-2 text-green-400 hover:text-primary-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b bg-green-50">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search webhooks..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Webhooks List */}
          <div className="flex-1 overflow-auto p-6">
            {filteredWebhooks.length === 0 ? (
              <div className="text-center py-12 text-green-500">
                <Webhook size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No webhooks found</p>
                <p className="text-sm mt-2">
                  {searchQuery ? 'Try a different search term' : 'Create your first webhook to get started'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus size={18} className="inline mr-2" />
                    Create Webhook
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredWebhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="border rounded-lg p-4 hover:border-green-500 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-primary-900">{webhook.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            webhook.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-green-100 text-primary-700'
                          }`}>
                            {webhook.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-primary-600">
                          <p className="flex items-center gap-2">
                            <Code size={14} />
                            <span className="font-mono text-xs">{webhook.url}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Activity size={14} />
                            Events: {webhook.events.join(', ')}
                          </p>
                          <p className="flex items-center gap-2">
                            <CheckCircle size={14} />
                            Total Calls: {webhook.total_calls || 0}
                          </p>
                          {webhook.last_called_at && (
                            <p className="text-xs text-green-500">
                              Last called: {new Date(webhook.last_called_at).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 p-3 bg-green-50 rounded border">
                          <p className="text-xs text-primary-600 mb-1">Webhook Endpoint:</p>
                          <code className="text-xs font-mono text-green-600">
                            {`${BACKEND_URL}/api/webhooks/${webhook.id}/receive`}
                          </code>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => fetchWebhookLogs(webhook.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="View Logs"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleTest(webhook.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Test Webhook"
                        >
                          <Play size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingWebhook(webhook);
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-primary-600 hover:bg-green-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(webhook.id)}
                          className="p-2 text-gold-600 hover:bg-gold-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <WebhookForm
          webhook={editingWebhook}
          onClose={() => {
            setShowCreateModal(false);
            setEditingWebhook(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setEditingWebhook(null);
            fetchWebhooks();
          }}
        />
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <WebhookLogs
          webhookId={showLogsModal}
          logs={logs}
          onClose={() => {
            setShowLogsModal(null);
            setLogs([]);
          }}
          onRefresh={() => fetchWebhookLogs(showLogsModal)}
        />
      )}
    </>
  );
};

// Webhook Form Component
const WebhookForm = ({ webhook, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: webhook?.name || '',
    url: webhook?.url || '',
    events: webhook?.events || [],
    secret: webhook?.secret || '',
    active: webhook?.active !== undefined ? webhook.active : true
  });

  const [newEvent, setNewEvent] = useState('');
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [headers, setHeaders] = useState(webhook?.headers || {});

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  const handleSubmit = async () => {
    try {
      const url = webhook
        ? `${BACKEND_URL}/api/webhooks/${webhook.id}`
        : `${BACKEND_URL}/api/webhooks`;

      const method = webhook ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, headers })
      });

      const result = await response.json();
      if (response.ok) {
        alert(webhook ? 'Webhook updated successfully' : 'Webhook created successfully');
        onSave();
      } else {
        alert('Failed to save webhook');
      }
    } catch (error) {
      console.error('Failed to save webhook:', error);
      alert('Failed to save webhook');
    }
  };

  const addEvent = () => {
    if (newEvent && !formData.events.includes(newEvent)) {
      setFormData({ ...formData, events: [...formData.events, newEvent] });
      setNewEvent('');
    }
  };

  const removeEvent = (event) => {
    setFormData({ ...formData, events: formData.events.filter(e => e !== event) });
  };

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setHeaders({ ...headers, [newHeaderKey]: newHeaderValue });
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const removeHeader = (key) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    setHeaders(newHeaders);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-primary-900">
            {webhook ? 'Edit Webhook' : 'Create Webhook'}
          </h3>
          <button onClick={onClose} className="p-2 text-green-400 hover:text-primary-600 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="My Webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Target URL *
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="https://your-app.com/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Events
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEvent()}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="workflow.completed"
              />
              <button
                onClick={addEvent}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.events.map((event) => (
                <span
                  key={event}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2"
                >
                  {event}
                  <button onClick={() => removeEvent(event)} className="hover:text-green-900">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Secret (Optional)
            </label>
            <input
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Webhook secret for signing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Custom Headers
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newHeaderKey}
                onChange={(e) => setNewHeaderKey(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Header name"
              />
              <input
                type="text"
                value={newHeaderValue}
                onChange={(e) => setNewHeaderValue(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Header value"
              />
              <button
                onClick={addHeader}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(headers).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <span className="font-mono text-sm flex-1">{key}: {value}</span>
                  <button onClick={() => removeHeader(key)} className="text-gold-600 hover:text-gold-800">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-primary-700">
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-2 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-green-300 rounded-lg hover:bg-green-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name || !formData.url}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {webhook ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Webhook Logs Component
const WebhookLogs = ({ webhookId, logs, onClose, onRefresh }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-primary-900">Webhook Logs</h3>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="p-2 text-green-600 hover:bg-green-50 rounded"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-green-400 hover:text-primary-600 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-green-500">
              <Activity size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">No logs yet</p>
              <p className="text-sm mt-2">Webhook calls will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {log.status === 'processed' ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : log.status === 'failed' ? (
                        <XCircle className="text-gold-600" size={20} />
                      ) : (
                        <AlertCircle className="text-gold-600" size={20} />
                      )}
                      <span className="font-semibold capitalize">{log.status}</span>
                    </div>
                    <span className="text-sm text-green-500">
                      {new Date(log.received_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-primary-600 mb-1">Payload:</p>
                    <pre className="text-xs font-mono overflow-auto max-h-32">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                  {log.error && (
                    <div className="mt-2 p-2 bg-gold-50 rounded">
                      <p className="text-xs text-gold-700">{log.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebhookManager;
