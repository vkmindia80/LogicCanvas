import React, { useState, useEffect } from 'react';
import {
  X, Database, Activity, TrendingUp, AlertCircle, CheckCircle,
  RefreshCw, Trash2, Server, Clock, Zap, BarChart3, Info
} from 'lucide-react';

const ConnectionPoolMonitor = ({ onClose }) => {
  const [poolHealth, setPoolHealth] = useState(null);
  const [poolStats, setPoolStats] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    fetchPoolData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchPoolData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const fetchPoolData = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/connectors/pool/health`),
        fetch(`${BACKEND_URL}/api/connectors/pool/statistics`)
      ]);

      const healthData = await healthRes.json();
      const statsData = await statsRes.json();

      setPoolHealth(healthData);
      setPoolStats(statsData);
    } catch (error) {
      console.error('Failed to fetch pool data:', error);
    }
  };

  const handleResetPool = async (connectorId) => {
    if (!window.confirm('Are you sure you want to reset this connection pool?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/${connectorId}/pool/reset`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Connection pool reset successfully');
        fetchPoolData();
      } else {
        alert('Failed to reset connection pool');
      }
    } catch (error) {
      console.error('Failed to reset pool:', error);
      alert('Failed to reset connection pool');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupPools = async () => {
    if (!window.confirm('Clean up idle connections across all pools?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/connectors/pool/cleanup`, {
        method: 'POST'
      });

      const result = await response.json();
      alert(`Cleaned up ${result.cleaned_connections} idle connections`);
      fetchPoolData();
    } catch (error) {
      console.error('Failed to cleanup pools:', error);
      alert('Failed to cleanup connection pools');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const calculateUsagePercentage = (active, total) => {
    if (!total) return 0;
    return Math.min((active / total) * 100, 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="text-green-600" size={28} />
              Connection Pool Monitor
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Monitor and manage HTTP connection pools for API connectors
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <label className="text-sm font-medium text-gray-700">Auto-refresh</label>
            </div>
            <button
              onClick={fetchPoolData}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Refresh Now"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleCleanupPools}
              disabled={loading}
              className="px-3 py-2 bg-gold-600 text-white text-sm rounded-lg hover:bg-gold-700 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} className="inline mr-1" />
              Cleanup Idle
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Overall Health Summary */}
          {poolHealth && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-green-900">Total Pools</div>
                  <Server className="text-green-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {poolHealth.pools?.length || 0}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-green-900">Active Connections</div>
                  <Activity className="text-green-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {poolStats?.total_active_connections || 0}
                </div>
              </div>

              <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-xl p-4 border border-gold-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gold-900">Idle Connections</div>
                  <Clock className="text-gold-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-gold-900">
                  {poolStats?.total_idle_connections || 0}
                </div>
              </div>

              <div className="bg-gradient-to-br from-gold-50 to-gold-100 rounded-xl p-4 border border-gold-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gold-900">Total Requests</div>
                  <TrendingUp className="text-gold-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-gold-900">
                  {poolStats?.total_requests || 0}
                </div>
              </div>
            </div>
          )}

          {/* Per-Connector Pool Stats */}
          {poolHealth?.pools && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-gray-600" />
                Connection Pools by Connector
              </h3>
              <div className="space-y-3">
                {poolHealth.pools.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Database size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No connection pools active</p>
                    <p className="text-sm mt-2">
                      Pools will be created automatically when connectors are used
                    </p>
                  </div>
                ) : (
                  poolHealth.pools.map((pool) => {
                    const usagePercentage = calculateUsagePercentage(
                      pool.active_connections,
                      pool.max_connections
                    );

                    return (
                      <div
                        key={pool.connector_id}
                        className="border rounded-lg p-4 hover:border-green-300 transition-all bg-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {pool.connector_name || pool.connector_id}
                              </h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getHealthColor(pool.health_status)}`}>
                                {pool.health_status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {pool.connector_id}
                            </div>
                          </div>
                          <button
                            onClick={() => handleResetPool(pool.connector_id)}
                            disabled={loading}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          >
                            Reset Pool
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-500">Active</div>
                            <div className="text-lg font-bold text-gray-900">
                              {pool.active_connections}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-500">Idle</div>
                            <div className="text-lg font-bold text-gray-900">
                              {pool.idle_connections}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-500">Max</div>
                            <div className="text-lg font-bold text-gray-900">
                              {pool.max_connections}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-500">Requests</div>
                            <div className="text-lg font-bold text-gray-900">
                              {pool.total_requests || 0}
                            </div>
                          </div>
                        </div>

                        {/* Usage Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Pool Usage</span>
                            <span className="text-xs font-semibold text-gray-900">
                              {usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getUsageColor(usagePercentage)}`}
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Additional Stats */}
                        <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Zap size={12} className="text-green-600" />
                            <span className="text-gray-600">Avg Latency:</span>
                            <span className="font-medium">{pool.avg_latency_ms || 0}ms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle size={12} className="text-green-600" />
                            <span className="text-gray-600">Success:</span>
                            <span className="font-medium">{pool.success_rate || 0}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertCircle size={12} className="text-red-600" />
                            <span className="text-gray-600">Errors:</span>
                            <span className="font-medium">{pool.error_count || 0}</span>
                          </div>
                        </div>

                        {pool.health_status === 'critical' && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle size={14} className="text-red-600 mt-0.5" />
                              <div className="text-xs text-red-800">
                                <strong>Critical:</strong> Pool is experiencing high error rates or connection issues.
                                Consider resetting the pool or checking the external service.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-start gap-2 text-sm">
            <Info size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-gray-600">
              <p>
                <strong>Connection pooling</strong> reuses HTTP connections to improve performance and reduce overhead.
                Monitor pool health to ensure optimal performance. Idle connections are automatically cleaned up after timeout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionPoolMonitor;
