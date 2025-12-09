import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Edit2, CheckCircle, XCircle, Database, 
  Zap, Cloud, Eye, EyeOff, RefreshCw, AlertCircle
} from 'lucide-react';
import { modalHeaderStyles, modalOverlayStyles } from '../utils/designSystem';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const DatabaseConnectorConfig = ({ isOpen, onClose, onSuccess }) => {
  const [connections, setConnections] = useState([]);
  const [dbTypes, setDbTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    db_type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    region: 'us-east-1',
    access_key: '',
    secret_key: '',
    ssl: false,
    description: '',
    tags: []
  });

  useEffect(() => {
    if (isOpen) {
      loadConnections();
      loadDatabaseTypes();
    }
  }, [isOpen]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/integrations/databases`);
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Failed to load database connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDatabaseTypes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/databases/types`);
      const data = await response.json();
      setDbTypes(data.types || []);
    } catch (error) {
      console.error('Failed to load database types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingConnection 
        ? `${BACKEND_URL}/api/integrations/databases/${editingConnection.id}`
        : `${BACKEND_URL}/api/integrations/databases`;
      
      const method = editingConnection ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadConnections();
        setShowAddModal(false);
        setEditingConnection(null);
        resetForm();
        onSuccess?.('Database connection saved successfully');
      } else {
        const error = await response.json();
        alert(`Failed to save connection: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save database connection:', error);
      alert('Failed to save connection');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this database connection?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/databases/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadConnections();
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/databases/${id}/test`, {
        method: 'POST',
      });
      const result = await response.json();
      
      alert(result.success 
        ? `✓ Connection successful!\n${result.message}\nDatabase: ${result.database_type}`
        : `✗ Connection failed!\n${result.message}`
      );
      await loadConnections();
    } catch (error) {
      alert(`Test failed: ${error.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleEdit = (connection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      db_type: connection.db_type,
      host: connection.host || 'localhost',
      port: connection.port || getDefaultPort(connection.db_type),
      database: connection.database || '',
      username: connection.username || '',
      password: '',  // Don't pre-fill password for security
      region: connection.region || 'us-east-1',
      access_key: '',  // Don't pre-fill for security
      secret_key: '',  // Don't pre-fill for security
      ssl: connection.ssl || false,
      description: connection.description || '',
      tags: connection.tags || []
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      db_type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      region: 'us-east-1',
      access_key: '',
      secret_key: '',
      ssl: false,
      description: '',
      tags: []
    });
  };

  const getDefaultPort = (dbType) => {
    const portMap = {
      'postgresql': 5432,
      'mysql': 3306,
      'redis': 6379,
      'mongodb': 27017
    };
    return portMap[dbType] || 5432;
  };

  const handleDbTypeChange = (dbType) => {
    setFormData(prev => ({
      ...prev,
      db_type: dbType,
      port: getDefaultPort(dbType)
    }));
  };

  const getIconForDbType = (dbType) => {
    if (dbType?.includes('dynamo') || dbType?.includes('firestore')) {
      return <Cloud className="h-5 w-5" />;
    }
    if (dbType === 'redis') {
      return <Zap className="h-5 w-5" />;
    }
    return <Database className="h-5 w-5" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const renderFormFields = () => {
    const selectedType = dbTypes.find(t => t.id === formData.db_type);
    if (!selectedType) return null;

    return (
      <div className="space-y-4">
        {/* Host and Port in Grid */}
        {(selectedType.fields.includes('host') || selectedType.fields.includes('port')) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedType.fields.includes('host') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Host
                </label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="localhost"
                  required
                />
              </div>
            )}

            {selectedType.fields.includes('port') && (
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>
            )}
          </div>
        )}

        {selectedType.fields.includes('database') && (
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Database Name
            </label>
            <input
              type="text"
              value={formData.database}
              onChange={(e) => setFormData({ ...formData, database: e.target.value })}
              className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="my_database"
              required
            />
          </div>
        )}

        {/* Username and Password in Grid */}
        {(selectedType.fields.includes('username') || selectedType.fields.includes('password')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedType.fields.includes('username') && (
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="db_user"
                  required
                />
              </div>
            )}

            {selectedType.fields.includes('password') && (
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Password {editingConnection && <span className="text-xs text-green-500">(Leave blank to keep unchanged)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-green-300 px-4 py-2.5 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    placeholder="••••••••"
                    required={!editingConnection}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-primary-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedType.fields.includes('region') && (
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              AWS Region
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="us-east-1"
              required
            />
          </div>
        )}

        {/* AWS Credentials in Grid */}
        {(selectedType.fields.includes('access_key') || selectedType.fields.includes('secret_key')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedType.fields.includes('access_key') && (
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Access Key {editingConnection && <span className="text-xs text-green-500">(Optional)</span>}
                </label>
                <input
                  type="text"
                  value={formData.access_key}
                  onChange={(e) => setFormData({ ...formData, access_key: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  required={!editingConnection}
                />
              </div>
            )}

            {selectedType.fields.includes('secret_key') && (
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Secret Key {editingConnection && <span className="text-xs text-green-500">(Optional)</span>}
                </label>
                <input
                  type="password"
                  value={formData.secret_key}
                  onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                  className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="••••••••"
                  required={!editingConnection}
                />
              </div>
            )}
          </div>
        )}

        {selectedType.fields.includes('ssl') && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ssl"
              checked={formData.ssl}
              onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
              className="h-4 w-4 rounded border-green-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="ssl" className="text-sm font-medium text-primary-700 cursor-pointer">
              Enable SSL
            </label>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={modalOverlayStyles.base} onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={modalHeaderStyles.base}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Database className="h-7 w-7" />
              </div>
              <div>
                <h2 className={modalHeaderStyles.title}>Database Connections</h2>
                <p className={modalHeaderStyles.subtitle}>Manage your database integrations</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  resetForm();
                  setEditingConnection(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center space-x-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/30"
                data-testid="add-database-connection-btn"
              >
                <Plus className="h-4 w-4" />
                <span>Add Connection</span>
              </button>
              <button
                onClick={loadConnections}
                className="rounded-lg bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
                <p className="text-sm text-primary-600">Loading connections...</p>
              </div>
            </div>
          ) : connections.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="group rounded-xl border-2 border-green-200 bg-white p-6 shadow-sm transition-all hover:border-primary-300 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-primary-100 p-3 text-primary-600">
                        {getIconForDbType(connection.db_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary-900">{connection.name}</h3>
                        <p className="text-xs text-green-500 capitalize">{connection.db_type}</p>
                      </div>
                    </div>
                  </div>

                  {connection.description && (
                    <p className="mb-4 text-sm text-primary-600 line-clamp-2">{connection.description}</p>
                  )}

                  <div className="mb-4 space-y-1 text-xs text-green-500">
                    {connection.host && <p>Host: {connection.host}:{connection.port}</p>}
                    {connection.database && <p>Database: {connection.database}</p>}
                    {connection.region && <p>Region: {connection.region}</p>}
                  </div>

                  {connection.status && (
                    <div className="mb-4">
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(connection.status)}`}>
                        {connection.status === 'connected' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : connection.status === 'failed' ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        <span className="capitalize">{connection.status}</span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTest(connection.id)}
                      disabled={testingId === connection.id}
                      className="flex-1 rounded-lg border border-green-300 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-green-50 disabled:opacity-50"
                    >
                      {testingId === connection.id ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={() => handleEdit(connection)}
                      className="rounded-lg border border-green-300 p-2 text-primary-600 transition-colors hover:bg-green-50"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(connection.id)}
                      className="rounded-lg border border-gold-300 p-2 text-gold-600 transition-colors hover:bg-gold-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className={modalOverlayStyles.base} onClick={() => setShowAddModal(false)}>
            <div
              className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={modalHeaderStyles.base}>
                <div className="flex items-center justify-between">
                  <h2 className={modalHeaderStyles.title}>
                    {editingConnection ? 'Edit Database Connection' : 'Add Database Connection'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingConnection(null);
                    }}
                    className="rounded-lg p-2 text-white transition-colors hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
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
                    onChange={(e) => handleDbTypeChange(e.target.value)}
                    className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    disabled={!!editingConnection}
                    required
                  >
                    {dbTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-green-200 pt-6">
                  <h4 className="mb-4 text-sm font-semibold text-primary-800">Connection Details</h4>
                  <div className="space-y-5">
                    {renderFormFields()}
                  </div>
                </div>

                <div className="border-t border-green-200 pt-6">
                  <label className="mb-2 block text-sm font-semibold text-primary-800">
                    Description <span className="text-xs font-normal text-green-500">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this connection..."
                    rows={3}
                    className="w-full rounded-lg border border-green-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-green-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingConnection(null);
                    }}
                    className="rounded-lg border border-green-300 px-6 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-green-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700"
                  >
                    {editingConnection ? 'Update Connection' : 'Create Connection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseConnectorConfig;
