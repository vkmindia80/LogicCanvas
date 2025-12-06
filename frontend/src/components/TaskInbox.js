import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Clock, AlertCircle, User, Calendar, Flag,
  ChevronRight, RefreshCw, Search, Filter, MessageSquare,
  ArrowRight, UserPlus, AlertTriangle, CheckCircle as CheckCircleIcon, XCircle,
  MoreVertical, Send, Users, Zap, Timer, TrendingUp
} from 'lucide-react';
import EmptyState from './EmptyState';
import Tooltip from './Tooltip';
import LoadingSpinner from './LoadingSpinner';
import { SkeletonList } from './Skeleton';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const TaskInbox = ({ onClose, onNotify }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTo, setReassignTo] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0 });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/tasks`;
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      const taskList = data.tasks || [];
      setTasks(taskList);
      
      // Calculate stats
      setStats({
        pending: taskList.filter(t => t.status === 'pending').length,
        inProgress: taskList.filter(t => t.status === 'in_progress').length,
        completed: taskList.filter(t => t.status === 'completed').length
      });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadUsersAndRoles = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/users`),
        fetch(`${BACKEND_URL}/api/roles`)
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      setUsers(usersData.users || []);
      setRoles(rolesData.roles || []);
    } catch (error) {
      console.error('Failed to load users/roles:', error);
    }
  };

  const loadSlaMetrics = async () => {
    try {
      const [overdueRes, atRiskRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/tasks/sla/overdue`),
        fetch(`${BACKEND_URL}/api/tasks/sla/at-risk`)
      ]);
      const overdueData = await overdueRes.json();
      const atRiskData = await atRiskRes.json();
      setOverdueCount(overdueData.count || 0);
      setAtRiskCount(atRiskData.count || 0);
    } catch (error) {
      console.error('Failed to load SLA metrics:', error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadUsersAndRoles();
    loadSlaMetrics();
    const interval = setInterval(() => {
      loadTasks();
      loadSlaMetrics();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  useEffect(() => {
    if (selectedTask) {
      loadComments(selectedTask.id);
    }
  }, [selectedTask]);

  const loadComments = async (taskId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await fetch(`${BACKEND_URL}/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result_data: { completed_at: new Date().toISOString() } })
      });
      loadTasks();
      setSelectedTask(null);
    } catch (error) {
      alert('Failed to complete task: ' + error.message);
    }
  };

  const handleReassign = async (taskId) => {
    if (!reassignTo.trim()) {
      alert('Please select a user to reassign to');
      return;
    }
    try {
      await fetch(`${BACKEND_URL}/api/tasks/${taskId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_assignee: reassignTo.trim() })
      });
      setShowReassign(false);
      setReassignTo('');
      loadTasks();
    } catch (error) {
      alert('Failed to reassign task: ' + error.message);
    }
  };

  const handleDelegate = async (taskId, delegateTo) => {
    if (!delegateTo) return;
    try {
      await fetch(`${BACKEND_URL}/api/tasks/${taskId}/delegate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegate_to: delegateTo.trim() })
      });
      loadTasks();
    } catch (error) {
      alert('Failed to delegate task: ' + error.message);
    }
  };

  const handleEscalate = async (taskId, reason) => {
    if (!reason) return;
    try {
      await fetch(`${BACKEND_URL}/api/tasks/${taskId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() })
      });
      loadTasks();
      loadSlaMetrics();
    } catch (error) {
      alert('Failed to escalate task: ' + error.message);
    }
  };

  const handleAddComment = async (taskId) => {
    if (!comment.trim()) return;
    try {
      await fetch(`${BACKEND_URL}/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment.trim(), author: 'current_user' })
      });
      setComment('');
      loadComments(taskId);
    } catch (error) {
      alert('Failed to add comment: ' + error.message);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-slate-100 text-slate-700 border-slate-300',
      medium: 'bg-blue-100 text-blue-700 border-blue-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      urgent: 'bg-red-100 text-red-700 border-red-300 animate-pulse'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const getSlaStatus = (task) => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const diffHours = (dueDate - now) / (1000 * 60 * 60);
    
    if (diffHours < 0) return { status: 'overdue', color: 'text-red-500 bg-red-50', label: 'Overdue', icon: AlertTriangle };
    if (diffHours < 2) return { status: 'critical', color: 'text-orange-500 bg-orange-50', label: 'Critical', icon: AlertCircle };
    if (diffHours < 24) return { status: 'warning', color: 'text-yellow-600 bg-yellow-50', label: 'Due Soon', icon: Clock };
    return { status: 'ok', color: 'text-green-500 bg-green-50', label: 'On Track', icon: CheckCircleIcon };
  };

  const formatTimeRemaining = (dueDate) => {
    if (!dueDate) return '';
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = due - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs < 0) return 'Overdue';
    if (diffHours > 24) return `${Math.floor(diffHours / 24)}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    return `${diffMins}m`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 z-50 flex flex-col" data-testid="task-inbox">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Task Inbox</h1>
              <p className="text-blue-100 text-sm">Manage your assigned tasks and track progress</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => { loadTasks(); loadSlaMetrics(); }}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all hover:shadow-lg font-medium"
              data-testid="refresh-tasks-btn"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 px-4 py-2 rounded-xl transition-all hover:shadow-lg font-medium"
              data-testid="close-task-inbox-btn"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b-2 border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl flex items-center space-x-2 font-medium">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Pending: <strong>{stats.pending}</strong></span>
            </div>
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl flex items-center space-x-2 font-medium">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">In Progress: <strong>{stats.inProgress}</strong></span>
            </div>
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-xl flex items-center space-x-2 font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Completed: <strong>{stats.completed}</strong></span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {overdueCount > 0 && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-semibold border border-red-200">
                <AlertTriangle className="w-4 h-4" />
                <span>{overdueCount} Overdue</span>
              </div>
            )}
            {atRiskCount > 0 && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl text-sm font-semibold border border-orange-200">
                <Timer className="w-4 h-4" />
                <span>{atRiskCount} At Risk</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Task List */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col bg-gray-50">
          {/* Filters */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  data-testid="task-search-input"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                data-testid="task-filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                data-testid="task-priority-filter"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <span className="text-sm text-gray-500">{filteredTasks.length} tasks</span>
            </div>
          </div>

          {/* Task Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <SkeletonList count={5} />
            ) : filteredTasks.length === 0 ? (
              <EmptyState
                icon={searchTerm || filter !== 'all' || priorityFilter !== 'all' ? Search : CheckCircleIcon}
                title={searchTerm || filter !== 'all' || priorityFilter !== 'all' ? 'No tasks found' : 'All caught up!'}
                description={
                  searchTerm || filter !== 'all' || priorityFilter !== 'all'
                    ? 'No tasks match your current filters. Try adjusting your search or filter criteria.'
                    : 'You have no pending tasks. Great job! New tasks will appear here when they are assigned to you.'
                }
                className="py-8"
              />
            ) : (
              filteredTasks.map((task) => {
                const slaStatus = getSlaStatus(task);
                const SlaIcon = slaStatus?.icon || Clock;
                const statusColor = getSlaStatus(task);
                return (
                  <Tooltip 
                    key={task.id}
                    content={`${task.title} - ${task.status.replace('_', ' ')}`}
                    position="right"
                    disabled={selectedTask?.id === task.id}
                    delay={500}
                  >
                    <div
                      onClick={() => setSelectedTask(task)}
                      className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedTask?.id === task.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${task.escalated ? 'border-l-4 border-l-red-500' : ''}`}
                      data-testid={`task-item-${task.id}`}
                    >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          {task.escalated && (
                            <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">Escalated</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description || 'No description'}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 text-gray-500">
                        <span className={`px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                          {task.status?.replace('_', ' ')}
                        </span>
                        {task.assigned_to && (
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {task.assigned_to.split('@')[0]}
                          </span>
                        )}
                      </div>
                      {slaStatus && (
                        <span className={`flex items-center px-2 py-1 rounded-full ${slaStatus.color}`}>
                          <SlaIcon className="w-3 h-3 mr-1" />
                          {formatTimeRemaining(task.due_date)}
                        </span>
                      )}
                    </div>
                    </div>
                  </Tooltip>
                );
              })
            )}
          </div>
        </div>

        {/* Task Details */}
        <div className="w-1/2 flex flex-col bg-white">
          {selectedTask ? (
            <>
              {/* Task Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                    <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status?.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 text-sm rounded-full border ${getPriorityColor(selectedTask.priority)}`}>
                        <Flag className="w-3 h-3 inline mr-1" />
                        {selectedTask.priority}
                      </span>
                      {selectedTask.escalated && (
                        <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Escalated
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => setShowReassign(!showReassign)}
                      data-testid="task-actions-btn"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                    {showReassign && (
                      <div className="absolute right-0 top-10 bg-white shadow-lg rounded-lg border border-gray-200 py-2 w-56 z-10">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500 font-medium mb-2">Reassign to:</p>
                          <select
                            value={reassignTo}
                            onChange={(e) => setReassignTo(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            data-testid="reassign-user-select"
                          >
                            <option value="">Select user...</option>
                            {users.map(u => (
                              <option key={u.id} value={u.email}>{u.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleReassign(selectedTask.id)}
                            disabled={!reassignTo}
                            className="w-full mt-2 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                          >
                            Reassign
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            const delegateTo = prompt('Enter email to delegate to:');
                            if (delegateTo) handleDelegate(selectedTask.id, delegateTo);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                          data-testid="delegate-task-btn"
                        >
                          <ArrowRight className="w-4 h-4" />
                          <span>Delegate</span>
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter escalation reason:');
                            if (reason) handleEscalate(selectedTask.id, reason);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-orange-600 flex items-center space-x-2"
                          data-testid="escalate-task-btn"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Escalate</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Task Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Assigned:</span>
                    <span className="font-medium">{selectedTask.assigned_to || 'Unassigned'}</span>
                  </div>
                  {selectedTask.due_date && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Due:</span>
                      <span className="font-medium">{new Date(selectedTask.due_date).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedTask.assignment_strategy && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Strategy:</span>
                      <span className="font-medium capitalize">{selectedTask.assignment_strategy.replace('_', ' ')}</span>
                    </div>
                  )}
                  {selectedTask.sla_hours && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Timer className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">SLA:</span>
                      <span className="font-medium">{selectedTask.sla_hours} hours</span>
                    </div>
                  )}
                </div>

                {/* SLA Status */}
                {selectedTask.due_date && (
                  <div className="mt-4">
                    {(() => {
                      const slaStatus = getSlaStatus(selectedTask);
                      if (!slaStatus) return null;
                      const SlaIcon = slaStatus.icon;
                      return (
                        <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg ${slaStatus.color}`}>
                          <SlaIcon className="w-5 h-5" />
                          <span className="font-medium">{slaStatus.label}</span>
                          <span className="text-sm">({formatTimeRemaining(selectedTask.due_date)} remaining)</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedTask.description || 'No description provided'}</p>
              </div>

              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Comments ({comments.length})
                </h3>
                <div className="space-y-4 mb-4">
                  {comments.map((c, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{c.author || 'Anonymous'}</span>
                        <span className="text-xs text-gray-500">
                          {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {c.content.split(' ').map((word, i) => 
                          word.startsWith('@') ? 
                            <span key={i} className="text-blue-600 font-medium">{word} </span> : 
                            word + ' '
                        )}
                      </p>
                      {c.mentions && c.mentions.length > 0 && (
                        <div className="mt-2 flex items-center space-x-1 text-xs text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>Mentioned: {c.mentions.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-gray-400 text-sm">No comments yet</p>
                  )}
                </div>

                {/* Add Comment */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment... Use @username to mention"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(selectedTask.id)}
                    data-testid="comment-input"
                  />
                  <button
                    onClick={() => handleAddComment(selectedTask.id)}
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                    data-testid="add-comment-btn"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  {selectedTask.status !== 'completed' && (
                    <button
                      onClick={() => handleComplete(selectedTask.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                      data-testid="complete-task-btn"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Complete Task</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="Select a task"
              description="Click on a task from the list to view its details, add comments, and take actions."
              className="flex-1"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskInbox;
