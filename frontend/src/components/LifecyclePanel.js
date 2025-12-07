import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Clock, 
  Play, 
  Pause, 
  Archive, 
  ArrowRight,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  MessageSquare
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const LIFECYCLE_STATES = {
  draft: {
    label: 'Draft',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    icon: FileText
  },
  in_review: {
    label: 'In Review',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    icon: Users
  },
  published: {
    label: 'Published',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: CheckCircle
  },
  paused: {
    label: 'Paused',
    color: 'orange',
    bgColor: 'bg-gold-100',
    textColor: 'text-gold-700',
    borderColor: 'border-gold-300',
    icon: Pause
  },
  archived: {
    label: 'Archived',
    color: 'slate',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    icon: Archive
  }
};

const LifecyclePanel = ({ workflowId, currentState = 'draft', onClose, onStateChange }) => {
  const [loading, setLoading] = useState(false);
  const [lifecycleHistory, setLifecycleHistory] = useState([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadLifecycleHistory();
  }, [workflowId]);

  const loadLifecycleHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/lifecycle/history`);
      const data = await response.json();
      setLifecycleHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load lifecycle history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async (action, endpoint, requiresComment = false) => {
    if (requiresComment && !comment.trim()) {
      alert('Please provide a comment for this action');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/lifecycle/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: comment || null,
          changed_by: 'current_user'
        })
      });

      const result = await response.json();

      if (response.ok) {
        setComment('');
        setShowCommentModal(false);
        setSelectedAction(null);
        await loadLifecycleHistory();
        
        if (onStateChange) {
          onStateChange(result.new_state);
        }
      } else {
        alert(result.detail || 'Transition failed');
      }
    } catch (error) {
      console.error('Transition failed:', error);
      alert('Failed to perform lifecycle transition');
    } finally {
      setActionLoading(false);
    }
  };

  const initiateAction = (action, endpoint, requiresComment = false) => {
    setSelectedAction({ action, endpoint, requiresComment });
    if (requiresComment) {
      setShowCommentModal(true);
    } else {
      handleTransition(action, endpoint, false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (currentState) {
      case 'draft':
        actions.push({
          label: 'Request Review',
          icon: Users,
          action: 'review',
          endpoint: 'review',
          color: 'blue',
          requiresComment: false
        });
        actions.push({
          label: 'Publish Directly',
          icon: CheckCircle,
          action: 'approve',
          endpoint: 'approve',
          color: 'green',
          requiresComment: false
        });
        break;

      case 'in_review':
        actions.push({
          label: 'Approve & Publish',
          icon: CheckCircle,
          action: 'approve',
          endpoint: 'approve',
          color: 'green',
          requiresComment: false
        });
        actions.push({
          label: 'Request Changes',
          icon: ArrowRight,
          action: 'reject',
          endpoint: 'reject',
          color: 'red',
          requiresComment: true
        });
        break;

      case 'published':
        actions.push({
          label: 'Pause Workflow',
          icon: Pause,
          action: 'pause',
          endpoint: 'pause',
          color: 'orange',
          requiresComment: false
        });
        actions.push({
          label: 'Archive',
          icon: Archive,
          action: 'archive',
          endpoint: 'archive',
          color: 'slate',
          requiresComment: true
        });
        break;

      case 'paused':
        actions.push({
          label: 'Resume',
          icon: Play,
          action: 'resume',
          endpoint: 'resume',
          color: 'green',
          requiresComment: false
        });
        actions.push({
          label: 'Archive',
          icon: Archive,
          action: 'archive',
          endpoint: 'archive',
          color: 'slate',
          requiresComment: true
        });
        break;

      case 'archived':
        // No actions available for archived workflows
        break;
    }

    return actions;
  };

  const StateIcon = LIFECYCLE_STATES[currentState]?.icon || FileText;
  const availableActions = getAvailableActions();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${LIFECYCLE_STATES[currentState]?.bgColor}`}>
                  <StateIcon className={`h-5 w-5 ${LIFECYCLE_STATES[currentState]?.textColor}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Workflow Lifecycle</h2>
                  <p className="text-sm text-slate-500">Manage workflow state and transitions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {/* Current State */}
            <div className="mb-6 rounded-lg border-2 border-dashed p-6 text-center" style={{ borderColor: LIFECYCLE_STATES[currentState]?.borderColor?.replace('border-', '') }}>
              <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${LIFECYCLE_STATES[currentState]?.bgColor}`}>
                <StateIcon className={`h-8 w-8 ${LIFECYCLE_STATES[currentState]?.textColor}`} />
              </div>
              <h3 className="mb-1 text-2xl font-bold text-slate-900">
                {LIFECYCLE_STATES[currentState]?.label || 'Unknown'}
              </h3>
              <p className="text-sm text-slate-600">Current workflow state</p>
            </div>

            {/* Available Actions */}
            {availableActions.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-3 text-sm font-semibold text-slate-700">Available Actions</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {availableActions.map((action, index) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => initiateAction(action.action, action.endpoint, action.requiresComment)}
                        disabled={actionLoading}
                        className={`flex items-center space-x-3 rounded-lg border-2 p-4 text-left transition-all hover:shadow-md disabled:opacity-50 ${
                          action.color === 'blue' ? 'border-green-200 bg-green-50 hover:bg-green-100' :
                          action.color === 'green' ? 'border-green-200 bg-green-50 hover:bg-green-100' :
                          action.color === 'red' ? 'border-red-200 bg-red-50 hover:bg-red-100' :
                          action.color === 'orange' ? 'border-gold-200 bg-gold-50 hover:bg-gold-100' :
                          'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                          action.color === 'blue' ? 'bg-green-200' :
                          action.color === 'green' ? 'bg-green-200' :
                          action.color === 'red' ? 'bg-red-200' :
                          action.color === 'orange' ? 'bg-gold-200' :
                          'bg-slate-200'
                        }`}>
                          <ActionIcon className="h-5 w-5 text-slate-700" />
                        </div>
                        <span className="font-medium text-slate-900">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lifecycle History Timeline */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-700">Lifecycle History</h4>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
                </div>
              ) : lifecycleHistory.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                  <Clock className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                  <p className="text-sm text-slate-600">No lifecycle history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lifecycleHistory.map((entry, index) => {
                    const FromStateInfo = LIFECYCLE_STATES[entry.from_state] || LIFECYCLE_STATES.draft;
                    const ToStateInfo = LIFECYCLE_STATES[entry.to_state] || LIFECYCLE_STATES.draft;
                    const FromIcon = FromStateInfo.icon;
                    const ToIcon = ToStateInfo.icon;

                    return (
                      <div key={index} className="relative rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
                        {/* Timeline connector */}
                        {index < lifecycleHistory.length - 1 && (
                          <div className="absolute left-6 top-full h-4 w-0.5 bg-slate-200"></div>
                        )}

                        <div className="flex items-start space-x-4">
                          {/* State transition visual */}
                          <div className="flex items-center space-x-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${FromStateInfo.bgColor}`}>
                              <FromIcon className={`h-4 w-4 ${FromStateInfo.textColor}`} />
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${ToStateInfo.bgColor}`}>
                              <ToIcon className={`h-4 w-4 ${ToStateInfo.textColor}`} />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-slate-900">
                                {FromStateInfo.label} → {ToStateInfo.label}
                              </h5>
                              <span className="text-xs text-slate-500">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              <span className="font-medium">By:</span> {entry.changed_by}
                            </p>
                            {entry.comment && (
                              <div className="mt-2 flex items-start space-x-2 rounded-md bg-slate-50 p-2">
                                <MessageSquare className="h-4 w-4 flex-shrink-0 text-slate-400 mt-0.5" />
                                <p className="text-sm text-slate-700">{entry.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              {selectedAction?.action === 'reject' ? 'Request Changes' : 'Add Comment'}
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment or reason..."
              className="mb-4 w-full rounded-lg border border-slate-300 p-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              rows={4}
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setComment('');
                  setSelectedAction(null);
                }}
                disabled={actionLoading}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransition(selectedAction.action, selectedAction.endpoint, true)}
                disabled={actionLoading || !comment.trim()}
                className="flex-1 rounded-lg bg-primary-500 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LifecyclePanel;
