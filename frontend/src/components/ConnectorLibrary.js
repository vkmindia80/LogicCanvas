import React, { useState, useEffect } from 'react';
import { Globe, Plus, Edit2, Trash2, Search, Tag, ExternalLink, Copy } from 'lucide-react';
import APIConnectorBuilder from './APIConnectorBuilder';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ConnectorLibrary = () => {
  const [connectors, setConnectors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('connectors'); // connectors | templates
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedConnectorId, setSelectedConnectorId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectors();
    loadTemplates();
  }, []);

  const loadConnectors = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors`);
      if (response.ok) {
        const data = await response.json();
        setConnectors(data.connectors || []);
      }
    } catch (error) {
      console.error('Failed to load connectors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/templates/library`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const createFromTemplate = async (template) => {
    try {
      const newConnector = {
        ...template,
        id: undefined,
        is_template: false,
        name: `${template.name} (Copy)`,
        tags: [...(template.tags || []).filter(t => t !== 'template'), 'from-template']
      };

      const response = await fetch(`${BACKEND_URL}/api/connectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConnector)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Connector created from template!');
        loadConnectors();
        setSelectedTab('connectors');
      }
    } catch (error) {
      console.error('Failed to create from template:', error);
      alert('Error creating connector from template');
    }
  };

  const deleteConnector = async (connectorId) => {
    if (!window.confirm('Delete this connector? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/${connectorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Connector deleted successfully');
        loadConnectors();
      } else {
        alert('Failed to delete connector');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting connector');
    }
  };

  const filteredConnectors = connectors.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAuthBadgeColor = (authType) => {
    const colors = {
      none: 'bg-gray-100 text-gray-700',
      api_key: 'bg-blue-100 text-blue-700',
      bearer: 'bg-purple-100 text-purple-700',
      basic: 'bg-yellow-100 text-yellow-700',
      oauth: 'bg-green-100 text-green-700'
    };
    return colors[authType] || colors.none;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-500" />
              API Connector Library
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage API integrations and pre-built connector templates
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedConnectorId(null);
              setIsBuilderOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Connector
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('connectors')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'connectors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Connectors ({connectors.length})
          </button>
          <button
            onClick={() => setSelectedTab('templates')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Templates ({templates.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={selectedTab === 'connectors' ? 'Search connectors...' : 'Search templates...'}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        )}

        {!loading && selectedTab === 'connectors' && (
          <div>
            {filteredConnectors.length === 0 && (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No connectors found' : 'No connectors yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? 'Try adjusting your search'
                    : 'Create your first API connector or use a template'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setSelectedTab('templates')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse Templates →
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnectors.map((connector) => (
                <div
                  key={connector.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{connector.name}</h3>
                      <p className="text-xs text-gray-600 truncate">{connector.base_url}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedConnectorId(connector.id);
                          setIsBuilderOpen(true);
                        }}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit connector"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteConnector(connector.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete connector"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {connector.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {connector.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getAuthBadgeColor(connector.auth_type)}`}>
                      {connector.auth_type.toUpperCase().replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {connector.endpoints?.length || 0} endpoints
                    </span>
                  </div>

                  {connector.tags && connector.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {connector.tags.map((tag, i) => (
                        <span key={i} className="text-xs text-gray-500 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && selectedTab === 'templates' && (
          <div>
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No templates found matching your search.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg border-2 border-dashed border-blue-200 p-4 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-xs text-gray-600">{template.base_url}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Template
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
                    {template.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getAuthBadgeColor(template.auth_type)}`}>
                      {template.auth_type.toUpperCase().replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {template.endpoints?.length || 0} endpoints
                    </span>
                  </div>

                  <button
                    onClick={() => createFromTemplate(template)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* API Connector Builder Modal */}
      <APIConnectorBuilder
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setSelectedConnectorId(null);
          loadConnectors();
        }}
        connectorId={selectedConnectorId}
      />
    </div>
  );
};

export default ConnectorLibrary;
