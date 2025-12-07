import React, { useState, useEffect } from 'react';
import {
  X, Key, Link, Shield, CheckCircle, AlertCircle, Copy, RefreshCw,
  ExternalLink, Settings, Code
} from 'lucide-react';

const OAuthFlowBuilder = ({ onClose, connectorId = null }) => {
  const [config, setConfig] = useState({
    provider: 'salesforce',
    client_id: '',
    client_secret: '',
    redirect_uri: window.location.origin + '/oauth/callback',
    authorization_url: '',
    token_url: '',
    scopes: []
  });

  const [tokens, setTokens] = useState([]);
  const [authUrl, setAuthUrl] = useState('');
  const [authState, setAuthState] = useState('');
  const [activeTab, setActiveTab] = useState('configure'); // configure, authorize, tokens
  const [testResult, setTestResult] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  const PROVIDERS = {
    salesforce: {
      name: 'Salesforce',
      authorization_url: 'https://login.salesforce.com/services/oauth2/authorize',
      token_url: 'https://login.salesforce.com/services/oauth2/token',
      default_scopes: ['api', 'refresh_token', 'offline_access']
    },
    hubspot: {
      name: 'HubSpot',
      authorization_url: 'https://app.hubspot.com/oauth/authorize',
      token_url: 'https://api.hubapi.com/oauth/v1/token',
      default_scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read']
    },
    servicenow: {
      name: 'ServiceNow',
      authorization_url: 'https://{instance}.service-now.com/oauth_auth.do',
      token_url: 'https://{instance}.service-now.com/oauth_token.do',
      default_scopes: ['useraccount']
    },
    google: {
      name: 'Google',
      authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth',
      token_url: 'https://oauth2.googleapis.com/token',
      default_scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    },
    microsoft: {
      name: 'Microsoft Dynamics 365',
      authorization_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      token_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      default_scopes: ['https://org.crm.dynamics.com/.default']
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/oauth/tokens`);
      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    }
  };

  const handleProviderChange = (provider) => {
    const providerConfig = PROVIDERS[provider];
    setConfig({
      ...config,
      provider,
      authorization_url: providerConfig.authorization_url,
      token_url: providerConfig.token_url,
      scopes: providerConfig.default_scopes
    });
  };

  const handleInitiateOAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/oauth/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      setAuthUrl(data.authorization_url);
      setAuthState(data.state);
      setActiveTab('authorize');
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
      alert('Failed to initiate OAuth flow');
    }
  };

  const handleOpenAuthWindow = () => {
    if (authUrl) {
      window.open(authUrl, 'OAuth Authorization', 'width=600,height=700');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(authUrl);
    alert('Authorization URL copied to clipboard');
  };

  const handleRefreshToken = async (tokenId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/oauth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_id: tokenId,
          token_url: config.token_url,
          client_id: config.client_id,
          client_secret: config.client_secret
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Token refreshed successfully');
        fetchTokens();
      } else {
        alert('Failed to refresh token');
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      alert('Failed to refresh token');
    }
  };

  const handleRevokeToken = async (tokenId) => {
    if (!window.confirm('Are you sure you want to revoke this token?')) {
      return;
    }

    try {
      await fetch(`${BACKEND_URL}/api/oauth/tokens/${tokenId}`, {
        method: 'DELETE'
      });
      alert('Token revoked successfully');
      fetchTokens();
    } catch (error) {
      console.error('Failed to revoke token:', error);
      alert('Failed to revoke token');
    }
  };

  const addScope = () => {
    const scope = prompt('Enter scope:');
    if (scope) {
      setConfig({
        ...config,
        scopes: [...config.scopes, scope]
      });
    }
  };

  const removeScope = (index) => {
    setConfig({
      ...config,
      scopes: config.scopes.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-primary-900">OAuth 2.0 Flow Builder</h2>
            <p className="text-sm text-green-500 mt-1">
              Configure and manage OAuth integrations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-green-400 hover:text-primary-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {['configure', 'authorize', 'tokens'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-green-500 hover:text-primary-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Configure Tab */}
          {activeTab === 'configure' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Provider *
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(PROVIDERS).map(([key, provider]) => (
                    <option key={key} value={key}>{provider.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Client ID *
                  </label>
                  <input
                    type="text"
                    value={config.client_id}
                    onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Client Secret *
                  </label>
                  <input
                    type="password"
                    value={config.client_secret}
                    onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter client secret"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Redirect URI *
                </label>
                <input
                  type="text"
                  value={config.redirect_uri}
                  onChange={(e) => setConfig({ ...config, redirect_uri: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="https://your-app.com/oauth/callback"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Authorization URL *
                </label>
                <input
                  type="text"
                  value={config.authorization_url}
                  onChange={(e) => setConfig({ ...config, authorization_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Token URL *
                </label>
                <input
                  type="text"
                  value={config.token_url}
                  onChange={(e) => setConfig({ ...config, token_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-primary-700">
                    Scopes
                  </label>
                  <button
                    onClick={addScope}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    + Add Scope
                  </button>
                </div>
                <div className="space-y-2">
                  {config.scopes.map((scope, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={scope}
                        onChange={(e) => {
                          const newScopes = [...config.scopes];
                          newScopes[index] = e.target.value;
                          setConfig({ ...config, scopes: newScopes });
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => removeScope(index)}
                        className="p-2 text-gold-600 hover:bg-gold-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleInitiateOAuth}
                disabled={!config.client_id || !config.authorization_url}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Key size={18} className="inline mr-2" />
                Initiate OAuth Flow
              </button>
            </div>
          )}

          {/* Authorize Tab */}
          {activeTab === 'authorize' && (
            <div className="space-y-4">
              {authUrl ? (
                <>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="text-green-600" size={20} />
                      <h3 className="font-semibold text-green-900">Authorization Ready</h3>
                    </div>
                    <p className="text-sm text-green-800">
                      Click the button below to open the authorization window or copy the URL to authorize manually.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      Authorization URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={authUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded-lg bg-green-50 text-sm"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="px-3 py-2 border rounded-lg hover:bg-green-50"
                        title="Copy URL"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      State (for verification)
                    </label>
                    <input
                      type="text"
                      value={authState}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-green-50 text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleOpenAuthWindow}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <ExternalLink size={18} className="inline mr-2" />
                      Open Authorization Window
                    </button>
                    <button
                      onClick={() => setActiveTab('tokens')}
                      className="flex-1 px-4 py-3 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      View Tokens
                    </button>
                  </div>

                  <div className="p-4 bg-gold-50 rounded-lg">
                    <p className="text-sm text-gold-800">
                      <strong>Note:</strong> After authorizing, you'll receive a callback with the authorization code.
                      Use the callback endpoint to exchange it for an access token.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-green-500">
                  <Shield size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No active authorization</p>
                  <p className="text-sm mt-2">
                    Configure OAuth settings first and initiate the flow
                  </p>
                  <button
                    onClick={() => setActiveTab('configure')}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Go to Configure
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              {tokens.length === 0 ? (
                <div className="text-center py-12 text-green-500">
                  <Key size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No tokens stored</p>
                  <p className="text-sm mt-2">
                    Complete an OAuth flow to obtain access tokens
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className="border rounded-lg p-4 hover:border-green-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-primary-900 capitalize">
                              {token.provider}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              new Date(token.expires_at) > new Date()
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gold-100 text-gold-700'
                            }`}>
                              {new Date(token.expires_at) > new Date() ? 'Valid' : 'Expired'}
                            </span>
                          </div>
                          <div className="text-sm text-primary-600 space-y-1">
                            <p>Token Type: {token.token_type}</p>
                            <p>Scope: {token.scope || 'N/A'}</p>
                            <p>Created: {new Date(token.created_at).toLocaleString()}</p>
                            <p>Expires: {new Date(token.expires_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRefreshToken(token.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Refresh Token"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => handleRevokeToken(token.id)}
                            className="p-2 text-gold-600 hover:bg-gold-50 rounded"
                            title="Revoke Token"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthFlowBuilder;
