import React, { useState, useEffect } from 'react';
import {
  X, Shield, Activity, AlertTriangle, CheckCircle, Clock,
  Zap, TrendingUp, Settings, Save, RotateCcw, Info
} from 'lucide-react';

const RateLimitingManager = ({ onClose, connectorId = null }) => {
  const [connectors, setConnectors] = useState([]);
  const [selectedConnector, setSelectedConnector] = useState(connectorId);
  const [rateLimitConfig, setRateLimitConfig] = useState({
    enabled: true,
    max_requests: 100,
    time_window_seconds: 60,
    burst_size: 20,
    strategy: 'sliding_window',
    retry_after_seconds: 60
  });
  const [status, setStatus] = useState(null);
  const [circuitBreakers, setCircuitBreakers] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  const STRATEGIES = [
    { value: 'fixed_window', label: 'Fixed Window', description: 'Resets at fixed intervals' },
    { value: 'sliding_window', label: 'Sliding Window', description: 'Smooths rate over time' },
    { value: 'token_bucket', label: 'Token Bucket', description: 'Allows bursts with refill' },
    { value: 'leaky_bucket', label: 'Leaky Bucket', description: 'Constant output rate' }
  ];

  useEffect(() => {
    fetchConnectors();
    fetchCircuitBreakers();
    if (selectedConnector) {
      fetchRateLimitStatus(selectedConnector);
    }
  }, [selectedConnector]);

  const fetchConnectors = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors?is_template=false`);
      const data = await response.json();
      setConnectors(data.connectors || []);
    } catch (error) {
      console.error('Failed to fetch connectors:', error);
    }
  };

  const fetchRateLimitStatus = async (connectorId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/${connectorId}/rate-limit/status`);
      const data = await response.json();
      setStatus(data);
      if (data.config) {
        setRateLimitConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to fetch rate limit status:', error);
    }
  };

  const fetchCircuitBreakers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/circuit-breakers/status`);
      const data = await response.json();
      setCircuitBreakers(data.circuit_breakers || []);
    } catch (error) {
      console.error('Failed to fetch circuit breakers:', error);
    }
  };

  const handleSaveRateLimit = async () => {
    if (!selectedConnector) {
      alert('Please select a connector first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/${selectedConnector}/rate-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateLimitConfig)
      });

      const result = await response.json();
      if (response.ok) {
        alert('Rate limiting configuration saved successfully');
        fetchRateLimitStatus(selectedConnector);
      } else {
        alert('Failed to save configuration: ' + result.detail);
      }
    } catch (error) {
      console.error('Failed to save rate limit:', error);
      alert('Failed to save rate limit configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCircuitBreaker = async (connectorId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/${connectorId}/circuit-breaker/reset`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Circuit breaker reset successfully');
        fetchCircuitBreakers();
      }
    } catch (error) {
      console.error('Failed to reset circuit breaker:', error);
      alert('Failed to reset circuit breaker');
    }
  };

  const getUsagePercentage = () => {
    if (!status || !status.current_usage) return 0;
    return Math.min((status.current_usage / rateLimitConfig.max_requests) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getCircuitBreakerStatus = (state) => {
    switch (state) {
      case 'closed':
        return { icon: CheckCircle, color: 'text-green-600', label: 'Healthy' };
      case 'open':
        return { icon: AlertTriangle, color: 'text-red-600', label: 'Open (Failing)' };
      case 'half_open':
        return { icon: Activity, color: 'text-yellow-600', label: 'Testing' };
      default:
        return { icon: Info, color: 'text-gray-600', label: 'Unknown' };
    }
  };

  const usagePercentage = getUsagePercentage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="text-blue-600" size={28} />
              Rate Limiting & Circuit Breaker
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage API rate limits and monitor circuit breaker health
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Connector Selection & Configuration */}
            <div className="col-span-2 space-y-6">
              {/* Connector Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Connector
                </label>
                <select
                  value={selectedConnector || ''}
                  onChange={(e) => setSelectedConnector(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a connector...</option>
                  {connectors.map((connector) => (
                    <option key={connector.id} value={connector.id}>
                      {connector.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedConnector && (
                <>
                  {/* Current Status */}
                  {status && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Activity size={18} className="text-blue-600" />
                        Current Usage
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">
                              {status.current_usage || 0} / {rateLimitConfig.max_requests} requests
                            </span>
                            <span className={`text-sm font-semibold ${getUsageColor(usagePercentage).split(' ')[0]}`}>
                              {usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                usagePercentage >= 90 ? 'bg-red-500' : 
                                usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-gray-500 text-xs">Time Window</div>
                            <div className="font-semibold text-gray-900">
                              {rateLimitConfig.time_window_seconds}s
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-gray-500 text-xs">Burst Size</div>
                            <div className="font-semibold text-gray-900">
                              {rateLimitConfig.burst_size}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <div className="text-gray-500 text-xs">Strategy</div>
                            <div className="font-semibold text-gray-900 capitalize text-xs">
                              {rateLimitConfig.strategy.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Configuration */}
                  <div className="bg-gray-50 rounded-xl p-4 border">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Settings size={18} className="text-gray-600" />
                      Rate Limit Configuration
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={rateLimitConfig.enabled}
                          onChange={(e) => setRateLimitConfig({ ...rateLimitConfig, enabled: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">
                          Enable Rate Limiting
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Requests
                          </label>
                          <input
                            type="number"
                            value={rateLimitConfig.max_requests}
                            onChange={(e) => setRateLimitConfig({ ...rateLimitConfig, max_requests: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time Window (seconds)
                          </label>
                          <input
                            type="number"
                            value={rateLimitConfig.time_window_seconds}
                            onChange={(e) => setRateLimitConfig({ ...rateLimitConfig, time_window_seconds: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Burst Size
                          </label>
                          <input
                            type="number"
                            value={rateLimitConfig.burst_size}
                            onChange={(e) => setRateLimitConfig({ ...rateLimitConfig, burst_size: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Retry After (seconds)
                          </label>
                          <input
                            type="number"
                            value={rateLimitConfig.retry_after_seconds}
                            onChange={(e) => setRateLimitConfig({ ...rateLimitConfig, retry_after_seconds: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Limiting Strategy
                        </label>
                        <div className="space-y-2">
                          {STRATEGIES.map((strategy) => (
                            <div
                              key={strategy.value}
                              onClick={() => setRateLimitConfig({ ...rateLimitConfig, strategy: strategy.value })}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                rateLimitConfig.strategy === strategy.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm text-gray-900">
                                    {strategy.label}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {strategy.description}
                                  </div>
                                </div>
                                {rateLimitConfig.strategy === strategy.value && (
                                  <CheckCircle size={18} className="text-blue-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleSaveRateLimit}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right: Circuit Breaker Status */}
            <div className="col-span-1">
              <div className="bg-white rounded-xl border p-4 sticky top-0">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap size={18} className="text-orange-600" />
                  Circuit Breakers
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-auto">
                  {circuitBreakers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No circuit breakers configured
                    </p>
                  ) : (
                    circuitBreakers.map((cb) => {
                      const statusInfo = getCircuitBreakerStatus(cb.state);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div
                          key={cb.connector_id}
                          className="border rounded-lg p-3 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {cb.connector_name || cb.connector_id}
                              </div>
                              <div className={`text-xs font-medium ${statusInfo.color} flex items-center gap-1 mt-1`}>
                                <StatusIcon size={12} />
                                {statusInfo.label}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Failures:</span>
                              <span className="font-medium">{cb.failure_count || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Success Rate:</span>
                              <span className="font-medium">{cb.success_rate || 0}%</span>
                            </div>
                          </div>
                          {cb.state === 'open' && (
                            <button
                              onClick={() => handleResetCircuitBreaker(cb.connector_id)}
                              className="w-full mt-2 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors flex items-center justify-center gap-1"
                            >
                              <RotateCcw size={12} />
                              Reset
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-start gap-2 text-sm">
            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-gray-600">
              <p>
                <strong>Rate Limiting</strong> prevents API abuse by limiting requests per time window.
                <strong className="ml-2">Circuit Breaker</strong> protects external services by stopping requests when failures exceed threshold.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitingManager;
