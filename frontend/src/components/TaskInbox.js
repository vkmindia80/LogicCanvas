import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Clock, AlertCircle, User, Calendar, Flag,
  ChevronRight, RefreshCw, Search, Filter, MessageSquare,
  ArrowRight, UserPlus, AlertTriangle, CheckCircle, XCircle,
  MoreVertical, Send
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const TaskInbox = ({ onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed
  const [searchTerm, setSearchTerm] = useState('');
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTo, setReassignTo] = useState('');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/tasks`;
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadTasks, 10000);
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
      alert('Please enter a user to reassign to');
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

  const handleDelegate = async (taskId) => {
    const delegateTo = prompt('Enter email to delegate to:');
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

  const handleEscalate = async (taskId) => {
    const reason = prompt('Enter escalation reason:');
    if (!reason) return;
    try {
      await fetch(`${BACKEND_URL}/api/tasks/${taskId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() })
      });
      loadTasks();
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
      urgent: 'bg-red-100 text-red-700 border-red-300'
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

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSlaStatus = (task) => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const diffHours = (dueDate - now) / (1000 * 60 * 60);
    
    if (diffHours < 0) return { status: 'overdue', color: 'text-red-500', label: 'Overdue' };
    if (diffHours < 2) return { status: 'critical', color: 'text-orange-500', label: 'Due soon' };
    if (diffHours < 24) return { status: 'warning', color: 'text-yellow-500', label: 'Due today' };
    return { status: 'ok', color: 'text-green-500', label: 'On track' };
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" data-testid="task-inbox">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckSquare className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Task Inbox</h1>
              <p className="text-blue-100 text-sm">Manage your assigned tasks</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadTasks}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
              data-testid="refresh-tasks-btn"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              data-testid="close-task-inbox-btn"
            >
              Close
            </button>
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
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="task-filter-select"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredTasks.length} tasks</span>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filter by priority</span>
              </div>
            </div>
          </div>

          {/* Task Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No tasks found</h3>
                <p className="text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const slaStatus = getSlaStatus(task);
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedTask?.id === task.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`task-item-${task.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
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
                            {task.assigned_to}
                          </span>
                        )}
                      </div>
                      {slaStatus && (
                        <span className={`flex items-center ${slaStatus.color}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {slaStatus.label}
                        </span>
                      )}
                    </div>
                  </div>
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
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedTask.title}</h2>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status?.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 text-sm rounded-full border ${getPriorityColor(selectedTask.priority)}`}>
                        <Flag className="w-3 h-3 inline mr-1" />
                        {selectedTask.priority}
                      </span>
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
                      <div className="absolute right-0 top-10 bg-white shadow-lg rounded-lg border border-gray-200 py-2 w-48 z-10">
                        <button
                          onClick={() => handleReassign(selectedTask.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                          data-testid="reassign-task-btn"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Reassign</span>
                        </button>
                        <button
                          onClick={() => handleDelegate(selectedTask.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                          data-testid="delegate-task-btn"
                        >
                          <ArrowRight className="w-4 h-4" />
                          <span>Delegate</span>
                        </button>
                        <button
                          onClick={() => handleEscalate(selectedTask.id)}
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

                {/* Reassign Input */}
                {showReassign && (
                  <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 rounded-lg">
                    <input
                      type="text"
                      value={reassignTo}
                      onChange={(e) => setReassignTo(e.target.value)}
                      placeholder="Enter email to reassign to..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      data-testid="reassign-input"
                    />
                    <button
                      onClick={() => handleReassign(selectedTask.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      Reassign
                    </button>
                  </div>
                )}

                {/* Task Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Assigned to: {selectedTask.assigned_to || 'Unassigned'}</span>
                  </div>
                  {selectedTask.due_date && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(selectedTask.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
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
                      <p className="text-gray-600 text-sm">{c.content}</p>
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
                      <CheckCircle className="w-5 h-5" />
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
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CheckSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600">Select a task</h3>
                <p className="text-gray-400">Click on a task to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskInbox;
