import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Info, XCircle, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const WorkflowHealthIndicator = ({ workflowId, compact = false }) => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (workflowId) {
      loadHealth();
    }
  }, [workflowId]);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/health`);
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Error loading workflow health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-green-400">
        <Activity className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Checking health...</span>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const getHealthIcon = () => {
    switch (health.health_status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'fair':
        return <Info className="w-5 h-5 text-gold-500" />;
      case 'poor':
        return <AlertTriangle className="w-5 h-5 text-gold-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-gold-500" />;
      default:
        return <Activity className="w-5 h-5 text-green-400" />;
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'good':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'fair':
        return 'bg-gold-50 border-gold-200 text-gold-800';
      case 'poor':
        return 'bg-gold-50 border-gold-200 text-gold-800';
      case 'critical':
        return 'bg-gold-50 border-gold-200 text-gold-800';
      default:
        return 'bg-green-50 border-green-200 text-primary-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-gold-600';
    if (score >= 30) return 'text-gold-600';
    return 'text-gold-600';
  };

  if (compact) {
    return (
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${getHealthColor(
          health.health_status
        )} hover:shadow-md transition-all`}
        title="Click to view details"
      >
        {getHealthIcon()}
        <span className="font-semibold text-sm">{health.health_score}</span>
        <span className="text-xs uppercase font-medium">{health.health_status}</span>
        
        {showDetails && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border-2 border-green-200 rounded-lg shadow-2xl p-4 z-50"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-primary-900">Workflow Health</h4>
              <button
                onClick={() => setShowDetails(false)}
                className="text-green-400 hover:text-primary-600"
              >
                ✕
              </button>
            </div>

            {/* Score and Status */}
            <div className="flex items-center justify-between mb-4 p-3 bg-green-50 rounded-lg">
              <div>
                <div className={`text-3xl font-bold ${getScoreColor(health.health_score)}`}>
                  {health.health_score}
                </div>
                <div className="text-xs text-green-500">Health Score</div>
              </div>
              {getHealthIcon()}
            </div>

            {/* Metrics */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Success Rate:</span>
                <span className="font-semibold">{health.metrics.success_rate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Total Executions:</span>
                <span className="font-semibold">{health.metrics.total_executions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Validation Errors:</span>
                <span className={`font-semibold ${health.metrics.validation_errors > 0 ? 'text-gold-600' : 'text-green-600'}`}>
                  {health.metrics.validation_errors}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Warnings:</span>
                <span className="font-semibold text-gold-600">{health.metrics.validation_warnings}</span>
              </div>
            </div>

            {/* Recommendations */}
            {health.recommendations && health.recommendations.length > 0 && (
              <div className="border-t pt-3">
                <h5 className="text-xs font-semibold text-primary-600 mb-2">RECOMMENDATIONS</h5>
                <div className="space-y-2">
                  {health.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2 text-xs">
                      <AlertTriangle className={`w-3 h-3 mt-0.5 ${
                        rec.priority === 'high' ? 'text-gold-500' : 
                        rec.priority === 'medium' ? 'text-gold-500' : 'text-green-500'
                      }`} />
                      <span className="text-primary-700">{rec.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </button>
    );
  }

  // Full view
  return (
    <div className="bg-white border-2 border-green-200 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-primary-900 flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Workflow Health</span>
        </h3>
        <button
          onClick={loadHealth}
          className="text-sm text-green-600 hover:text-green-800 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Health Score Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-green-200"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(health.health_score / 100) * 352} 352`}
              className={getScoreColor(health.health_score)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold ${getScoreColor(health.health_score)}`}>
              {health.health_score}
            </div>
            <div className="text-xs text-green-500 uppercase font-medium">
              {health.health_status}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-primary-900">
            {health.metrics.success_rate}%
          </div>
          <div className="text-xs text-green-500">Success Rate</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-primary-900">
            {health.metrics.total_executions}
          </div>
          <div className="text-xs text-green-500">Total Executions</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className={`text-2xl font-bold ${
            health.metrics.validation_errors > 0 ? 'text-gold-600' : 'text-green-600'
          }`}>
            {health.metrics.validation_errors}
          </div>
          <div className="text-xs text-green-500">Validation Errors</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gold-600">
            {health.metrics.validation_warnings}
          </div>
          <div className="text-xs text-green-500">Warnings</div>
        </div>
      </div>

      {/* Recommendations */}
      {health.recommendations && health.recommendations.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-primary-700 mb-3">
            Recommendations
          </h4>
          <div className="space-y-3">
            {health.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  rec.priority === 'high'
                    ? 'bg-gold-50 border-gold-200'
                    : rec.priority === 'medium'
                    ? 'bg-gold-50 border-gold-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 ${
                    rec.priority === 'high'
                      ? 'text-gold-500'
                      : rec.priority === 'medium'
                      ? 'text-gold-500'
                      : 'text-green-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-primary-700">{rec.message}</p>
                  {rec.action && (
                    <button className="text-xs text-green-600 hover:text-green-800 font-medium mt-1">
                      Take Action →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowHealthIndicator;
