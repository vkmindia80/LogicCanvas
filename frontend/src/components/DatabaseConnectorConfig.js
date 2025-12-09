import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Edit2, CheckCircle, XCircle, Database, 
  Zap, Cloud, Eye, EyeOff, RefreshCw, AlertCircle
} from 'lucide-react';

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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  placeholder="localhost"
                  required
                />
              </div>
            )}

            {selectedType.fields.includes('port') && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  required
                />
              </div>
            )}
          </div>
        )}

        {selectedType.fields.includes('database') && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Database Name
            </label>
            <input
              type="text"
              value={formData.database}
              onChange={(e) => setFormData({ ...formData, database: e.target.value })}
              className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder="my_database"
              required
            />
          </div>
        )}

        {selectedType.fields.includes('username') && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder="db_user"
              required
            />
          </div>
        )}

        {selectedType.fields.includes('password') && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
                placeholder={editingConnection ? 'Leave blank to keep unchanged' : '••••••••'}
                required={!editingConnection}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        {selectedType.fields.includes('region') && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              AWS Region
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder="us-east-1"
              required
            />
          </div>
        )}

        {selectedType.fields.includes('access_key') && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Access Key
            </label>
            <input
              type="text"
              value={formData.access_key}
              onChange={(e) => setFormData({ ...formData, access_key: e.target.value })}
              className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              required={!editingConnection}
            />
          </div>
        )}

        {selectedType.fields.includes('secret_key') && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Secret Key
            </label>
            <input
              type="password"
              value={formData.secret_key}
              onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
              className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder={editingConnection ? 'Leave blank to keep unchanged' : '••••••••'}
              required={!editingConnection}
            />
          </div>
        )}

        {selectedType.fields.includes('ssl') && (
          <div className="flex items-center space-x-3 p-4 rounded-xl border-2 border-green-200 bg-green-50">
            <input
              type="checkbox"
              id="ssl"
              checked={formData.ssl}
              onChange={(e) => setFormData({ ...formData, ssl: e.target.checked })}
              className="h-5 w-5 rounded border-green-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="ssl" className="block text-sm font-semibold text-slate-700 cursor-pointer">
              Enable SSL/TLS Connection
            </label>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-600 text-white px-6 py-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Database Connections</h2>
              <p className="text-green-100 text-sm mt-1">Manage your database integrations</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                resetForm();
                setEditingConnection(null);
                setShowAddModal(true);
              }}
              className="flex items-center space-x-2 rounded-xl bg-white/20 px-4 py-2.5 text-white hover:bg-white/30 transition-all font-semibold"
              data-testid="add-database-connection-btn"
            >
              <Plus className="h-5 w-5" />
              <span>Add Connection</span>
            </button>
            <button
              onClick={loadConnections}
              className="rounded-xl bg-white/20 p-2.5 text-white hover:bg-white/30 transition-all"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/20 p-2.5 text-white hover:bg-white/30 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            </div>
          ) : connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="p-4 bg-green-100 rounded-2xl mb-4">
                <Database className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Database Connections</h3>
              <p className="text-slate-600 mb-6 max-w-md">
                Connect to PostgreSQL, MySQL, Redis, MongoDB, DynamoDB and more to integrate databases into your workflows.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-5 w-5" />
                <span>Add Your First Connection</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-white rounded-xl border-2 border-green-200 shadow-lg p-5 group hover:shadow-xl hover:border-green-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-xl bg-green-100 p-3 text-green-600">
                        {getIconForDbType(connection.db_type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{connection.name}</h3>
                        <p className="text-sm text-slate-500 capitalize font-medium">{connection.db_type}</p>
                      </div>
                    </div>
                  </div>

                  {connection.description && (
                    <p className="text-sm text-slate-600 mb-3">{connection.description}</p>
                  )}

                  <div className="space-y-2 mb-4 text-sm">
                    {connection.host && (
                      <div className="flex items-center text-slate-600">
                        <span className="font-medium w-16">Host:</span>
                        <span className="text-slate-800">{connection.host}:{connection.port}</span>
                      </div>
                    )}
                    {connection.database && (
                      <div className="flex items-center text-slate-600">
                        <span className="font-medium w-16">DB:</span>
                        <span className="text-slate-800">{connection.database}</span>
                      </div>
                    )}
                    {connection.region && (
                      <div className="flex items-center text-slate-600">
                        <span className="font-medium w-16">Region:</span>
                        <span className="text-slate-800">{connection.region}</span>
                      </div>
                    )}
                  </div>

                  {connection.status && (
                    <div className="mb-3">
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

                  <div className="flex items-center space-x-2 pt-4 border-t-2 border-green-100">
                    <button
                      onClick={() => handleTest(connection.id)}
                      disabled={testingId === connection.id}
                      className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingId === connection.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          <span>Test</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(connection)}
                      className="rounded-xl bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 transition-all"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(connection.id)}
                      className="rounded-xl bg-red-50 p-2.5 text-red-600 hover:bg-red-100 transition-all"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-green-600 to-green-600 px-6 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Database className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {editingConnection ? 'Edit Database Connection' : 'Add Database Connection'}
                      </h3>
                      <p className="text-green-100 text-sm mt-1">
                        {editingConnection ? 'Update connection details' : 'Configure a new database connection'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingConnection(null);
                    }}
                    className="rounded-xl bg-white/20 p-2.5 text-white hover:bg-white/30 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {/* Basic Information Section */}
                <div className="bg-white rounded-xl border-2 border-green-200 p-5 space-y-4">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center space-x-2 mb-4">
                    <Database className="h-5 w-5 text-green-600" />
                    <span>Basic Information</span>
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Connection Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      placeholder="My Database Connection"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Database Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.db_type}
                      onChange={(e) => handleDbTypeChange(e.target.value)}
                      className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      required
                    >
                      {dbTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Connection Details Section */}
                {dbTypes.find(t => t.id === formData.db_type) && (
                  <div className="bg-white rounded-xl border-2 border-green-200 p-5 space-y-4">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center space-x-2 mb-4">
                      <Zap className="h-5 w-5 text-green-600" />
                      <span>Connection Details</span>
                    </h4>
                    {renderFormFields()}
                  </div>
                )}

                {/* Additional Information Section */}
                <div className="bg-white rounded-xl border-2 border-green-200 p-5 space-y-4">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center space-x-2 mb-4">
                    <Edit2 className="h-5 w-5 text-green-600" />
                    <span>Additional Information</span>
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      rows="3"
                      placeholder="Add a description for this database connection..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingConnection(null);
                    }}
                    className="inline-flex items-center space-x-2 rounded-xl border-2 border-green-300 bg-white px-6 py-3 text-sm font-semibold text-green-700 shadow-sm transition-all hover:bg-green-50 hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {editingConnection ? 'Update Connection' : 'Add Connection'}
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
