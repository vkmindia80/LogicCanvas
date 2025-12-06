import React, { useState } from 'react';
import { AlertTriangle, Lock, FileText, Activity, MessageSquare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const EditProtectionModal = ({ 
  workflowId, 
  workflowName,
  currentState, 
  activeInstances = 0,
  onConfirm, 
  onCancel 
}) => {
  const [changeNotes, setChangeNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateDraftVersion = async () => {
    if (!changeNotes.trim()) {
      alert('Please provide a reason for creating a new draft version');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/api/workflows/${workflowId}/create-draft-version`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: changeNotes,
            changed_by: 'current_user'
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        if (onConfirm) {
          onConfirm(result);
        }
      } else {
        alert(result.detail || 'Failed to create draft version');
      }
    } catch (error) {
      console.error('Failed to create draft version:', error);
      alert('Failed to create draft version');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        {/* Warning Header */}
        <div className="mb-4 flex items-center space-x-3 rounded-lg bg-orange-50 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-200">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-orange-900">Published Workflow - Edit Protection</h3>
            <p className="text-sm text-orange-700">
              This workflow is currently published and cannot be edited directly
            </p>
          </div>
        </div>

        {/* Workflow Info */}
        <div className="mb-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-slate-500" />
            <div>
              <div className="text-sm font-medium text-slate-700">Workflow Name</div>
              <div className="text-slate-900">{workflowName}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-slate-500" />
            <div>
              <div className="text-sm font-medium text-slate-700">Current State</div>
              <div className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                {currentState === 'published' ? 'Published' : currentState}
              </div>
            </div>
          </div>
          {activeInstances > 0 && (
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-slate-700">Active Instances</div>
                <div className="text-slate-900">
                  {activeInstances} workflow instance{activeInstances !== 1 ? 's' : ''} currently running
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="mb-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">What will happen?</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start space-x-2">
              <span className="mt-0.5 text-blue-600">✓</span>
              <span>A new draft version will be created for you to edit</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="mt-0.5 text-blue-600">✓</span>
              <span>The current published version will remain active and unchanged</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="mt-0.5 text-blue-600">✓</span>
              <span>Active workflow instances will continue running on the current version</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="mt-0.5 text-blue-600">✓</span>
              <span>After editing, you can request review and publish the new version</span>
            </li>
          </ul>
        </div>

        {/* Change Notes Input */}
        <div className="mb-4">
          <label className="mb-2 flex items-center space-x-2 text-sm font-semibold text-slate-700">
            <MessageSquare className="h-4 w-4" />
            <span>Reason for Changes (Required)</span>
          </label>
          <textarea
            value={changeNotes}
            onChange={(e) => setChangeNotes(e.target.value)}
            placeholder="Describe why you're creating a new draft version (e.g., 'Adding new approval step', 'Fixing task assignment logic')..."
            className="w-full rounded-lg border border-slate-300 p-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            rows={3}
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-500">
            This will be recorded in the version history and audit trail
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateDraftVersion}
            disabled={loading || !changeNotes.trim()}
            className="flex-1 rounded-lg bg-primary-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                <span>Creating...</span>
              </span>
            ) : (
              'Create Draft Version'
            )}
          </button>
        </div>

        {/* Info Footer */}
        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
          <strong>Note:</strong> You can also pause the workflow first if you want to prevent new instances from starting while you make changes.
        </div>
      </div>
    </div>
  );
};

export default EditProtectionModal;
