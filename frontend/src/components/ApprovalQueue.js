import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck, Clock, CheckCircle, XCircle, AlertCircle,
  User, Calendar, MessageSquare, ChevronRight, RefreshCw,
  Search, Filter, ThumbsUp, ThumbsDown, Edit3, Users,
  GitBranch, Send, ArrowRight, CheckSquare
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ApprovalQueue = ({ onClose }) => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionComment, setDecisionComment] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/approvals`;
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      const approvalList = data.approvals || [];
      setApprovals(approvalList);
      
      // Load all approvals for stats
      const allRes = await fetch(`${BACKEND_URL}/api/approvals`);
      const allData = await allRes.json();
      const allApprovals = allData.approvals || [];
      setStats({
        pending: allApprovals.filter(a => a.status === 'pending').length,
        approved: allApprovals.filter(a => a.status === 'approved').length,
        rejected: allApprovals.filter(a => a.status === 'rejected').length
      });
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadApprovals();
    const interval = setInterval(loadApprovals, 10000);
    return () => clearInterval(interval);
  }, [loadApprovals]);

  const handleDecision = async (approvalId, decision) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/approvals/${approvalId}/decide?decision=${decision}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: decisionComment || null,
          decided_by: 'current_user'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to record decision');
      }
      
      const result = await response.json();
      
      // Show result message
      if (result.final_status !== 'pending') {
        alert(`Approval ${result.final_status}! Workflow will ${result.should_resume ? 'continue' : 'wait for more decisions'}.`);
      } else {
        alert(`Decision recorded. Waiting for more approvals (${result.votes.approved}/${result.votes.total_required} approved).`);
      }
      
      setDecisionComment('');
      loadApprovals();
      setSelectedApproval(null);
    } catch (error) {
      alert('Failed to record decision: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      changes_requested: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[status] || colors.pending;
  };

  const getApprovalTypeIcon = (type) => {
    const icons = {
      single: <User className="w-4 h-4" />,
      sequential: <ArrowRight className="w-4 h-4" />,
      parallel: <Users className="w-4 h-4" />,
      unanimous: <CheckSquare className="w-4 h-4" />,
      majority: <GitBranch className="w-4 h-4" />
    };
    return icons[type] || icons.single;
  };

  const getApprovalTypeLabel = (type) => {
    const labels = {
      single: 'Single Approver',
      sequential: 'Sequential Approval',
      parallel: 'Parallel Approval',
      unanimous: 'Unanimous Required',
      majority: 'Majority Vote'
    };
    return labels[type] || type;
  };

  const getApprovalTypeDescription = (type) => {
    const descriptions = {
      single: 'First decision is final',
      sequential: 'Approvers must approve in order',
      parallel: 'All approvers vote simultaneously',
      unanimous: 'All approvers must approve',
      majority: 'More than 50% must approve'
    };
    return descriptions[type] || '';
  };

  const filteredApprovals = approvals.filter(approval =>
    approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (approval.description && approval.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDecisionProgress = (approval) => {
    if (!approval.approvers || approval.approvers.length === 0) return null;
    const decisions = approval.decisions || [];
    const approved = decisions.filter(d => d.decision === 'approved').length;
    const rejected = decisions.filter(d => d.decision === 'rejected').length;
    const total = approval.approvers.length;
    return { approved, rejected, total, pending: total - approved - rejected };
  };

  const renderProgressBar = (progress, approvalType) => {
    if (!progress) return null;
    const { approved, rejected, total } = progress;
    const approvedPercent = (approved / total) * 100;
    const rejectedPercent = (rejected / total) * 100;
    
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress: {approved + rejected} / {total} votes</span>
          <span className="capitalize">{approvalType?.replace('_', ' ')}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-green-500 transition-all" 
            style={{ width: `${approvedPercent}%` }}
          />
          <div 
            className="h-full bg-red-500 transition-all" 
            style={{ width: `${rejectedPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-xs">
          <span className="text-green-600">{approved} approved</span>
          <span className="text-red-600">{rejected} rejected</span>
          <span className="text-gray-500">{progress.pending} pending</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col" data-testid="approval-queue">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardCheck className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Approval Queue</h1>
              <p className="text-purple-100 text-sm">Review and approve workflow requests</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadApprovals}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
              data-testid="refresh-approvals-btn"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              data-testid="close-approval-queue-btn"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Pending: <strong>{stats.pending}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Approved: <strong>{stats.approved}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Rejected: <strong>{stats.rejected}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Approval List */}
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
                  placeholder="Search approvals..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  data-testid="approval-search-input"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                data-testid="approval-filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="changes_requested">Changes Requested</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredApprovals.length} approvals</span>
            </div>
          </div>

          {/* Approval Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No approvals found</h3>
                <p className="text-gray-400">All caught up!</p>
              </div>
            ) : (
              filteredApprovals.map((approval) => {
                const progress = getDecisionProgress(approval);
                return (
                  <div
                    key={approval.id}
                    onClick={() => setSelectedApproval(approval)}
                    className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedApproval?.id === approval.id
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`approval-item-${approval.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{approval.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(approval.status)}`}>
                        {approval.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{approval.description || 'No description'}</p>
                    
                    {/* Approval Type Badge */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                        {getApprovalTypeIcon(approval.approval_type)}
                        <span>{getApprovalTypeLabel(approval.approval_type)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {renderProgressBar(progress, approval.approval_type)}

                    {/* Approvers */}
                    {approval.approvers && approval.approvers.length > 0 && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {approval.approvers.slice(0, 3).join(', ')}
                          {approval.approvers.length > 3 && ` +${approval.approvers.length - 3} more`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Approval Details */}
        <div className="w-1/2 flex flex-col bg-white">
          {selectedApproval ? (
            <>
              {/* Approval Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedApproval.title}</h2>
                    <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                      <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(selectedApproval.status)}`}>
                        {selectedApproval.status?.replace('_', ' ')}
                      </span>
                      <span className="flex items-center text-sm text-gray-600 bg-purple-50 px-3 py-1 rounded-full">
                        {getApprovalTypeIcon(selectedApproval.approval_type)}
                        <span className="ml-1">{getApprovalTypeLabel(selectedApproval.approval_type)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approval Type Description */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>How it works:</strong> {getApprovalTypeDescription(selectedApproval.approval_type)}
                  </p>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedApproval.description || 'No description provided'}</p>
                </div>

                {/* Progress Bar */}
                {renderProgressBar(getDecisionProgress(selectedApproval), selectedApproval.approval_type)}

                {/* Approvers List */}
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Approvers</h3>
                  <div className="space-y-2">
                    {(selectedApproval.approvers || []).map((approver, idx) => {
                      const decision = (selectedApproval.decisions || []).find(d => d.decided_by === approver);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              decision?.decision === 'approved' ? 'bg-green-500' :
                              decision?.decision === 'rejected' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}>
                              {approver.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">{approver}</span>
                              {decision?.comment && (
                                <p className="text-xs text-gray-500 mt-0.5">"{decision.comment}"</p>
                              )}
                            </div>
                          </div>
                          {decision ? (
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                              decision.decision === 'approved' ? 'bg-green-100 text-green-800' :
                              decision.decision === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {decision.decision === 'approved' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                              {decision.decision === 'rejected' && <XCircle className="w-3 h-3 inline mr-1" />}
                              {decision.decision}
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Pending</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Decision History */}
              <div className="flex-1 overflow-y-auto p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Decision History</h3>
                <div className="space-y-4">
                  {(selectedApproval.decisions || []).map((decision, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{decision.decided_by || 'Unknown'}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          decision.decision === 'approved' ? 'bg-green-100 text-green-800' :
                          decision.decision === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {decision.decision}
                        </span>
                      </div>
                      {decision.comment && (
                        <p className="text-sm text-gray-600 mb-2">{decision.comment}</p>
                      )}
                      <span className="text-xs text-gray-400">
                        {decision.timestamp ? new Date(decision.timestamp).toLocaleString() : ''}
                      </span>
                    </div>
                  ))}
                  {(!selectedApproval.decisions || selectedApproval.decisions.length === 0) && (
                    <p className="text-gray-400 text-sm">No decisions yet</p>
                  )}
                </div>
              </div>

              {/* Decision Actions */}
              {selectedApproval.status === 'pending' && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
                    <textarea
                      value={decisionComment}
                      onChange={(e) => setDecisionComment(e.target.value)}
                      placeholder="Add a comment with your decision..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      data-testid="decision-comment-input"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleDecision(selectedApproval.id, 'approved')}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                      data-testid="approve-btn"
                    >
                      <ThumbsUp className="w-5 h-5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleDecision(selectedApproval.id, 'rejected')}
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
                      data-testid="reject-btn"
                    >
                      <ThumbsDown className="w-5 h-5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleDecision(selectedApproval.id, 'changes_requested')}
                      className="flex items-center justify-center space-x-2 bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                      data-testid="request-changes-btn"
                      title="Request Changes"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ClipboardCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600">Select an approval</h3>
                <p className="text-gray-400">Click on an approval to review</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalQueue;
