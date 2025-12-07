import React, { useState, useEffect, useCallback } from 'react';
import {
  History, Search, Filter, RefreshCw, Calendar, User,
  FileText, CheckCircle, XCircle, Edit, Trash2, Play,
  Clock, ChevronDown, ChevronRight, X, Menu
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AuditTrail = ({ onClose, onOpenMobileSidebar, entityType, entityId, sidebarCollapsed = false }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/audit-logs?limit=200`;
      if (entityType) url += `&entity_type=${entityType}`;
      if (entityId) url += `&entity_id=${entityId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionIcon = (action) => {
    const icons = {
      created: <CheckCircle className="w-4 h-4 text-green-500" />,
      updated: <Edit className="w-4 h-4 text-green-500" />,
      deleted: <Trash2 className="w-4 h-4 text-red-500" />,
      executed: <Play className="w-4 h-4 text-gold-500" />,
      completed: <CheckCircle className="w-4 h-4 text-green-500" />,
      failed: <XCircle className="w-4 h-4 text-red-500" />,
      approved: <CheckCircle className="w-4 h-4 text-green-500" />,
      rejected: <XCircle className="w-4 h-4 text-red-500" />,
      assigned: <User className="w-4 h-4 text-green-500" />,
      reassigned: <User className="w-4 h-4 text-gold-500" />,
      escalated: <Clock className="w-4 h-4 text-red-500" />,
      delegated: <User className="w-4 h-4 text-gold-500" />
    };
    return icons[action] || <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getActionColor = (action) => {
    const colors = {
      created: 'bg-green-100 text-green-800 border-green-300',
      updated: 'bg-green-100 text-green-800 border-green-300',
      deleted: 'bg-red-100 text-red-800 border-red-300',
      executed: 'bg-gold-100 text-gold-800 border-gold-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      assigned: 'bg-green-100 text-green-800 border-green-300',
      reassigned: 'bg-gold-100 text-gold-800 border-gold-300',
      escalated: 'bg-red-100 text-red-800 border-red-300',
      delegated: 'bg-gold-100 text-gold-800 border-gold-300'
    };
    return colors[action] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getEntityTypeIcon = (type) => {
    const icons = {
      workflow: <FileText className="w-4 h-4" />,
      task: <CheckCircle className="w-4 h-4" />,
      approval: <History className="w-4 h-4" />,
      form: <FileText className="w-4 h-4" />,
      user: <User className="w-4 h-4" />
    };
    return icons[type] || <FileText className="w-4 h-4" />;
  };

  const filteredLogs = logs.filter(log => {
    // Filter by action type
    if (filter !== 'all' && log.action !== filter) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesEntity = log.entity_type?.toLowerCase().includes(searchLower) ||
                           log.entity_id?.toLowerCase().includes(searchLower);
      const matchesAction = log.action?.toLowerCase().includes(searchLower);
      const matchesUser = log.user?.toLowerCase().includes(searchLower);
      if (!matchesEntity && !matchesAction && !matchesUser) return false;
    }
    
    // Filter by date range
    if (dateRange.start) {
      const logDate = new Date(log.timestamp);
      const startDate = new Date(dateRange.start);
      if (logDate < startDate) return false;
    }
    if (dateRange.end) {
      const logDate = new Date(log.timestamp);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      if (logDate > endDate) return false;
    }
    
    return true;
  });

  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = new Date(log.timestamp).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {});

  return (
    <div className={`fixed inset-0 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'} bg-white z-50 flex flex-col`} data-testid="audit-trail">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4 shadow-lg">
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
            <History className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Audit Trail</h1>
              <p className="text-slate-300 text-sm">Complete activity history</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadLogs}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
              data-testid="refresh-logs-btn"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-audit-trail-btn"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4 flex-wrap gap-y-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              data-testid="audit-search-input"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            data-testid="audit-filter-select"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="executed">Executed</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="assigned">Assigned</option>
            <option value="reassigned">Reassigned</option>
            <option value="escalated">Escalated</option>
          </select>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              data-testid="date-start-input"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              data-testid="date-end-input"
            />
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredLogs.length} of {logs.length} entries
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
          </div>
        ) : Object.keys(groupedLogs).length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No audit logs found</h3>
            <p className="text-gray-400">Activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 mb-3 sticky top-0 bg-gray-50 py-2">
                  {date}
                </h3>
                <div className="space-y-2">
                  {dateLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                      data-testid={`audit-log-${log.id}`}
                    >
                      <div
                        className="flex items-center p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          {getActionIcon(log.action)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getActionColor(log.action)}`}>
                                {log.action}
                              </span>
                              <span className="text-gray-600">
                                {log.entity_type}
                              </span>
                              {log.entity_id && (
                                <span className="text-gray-400 font-mono text-xs">
                                  #{log.entity_id.slice(0, 8)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {log.user && <span className="mr-2">by {log.user}</span>}
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        {expandedLog === log.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      {expandedLog === log.id && (
                        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                          <div className="pt-3 space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-gray-500">Entity Type:</span>
                                <span className="ml-2 text-gray-900">{log.entity_type}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Entity ID:</span>
                                <span className="ml-2 text-gray-900 font-mono text-xs">{log.entity_id}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Action:</span>
                                <span className="ml-2 text-gray-900">{log.action}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Timestamp:</span>
                                <span className="ml-2 text-gray-900">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                            {log.details && (
                              <div className="mt-3">
                                <span className="text-gray-500">Details:</span>
                                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;
