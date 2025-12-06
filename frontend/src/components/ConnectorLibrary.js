import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Trash2, Edit, Play, Code, Globe, Key, Webhook } from 'lucide-react';
import APIConnectorBuilder from './APIConnectorBuilder';
import OAuthFlowBuilder from './OAuthFlowBuilder';
import WebhookManager from './WebhookManager';

const ConnectorLibrary = ({ onClose, onSelect }) => {
  const [connectors, setConnectors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingConnector, setEditingConnector] = useState(null);
  const [viewMode, setViewMode] = useState('saved'); // 'saved' or 'templates'
  const [showOAuthBuilder, setShowOAuthBuilder] = useState(false);
  const [showWebhookManager, setShowWebhookManager] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    fetchConnectors();
    fetchTemplates();
  }, [categoryFilter]);

  const fetchConnectors = async () => {
    try {
      const url = categoryFilter !== 'all'
        ? `${BACKEND_URL}/api/connectors?category=${categoryFilter}&is_template=false`
        : `${BACKEND_URL}/api/connectors?is_template=false`;
      const response = await fetch(url);
      const data = await response.json();
      setConnectors(data.connectors || []);
    } catch (error) {
      console.error('Failed to fetch connectors:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/templates`);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleDelete = async (connectorId) => {
    if (!window.confirm('Are you sure you want to delete this connector?')) {
      return;
    }

    try {
      await fetch(`${BACKEND_URL}/api/connectors/${connectorId}`, {
        method: 'DELETE'
      });
      fetchConnectors();
    } catch (error) {
      console.error('Failed to delete connector:', error);
      alert('Failed to delete connector');
    }
  };

  const handleEdit = (connector) => {
    setEditingConnector(connector.id);
    setShowBuilder(true);
  };

  const handleCreate = () => {
    setEditingConnector(null);
    setShowBuilder(true);
  };

  const displayItems = viewMode === 'saved' ? connectors : templates;
  
  const filteredItems = displayItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'payment': return '💳';
      case 'communication': return '📧';
      case 'storage': return '💾';
      case 'ai': return '🤖';
      default: return '🔌';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">API Connector Library</h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage and reuse API integrations across workflows
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOAuthBuilder(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Key size={18} className="inline mr-2" />
                OAuth
              </button>
              <button
                onClick={() => setShowWebhookManager(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Webhook size={18} className="inline mr-2" />
                Webhooks
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} className="inline mr-2" />
                New Connector
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="border-b">
            <div className="flex px-6">
              <button
                onClick={() => setViewMode('saved')}
                className={`px-4 py-3 font-medium transition-all ${
                  viewMode === 'saved'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Connectors ({connectors.length})
              </button>
              <button
                onClick={() => setViewMode('templates')}
                className={`px-4 py-3 font-medium transition-all ${
                  viewMode === 'templates'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Templates ({templates.length})
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search connectors..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="payment">💳 Payment</option>
                <option value="communication">📧 Communication</option>
                <option value="storage">💾 Storage</option>
                <option value="ai">🤖 AI</option>
                <option value="crm">👥 CRM</option>
                <option value="project_management">📊 Project Management</option>
                <option value="itsm">🔧 ITSM</option>
                <option value="erp">🏢 ERP</option>
                <option value="database">🗄️ Database</option>
                <option value="custom">🔌 Custom</option>
              </select>
            </div>
          </div>

          {/* Connectors Grid */}
          <div className="flex-1 overflow-auto p-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Code size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No connectors found</p>
                <p className="text-sm mt-2">
                  {searchQuery ? 'Try a different search term' : viewMode === 'saved' ? 'Create your first connector to get started' : 'No templates available'}
                </p>
                {viewMode === 'saved' && (
                  <button
                    onClick={handleCreate}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={18} className="inline mr-2" />
                    Create Connector
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => {
                      if (viewMode === 'templates') {
                        // For templates, open builder with template data
                        setEditingConnector({ ...item, id: null, is_template: false });
                        setShowBuilder(true);
                      } else {
                        onSelect?.(item);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                            {item.name}
                          </h3>
                          {item.is_template && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                              Template
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description || 'No description'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {item.config.method}
                      </span>
                      <span className="truncate ml-2" title={item.config.url}>
                        <Globe size={12} className="inline mr-1" />
                        {new URL(item.config.url.split('${')[0] + (item.config.url.includes('${') ? 'example' : '')).hostname}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {viewMode === 'templates' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConnector({ ...item, id: null, is_template: false });
                            setShowBuilder(true);
                          }}
                          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                        >
                          <Plus size={14} className="inline mr-1" />
                          Use Template
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Edit size={14} className="inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
            <p>
              💡 <strong>Tip:</strong> Use <code className="px-2 py-0.5 bg-gray-200 rounded">${'{variable}'}</code> syntax in URLs, headers, and body to use workflow variables
            </p>
          </div>
        </div>
      </div>

      {/* API Connector Builder Modal */}
      {showBuilder && (
        <APIConnectorBuilder
          connectorId={typeof editingConnector === 'string' ? editingConnector : null}
          initialData={typeof editingConnector === 'object' ? editingConnector : null}
          onClose={() => {
            setShowBuilder(false);
            setEditingConnector(null);
            fetchConnectors();
          }}
          onSave={() => {
            setShowBuilder(false);
            setEditingConnector(null);
            fetchConnectors();
          }}
        />
      )}

      {/* OAuth Flow Builder Modal */}
      {showOAuthBuilder && (
        <OAuthFlowBuilder
          onClose={() => setShowOAuthBuilder(false)}
        />
      )}

      {/* Webhook Manager Modal */}
      {showWebhookManager && (
        <WebhookManager
          onClose={() => setShowWebhookManager(false)}
        />
      )}
    </>
  );
};

export default ConnectorLibrary;
