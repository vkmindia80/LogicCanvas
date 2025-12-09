import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Edit2, CheckCircle, XCircle, Clock, Mail, MessageSquare, Users, Globe, Zap, Eye, EyeOff, RefreshCw, Menu, Database, Cloud, Server } from 'lucide-react';
import { modalHeaderStyles, modalOverlayStyles } from '../utils/designSystem';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const IntegrationHub = ({ onClose, onOpenMobileSidebar, sidebarCollapsed = false }) => {
  const [activeTab, setActiveTab] = useState('integrations'); // 'integrations' or 'databases'
  const [integrations, setIntegrations] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [dbTypes, setDbTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [dbCategoryFilter, setDbCategoryFilter] = useState('all'); // 'all', 'SQL', 'NoSQL', 'Cloud'

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const query = filterType !== 'all' ? `?type=${filterType}` : '';
      const response = await fetch(`${BACKEND_URL}/api/integrations${query}`);
      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  const loadDatabases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/integrations/databases`);
      const data = await response.json();
      let connections = data.connections || [];
      
      // Filter by category if needed
      if (dbCategoryFilter !== 'all') {
        connections = connections.filter(conn => {
          const dbType = dbTypes.find(t => t.id === conn.db_type);
          return dbType && dbType.category === dbCategoryFilter;
        });
      }
      
      setDatabases(connections);
    } catch (error) {
      console.error('Failed to load database connections:', error);
    } finally {
      setLoading(false);
    }
  }, [dbCategoryFilter, dbTypes]);

  const loadDatabaseTypes = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/databases/types`);
      const data = await response.json();
      setDbTypes(data.types || []);
    } catch (error) {
      console.error('Failed to load database types:', error);
    }
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadIntegrations();
      }
    } catch (error) {
      console.error('Failed to delete integration:', error);
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/${id}/test`, {
        method: 'POST',
      });
      const result = await response.json();
      
      alert(result.success ? `✓ ${result.message}` : `✗ ${result.message}`);
      loadIntegrations();
    } catch (error) {
      alert(`Test failed: ${error.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteDatabase = async (id) => {
    if (!window.confirm('Are you sure you want to delete this database connection?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/databases/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadDatabases();
      }
    } catch (error) {
      console.error('Failed to delete database connection:', error);
    }
  };

  const handleTestDatabase = async (id) => {
    setTestingId(id);
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/databases/${id}/test`, {
        method: 'POST',
      });
      const result = await response.json();
      
      alert(result.success ? `✓ ${result.message}\n${result.database_type} - ${result.version || ''}` : `✗ ${result.message}`);
      loadDatabases();
    } catch (error) {
      alert(`Test failed: ${error.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const getIconComponent = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'slack':
        return <MessageSquare className="h-5 w-5" />;
      case 'teams':
        return <Users className="h-5 w-5" />;
      case 'rest':
        return <Globe className="h-5 w-5" />;
      case 'webhook':
        return <Zap className="h-5 w-5" />;
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'cloud':
        return <Cloud className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getDatabaseIcon = (dbType) => {
    const type = dbTypes.find(t => t.id === dbType);
    if (type?.category === 'Cloud') {
      return <Cloud className="h-5 w-5" />;
    } else if (type?.category === 'NoSQL') {
      return <Server className="h-5 w-5" />;
    }
    return <Database className="h-5 w-5" />;
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center space-x-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          <CheckCircle className="h-3 w-3" />
          <span>Active</span>
        </span>
      );
    } else if (status === 'error') {
      return (
        <span className="inline-flex items-center space-x-1 rounded-full bg-gold-100 px-2 py-1 text-xs font-medium text-gold-800">
          <XCircle className="h-3 w-3" />
          <span>Error</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-primary-800">
          <Clock className="h-3 w-3" />
          <span>Inactive</span>
        </span>
      );
    }
  };

  // Load database types on mount
  useEffect(() => {
    loadDatabaseTypes();
  }, [loadDatabaseTypes]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'integrations') {
      loadIntegrations();
    } else {
      loadDatabases();
    }
  }, [activeTab, filterType, dbCategoryFilter, loadIntegrations, loadDatabases]);

  return (
    <div className={`fixed inset-0 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'} bg-white z-50 flex flex-col`}>
      {/* Header */}
      <div className={modalHeaderStyles.base}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu for Mobile */}
            <button 
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="mobile-menu-btn"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Globe className="w-7 h-7" />
            </div>
            <div>
              <h2 className={modalHeaderStyles.title}>Integration Hub</h2>
              <p className={modalHeaderStyles.subtitle}>Manage your external service integrations and databases</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            data-testid="close-integration-hub-btn"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-green-200 bg-white">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'integrations'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-green-600 hover:text-primary-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Service Integrations</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('databases')}
            className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'databases'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-green-600 hover:text-primary-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Database Connectors</span>
            </div>
          </button>
        </div>
      </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-green-200 bg-green-50 px-6 py-4">
          <div className="flex items-center space-x-3">
            {activeTab === 'integrations' ? (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">All Types</option>
                <option value="email">Email (SMTP)</option>
                <option value="slack">Slack</option>
                <option value="teams">Microsoft Teams</option>
                <option value="rest">REST API</option>
                <option value="webhook">Webhook</option>
              </select>
            ) : (
              <select
                value={dbCategoryFilter}
                onChange={(e) => setDbCategoryFilter(e.target.value)}
                className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-primary-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">All Databases</option>
                <option value="SQL">SQL Databases</option>
                <option value="NoSQL">NoSQL Databases</option>
                <option value="Cloud">Cloud Databases</option>
              </select>
            )}
            
            <button
              onClick={() => activeTab === 'integrations' ? loadIntegrations() : loadDatabases()}
              className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-green-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingIntegration(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary-700"
            data-testid="add-integration-btn"
          >
            <Plus className="h-4 w-4" />
            <span>{activeTab === 'integrations' ? 'Add Integration' : 'Add Database'}</span>
          </button>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'integrations' ? (
          // Service Integrations View
          loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
                <p className="text-sm text-primary-600">Loading integrations...</p>
              </div>
            </div>
          ) : integrations.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Globe className="mb-4 h-16 w-16 text-green-300" />
              <h3 className="mb-2 text-lg font-semibold text-primary-900">No Integrations Yet</h3>
              <p className="mb-4 text-sm text-primary-600">Get started by adding your first integration</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Integration</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="group rounded-xl border-2 border-green-200 bg-white p-6 shadow-sm transition-all hover:border-primary-300 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-primary-100 p-3 text-primary-600">
                        {getIconComponent(integration.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary-900">{integration.name}</h3>
                        <p className="text-xs text-green-500 capitalize">{integration.type}</p>
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>

                  {integration.description && (
                    <p className="mb-4 text-sm text-primary-600 line-clamp-2">{integration.description}</p>
                  )}

                  {integration.last_tested && (
                    <p className="mb-4 text-xs text-green-500">
                      Last tested: {new Date(integration.last_tested).toLocaleString()}
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTest(integration.id)}
                      disabled={testingId === integration.id}
                      className="flex-1 rounded-lg border border-green-300 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-green-50 disabled:opacity-50"
                    >
                      {testingId === integration.id ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingIntegration(integration);
                        setShowAddModal(true);
                      }}
                      className="rounded-lg border border-green-300 p-2 text-primary-600 transition-colors hover:bg-green-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(integration.id)}
                      className="rounded-lg border border-gold-300 p-2 text-gold-600 transition-colors hover:bg-gold-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Database Connectors View
          loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
                <p className="text-sm text-primary-600">Loading database connections...</p>
              </div>
            </div>
          ) : databases.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Database className="mb-4 h-16 w-16 text-green-300" />
              <h3 className="mb-2 text-lg font-semibold text-primary-900">No Database Connections Yet</h3>
              <p className="mb-4 text-sm text-primary-600">Connect to your first database</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Database</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {databases.map((db) => {
                const dbTypeInfo = dbTypes.find(t => t.id === db.db_type);
                return (
                  <div
                    key={db.id}
                    className="group rounded-xl border-2 border-green-200 bg-white p-6 shadow-sm transition-all hover:border-primary-300 hover:shadow-lg"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="rounded-lg bg-primary-100 p-3 text-primary-600">
                          {getDatabaseIcon(db.db_type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary-900">{db.name}</h3>
                          <p className="text-xs text-green-500">{dbTypeInfo?.name || db.db_type}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        dbTypeInfo?.category === 'SQL' ? 'bg-blue-100 text-blue-800' :
                        dbTypeInfo?.category === 'NoSQL' ? 'bg-purple-100 text-purple-800' :
                        'bg-cyan-100 text-cyan-800'
                      }`}>
                        {dbTypeInfo?.category || 'Database'}
                      </span>
                    </div>

                    {db.description && (
                      <p className="mb-4 text-sm text-primary-600 line-clamp-2">{db.description}</p>
                    )}

                    <div className="mb-4 space-y-1 text-xs text-green-500">
                      {db.host && <p>Host: {db.host}</p>}
                      {db.database && <p>Database: {db.database}</p>}
                      {db.region && <p>Region: {db.region}</p>}
                      {db.last_tested && (
                        <p>Last tested: {new Date(db.last_tested).toLocaleString()}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestDatabase(db.id)}
                        disabled={testingId === db.id}
                        className="flex-1 rounded-lg border border-green-300 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-green-50 disabled:opacity-50"
                      >
                        {testingId === db.id ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingIntegration(db);
                          setShowAddModal(true);
                        }}
                        className="rounded-lg border border-green-300 p-2 text-primary-600 transition-colors hover:bg-green-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDatabase(db.id)}
                        className="rounded-lg border border-gold-300 p-2 text-gold-600 transition-colors hover:bg-gold-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
        </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        activeTab === 'integrations' ? (
          <IntegrationModal
            integration={editingIntegration}
            onClose={() => {
              setShowAddModal(false);
              setEditingIntegration(null);
            }}
            onSave={() => {
              setShowAddModal(false);
              setEditingIntegration(null);
              loadIntegrations();
            }}
          />
        ) : (
          <DatabaseModal
            database={editingIntegration}
            dbTypes={dbTypes}
            onClose={() => {
              setShowAddModal(false);
              setEditingIntegration(null);
            }}
            onSave={() => {
              setShowAddModal(false);
              setEditingIntegration(null);
              loadDatabases();
            }}
          />
        )
      )}
    </div>
  );
};

const IntegrationModal = ({ integration, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: integration?.name || '',
    description: integration?.description || '',
    type: integration?.type || 'email',
    config: integration?.config || {},
    status: integration?.status || 'active',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = integration ? 'PUT' : 'POST';
      const url = integration
        ? `${BACKEND_URL}/api/integrations/${integration.id}`
        : `${BACKEND_URL}/api/integrations`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.detail}`);
      }
    } catch (error) {
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const renderConfigFields = () => {
    switch (formData.type) {
      case 'email':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">SMTP Host</label>
              <input
                type="text"
                value={formData.config.smtp_host || ''}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, smtp_host: e.target.value } })}
                placeholder="smtp.gmail.com"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">SMTP Port</label>
              <input
                type="number"
                value={formData.config.smtp_port || 587}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, smtp_port: parseInt(e.target.value) } })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Username</label>
              <input
                type="text"
                value={formData.config.username || ''}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, username: e.target.value } })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.config.password || ''}
                  onChange={(e) => setFormData({ ...formData, config: { ...formData.config, password: e.target.value } })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2 pr-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">From Email</label>
              <input
                type="email"
                value={formData.config.from_email || ''}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, from_email: e.target.value } })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </>
        );

      case 'slack':
        return (
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-700">Webhook URL</label>
            <input
              type="url"
              value={formData.config.webhook_url || ''}
              onChange={(e) => setFormData({ ...formData, config: { ...formData.config, webhook_url: e.target.value } })}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="mt-1 text-xs text-green-500">Get your webhook URL from Slack App settings</p>
          </div>
        );

      case 'teams':
        return (
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-700">Webhook URL</label>
            <input
              type="url"
              value={formData.config.webhook_url || ''}
              onChange={(e) => setFormData({ ...formData, config: { ...formData.config, webhook_url: e.target.value } })}
              placeholder="https://outlook.office.com/webhook/..."
              className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="mt-1 text-xs text-green-500">Get your webhook URL from Teams channel connectors</p>
          </div>
        );

      case 'rest':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">API URL</label>
              <input
                type="url"
                value={formData.config.url || ''}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, url: e.target.value } })}
                placeholder="https://api.example.com"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Method</label>
              <select
                value={formData.config.method || 'GET'}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, method: e.target.value } })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">API Key (Optional)</label>
              <input
                type="text"
                value={formData.config.api_key || ''}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, api_key: e.target.value } })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </>
        );

      case 'webhook':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Webhook URL</label>
              <input
                type="url"
                value={formData.config.webhook_url || ''}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, webhook_url: e.target.value } })}
                placeholder="https://example.com/webhook"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Method</label>
              <select
                value={formData.config.method || 'POST'}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, method: e.target.value } })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-green-400 transition-colors hover:bg-green-100 hover:text-primary-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="mb-6 text-2xl font-bold text-primary-900">
          {integration ? 'Edit Integration' : 'Add Integration'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-primary-700">Integration Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="My Integration"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-primary-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="Brief description of this integration"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-primary-700">Integration Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, config: {} })}
              disabled={!!integration}
              className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
            >
              <option value="email">Email (SMTP)</option>
              <option value="slack">Slack</option>
              <option value="teams">Microsoft Teams</option>
              <option value="rest">REST API</option>
              <option value="webhook">Generic Webhook</option>
            </select>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-primary-700">Configuration</h4>
            <div className="space-y-4">{renderConfigFields()}</div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-green-300 px-6 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-green-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : integration ? 'Update Integration' : 'Create Integration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DatabaseModal = ({ database, dbTypes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: database?.name || '',
    description: database?.description || '',
    db_type: database?.db_type || 'postgresql',
    host: database?.host || 'localhost',
    port: database?.port || 5432,
    database: database?.database || '',
    username: database?.username || '',
    password: database?.password || '',
    ssl: database?.ssl || false,
    // Cloud DB fields
    region: database?.region || 'us-east-1',
    access_key: database?.access_key || '',
    secret_key: database?.secret_key || '',
    project_id: database?.project_id || '',
    service_account_json: database?.service_account_json || '',
    endpoint: database?.endpoint || '',
    account_key: database?.account_key || '',
    api_type: database?.api_type || 'sql',
    // NoSQL fields
    contact_points: database?.contact_points || [],
    keyspace: database?.keyspace || '',
    service_name: database?.service_name || '',
    instance: database?.instance || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (formData.db_type) {
      const dbType = dbTypes.find(t => t.id === formData.db_type);
      if (dbType && dbType.default_port) {
        setFormData(prev => ({ ...prev, port: dbType.default_port }));
      }
    }
  }, [formData.db_type, dbTypes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = database ? 'PUT' : 'POST';
      const url = database
        ? `${BACKEND_URL}/api/integrations/databases/${database.id}`
        : `${BACKEND_URL}/api/integrations/databases`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedDbType = dbTypes.find(t => t.id === formData.db_type);

  const renderDatabaseFields = () => {
    switch (formData.db_type) {
      case 'postgresql':
      case 'mysql':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Host</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="localhost"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Database Name</label>
              <input
                type="text"
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                placeholder="my_database"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2 pr-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ssl"
                checked={formData.ssl}
                onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
                className="mr-2 h-4 w-4 rounded border-green-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="ssl" className="text-sm font-medium text-primary-700">Enable SSL</label>
            </div>
          </>
        );

      case 'mssql':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Host</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="localhost"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Database Name</label>
              <input
                type="text"
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                placeholder="my_database"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Instance (Optional)</label>
              <input
                type="text"
                value={formData.instance}
                onChange={(e) => setFormData({ ...formData, instance: e.target.value })}
                placeholder="SQLEXPRESS"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2 pr-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        );

      case 'oracle':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Host</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="localhost"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Service Name</label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                placeholder="ORCL"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2 pr-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        );

      case 'mongodb':
      case 'redis':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Host</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="localhost"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            {formData.db_type === 'mongodb' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-primary-700">Database Name</label>
                <input
                  type="text"
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  placeholder="my_database"
                  className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Username (Optional)</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Password (Optional)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2 pr-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        );

      case 'cassandra':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Contact Points (comma-separated)</label>
              <input
                type="text"
                value={Array.isArray(formData.contact_points) ? formData.contact_points.join(',') : formData.contact_points}
                onChange={(e) => setFormData({ ...formData, contact_points: e.target.value.split(',').map(s => s.trim()) })}
                placeholder="localhost,node2,node3"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Keyspace</label>
              <input
                type="text"
                value={formData.keyspace}
                onChange={(e) => setFormData({ ...formData, keyspace: e.target.value })}
                placeholder="my_keyspace"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Username (Optional)</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Password (Optional)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2 pr-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        );

      case 'dynamodb':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">AWS Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="us-east-1"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">AWS Access Key ID</label>
              <input
                type="text"
                value={formData.access_key}
                onChange={(e) => setFormData({ ...formData, access_key: e.target.value })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">AWS Secret Access Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.secret_key}
                  onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2 pr-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        );

      case 'firestore':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Google Cloud Project ID</label>
              <input
                type="text"
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                placeholder="my-project-id"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Service Account JSON</label>
              <textarea
                value={formData.service_account_json}
                onChange={(e) => setFormData({ ...formData, service_account_json: e.target.value })}
                placeholder='{"type": "service_account", ...}'
                rows={4}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono text-xs"
                required
              />
              <p className="mt-1 text-xs text-green-500">Paste your service account JSON here</p>
            </div>
          </>
        );

      case 'cosmosdb':
        return (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Azure Cosmos DB Endpoint</label>
              <input
                type="url"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="https://myaccount.documents.azure.com:443/"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Account Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.account_key}
                  onChange={(e) => setFormData({ ...formData, account_key: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2 pr-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">Database Name</label>
              <input
                type="text"
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                placeholder="my-database"
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-primary-700">API Type</label>
              <select
                value={formData.api_type}
                onChange={(e) => setFormData({ ...formData, api_type: e.target.value })}
                className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="sql">SQL API</option>
                <option value="mongodb">MongoDB API</option>
              </select>
            </div>
          </>
        );

      default:
        return <p className="text-sm text-primary-600">Please select a database type</p>;
    }
  };

  return (
    <div className={modalOverlayStyles.base}>
      <div className={`${modalOverlayStyles.content} max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className={modalHeaderStyles.base}>
          <h2 className={modalHeaderStyles.title}>
            {database ? 'Edit Database Connection' : 'Add Database Connection'}
          </h2>
          <button onClick={onClose} className="text-white hover:opacity-80">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">Connection Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Database Connection"
              className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">Database Type</label>
            <select
              value={formData.db_type}
              onChange={(e) => setFormData({ ...formData, db_type: e.target.value })}
              className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              disabled={!!database}
              required
            >
              {dbTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.category})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-green-200 pt-6">
            <h4 className="mb-4 text-sm font-semibold text-primary-800">Connection Details</h4>
            <div className="space-y-5">
              {renderDatabaseFields()}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-primary-700">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this connection..."
              rows={2}
              className="w-full rounded-lg border border-green-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-green-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-green-300 px-6 py-2 text-sm font-semibold text-primary-700 transition-all hover:bg-green-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : database ? 'Update Connection' : 'Create Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationHub;
