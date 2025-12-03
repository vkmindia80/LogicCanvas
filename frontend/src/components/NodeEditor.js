import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { NODE_CONFIGS, NODE_TYPES } from '../utils/nodeTypes';
import ExpressionEditor from './ExpressionEditor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const NodeEditor = ({ node, onUpdate, onDelete, onClose }) => {
  const [label, setLabel] = useState(node?.data?.label || '');
  const [description, setDescription] = useState(node?.data?.description || '');
  const [condition, setCondition] = useState(node?.data?.condition || '');
  const [assignedTo, setAssignedTo] = useState(node?.data?.assignedTo || '');
  const [priority, setPriority] = useState(node?.data?.priority || 'medium');
  const [approvers, setApprovers] = useState(node?.data?.approvers?.join(', ') || '');
  const [approvalType, setApprovalType] = useState(node?.data?.approvalType || 'single');
  const [formId, setFormId] = useState(node?.data?.formId || '');
  const [forms, setForms] = useState([]);
  
  // Action node states
  const [actionType, setActionType] = useState(node?.data?.actionType || 'http');
  const [url, setUrl] = useState(node?.data?.url || '');
  const [method, setMethod] = useState(node?.data?.method || 'GET');
  const [headers, setHeaders] = useState(node?.data?.headers ? JSON.stringify(node?.data?.headers, null, 2) : '{}');
  const [body, setBody] = useState(node?.data?.body ? JSON.stringify(node?.data?.body, null, 2) : '{}');
  const [authType, setAuthType] = useState(node?.data?.authType || 'none');
  const [token, setToken] = useState(node?.data?.token || '');
  const [script, setScript] = useState(node?.data?.script || '');

  useEffect(() => {
    if (node) {
      setLabel(node.data?.label || '');
      setDescription(node.data?.description || '');
      setCondition(node.data?.condition || '');
      setAssignedTo(node.data?.assignedTo || '');
      setPriority(node.data?.priority || 'medium');
      setApprovers(node.data?.approvers?.join(', ') || '');
      setApprovalType(node.data?.approvalType || 'single');
      setFormId(node.data?.formId || '');
      setActionType(node.data?.actionType || 'http');
      setUrl(node.data?.url || '');
      setMethod(node.data?.method || 'GET');
      setHeaders(node.data?.headers ? JSON.stringify(node.data?.headers, null, 2) : '{}');
      setBody(node.data?.body ? JSON.stringify(node.data?.body, null, 2) : '{}');
      setAuthType(node.data?.authType || 'none');
      setToken(node.data?.token || '');
      setScript(node.data?.script || '');
    }
  }, [node]);

  useEffect(() => {
    if (node?.data?.type === NODE_TYPES.FORM) {
      loadForms();
    }
  }, [node]);

  const loadForms = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/forms`);
      const data = await response.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error('Failed to load forms:', error);
    }
  };

  if (!node) return null;

  const config = NODE_CONFIGS[node.data.type];

  const handleSave = () => {
    const updatedData = {
      ...node.data,
      label,
      description
    };

    // Decision node
    if (node.data.type === NODE_TYPES.DECISION) {
      updatedData.condition = condition;
    }

    // Task node
    if (node.data.type === NODE_TYPES.TASK) {
      updatedData.assignedTo = assignedTo;
      updatedData.priority = priority;
    }

    // Approval node
    if (node.data.type === NODE_TYPES.APPROVAL) {
      updatedData.approvers = approvers.split(',').map(a => a.trim()).filter(a => a);
      updatedData.approvalType = approvalType;
    }

    // Form node
    if (node.data.type === NODE_TYPES.FORM) {
      updatedData.formId = formId;
    }

    // Action node
    if (node.data.type === 'action') {
      updatedData.actionType = actionType;
      updatedData.url = url;
      updatedData.method = method;
      try {
        updatedData.headers = JSON.parse(headers);
        updatedData.body = JSON.parse(body);
      } catch (e) {
        alert('Invalid JSON in headers or body');
        return;
      }
      updatedData.authType = authType;
      updatedData.token = token;
      updatedData.script = script;
    }

    onUpdate(node.id, {
      data: updatedData
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className={`${config.color} ${config.borderColor} border-b-2 p-4 text-white`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Edit {config.label} Node</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            data-testid="node-editor-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Label *
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter node label"
            data-testid="node-editor-label"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter node description"
            data-testid="node-editor-description"
          />
        </div>

        {/* Decision Node - Condition */}
        {node.data.type === NODE_TYPES.DECISION && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Condition
            </label>
            <ExpressionEditor
              value={condition}
              onChange={setCondition}
              variables={{}}
            />
          </div>
        )}

        {/* Task Node - Assignment */}
        {node.data.type === NODE_TYPES.TASK && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assigned To
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="user@example.com"
                data-testid="task-assigned-to"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="task-priority"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </>
        )}

        {/* Approval Node */}
        {node.data.type === NODE_TYPES.APPROVAL && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Approvers (comma-separated)
              </label>
              <input
                type="text"
                value={approvers}
                onChange={(e) => setApprovers(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="user1@example.com, user2@example.com"
                data-testid="approval-approvers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Approval Type
              </label>
              <select
                value={approvalType}
                onChange={(e) => setApprovalType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="approval-type"
              >
                <option value="single">Single Approver</option>
                <option value="sequential">Sequential</option>
                <option value="parallel">Parallel</option>
                <option value="unanimous">Unanimous</option>
                <option value="majority">Majority</option>
              </select>
            </div>
          </>
        )}

        {/* Form Node */}
        {node.data.type === NODE_TYPES.FORM && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Form
            </label>
            <select
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              data-testid="form-select"
            >
              <option value="">-- Select a form --</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Node */}
        {node.data.type === 'action' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Action Type
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="action-type"
              >
                <option value="http">HTTP Request</option>
                <option value="webhook">Webhook</option>
                <option value="script">Script</option>
              </select>
            </div>

            {(actionType === 'http' || actionType === 'webhook') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                    placeholder="https://api.example.com/endpoint"
                    data-testid="action-url"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Method
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    data-testid="action-method"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Headers (JSON)
                  </label>
                  <textarea
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-xs"
                    placeholder='{"Content-Type": "application/json"}'
                    data-testid="action-headers"
                  />
                </div>

                {method !== 'GET' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Body (JSON)
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-xs"
                      placeholder='{"key": "value"}'
                      data-testid="action-body"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Authentication
                  </label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    data-testid="action-auth-type"
                  >
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </div>

                {authType === 'bearer' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Bearer Token
                    </label>
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-xs"
                      placeholder="your-token-here"
                      data-testid="action-token"
                    />
                  </div>
                )}
              </>
            )}

            {actionType === 'script' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Script
                </label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-xs"
                  placeholder="// Your script here\nconsole.log('Hello World');"
                  data-testid="action-script"
                />
              </div>
            )}
          </>
        )}

        {/* Node ID */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Node ID
          </label>
          <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded">
            {node.id}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            data-testid="node-editor-save"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            data-testid="node-editor-delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
