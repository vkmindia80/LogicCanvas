import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, X, Check, CheckCheck, Trash2, Filter,
  AlertTriangle, Clock, User, CheckCircle, MessageSquare,
  Mail, RefreshCw, Menu
} from 'lucide-react';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import { SkeletonList } from './Skeleton';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const NotificationsPanel = ({ onClose, onOpenMobileSidebar, sidebarCollapsed = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/notifications`;
      if (filter === 'unread') {
        url += '?unread_only=true';
      }
      const response = await fetch(url);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${BACKEND_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/notifications/mark-all-read`, {
        method: 'POST'
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      mention: MessageSquare,
      escalation: AlertTriangle,
      sla_breach: Clock,
      approval_required: CheckCircle,
      task_assigned: User,
      default: Bell
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'urgent' || priority === 'high') {
      return 'border-l-gold-500 bg-gold-50';
    }
    const colors = {
      mention: 'border-l-green-500 bg-green-50',
      escalation: 'border-l-orange-500 bg-gold-50',
      sla_breach: 'border-l-gold-500 bg-gold-50',
      approval_required: 'border-l-purple-500 bg-gold-50',
      task_assigned: 'border-l-green-500 bg-green-50',
      default: 'border-l-green-500 bg-green-50'
    };
    return colors[type] || colors.default;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`fixed inset-0 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'} bg-white z-50 flex flex-col`} data-testid="notifications-panel">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 shadow-lg">
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
            <Bell className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-green-100 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadNotifications}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
              data-testid="refresh-notifications-btn"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
                data-testid="mark-all-read-btn"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-notifications-btn"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-green-200 px-6 py-3">
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
            data-testid="notification-filter-select"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </select>
          <span className="text-sm text-green-500">{notifications.length} notifications</span>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto bg-green-50 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto text-green-300 mb-4" />
            <h3 className="text-lg font-medium text-primary-600">No notifications</h3>
            <p className="text-green-400">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg border-l-4 shadow-sm p-4 transition-all hover:shadow-md ${
                    getNotificationColor(notification.type, notification.priority)
                  } ${!notification.read ? 'ring-1 ring-green-200' : ''}`}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      notification.priority === 'urgent' ? 'bg-gold-100' :
                      notification.priority === 'high' ? 'bg-gold-100' : 'bg-green-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        notification.priority === 'urgent' ? 'text-gold-600' :
                        notification.priority === 'high' ? 'text-gold-600' : 'text-primary-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-primary-900">{notification.title}</h4>
                          <p className="text-sm text-primary-600 mt-1">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-green-100 rounded text-green-400 hover:text-green-600"
                            title="Mark as read"
                            data-testid={`mark-read-${notification.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-green-400">
                        <span className="capitalize">{notification.type?.replace('_', ' ')}</span>
                        {notification.priority && (
                          <span className={`px-2 py-0.5 rounded-full ${
                            notification.priority === 'urgent' ? 'bg-gold-100 text-gold-700' :
                            notification.priority === 'high' ? 'bg-gold-100 text-gold-700' :
                            'bg-green-100 text-primary-600'
                          }`}>
                            {notification.priority}
                          </span>
                        )}
                        <span>{notification.created_at ? new Date(notification.created_at).toLocaleString() : ''}</span>
                        {notification.read && (
                          <span className="text-green-600">Read</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
