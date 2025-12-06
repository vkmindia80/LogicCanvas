import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Copy, ChevronDown, ChevronUp, Info, Link } from 'lucide-react';
import { NODE_CONFIGS, NODE_TYPES } from '../utils/nodeTypes';
import ExpressionEditor from './ExpressionEditor';
import DataMappingPanel from './DataMappingPanel';
import KeyValueEditor from './KeyValueEditor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const NodeEditor = ({ node, onUpdate, onDelete, onDuplicate, onClose }) => {
  const [label, setLabel] = useState(node?.data?.label || '');
  const [description, setDescription] = useState(node?.data?.description || '');
  const [condition, setCondition] = useState(node?.data?.condition || '');
  const [assignedTo, setAssignedTo] = useState(node?.data?.assignedTo || '');
  const [assignmentStrategy, setAssignmentStrategy] = useState(node?.data?.assignmentStrategy || 'direct');
  const [assignmentRole, setAssignmentRole] = useState(node?.data?.assignmentRole || '');
  const [priority, setPriority] = useState(node?.data?.priority || 'medium');
  const [dueInHours, setDueInHours] = useState(node?.data?.dueInHours || 24);
  const [approvers, setApprovers] = useState(node?.data?.approvers?.join(', ') || '');
  const [approvalType, setApprovalType] = useState(node?.data?.approvalType || 'single');
  const [formId, setFormId] = useState(node?.data?.formId || '');
  const [forms, setForms] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Action node states
  const [actionType, setActionType] = useState(node?.data?.actionType || 'http');
  const [url, setUrl] = useState(node?.data?.url || '');
  const [method, setMethod] = useState(node?.data?.method || 'GET');
  const [headers, setHeaders] = useState(node?.data?.headers || {});
  const [body, setBody] = useState(node?.data?.body || {});
  const [authType, setAuthType] = useState(node?.data?.authType || 'none');
  const [token, setToken] = useState(node?.data?.token || '');
  const [script, setScript] = useState(node?.data?.script || '');
  
  // Timer node states
  const [timerType, setTimerType] = useState(node?.data?.timerType || 'delay');
  const [delaySeconds, setDelaySeconds] = useState(node?.data?.delaySeconds || 0);
  const [delayMinutes, setDelayMinutes] = useState(node?.data?.delayMinutes || 0);
  const [delayHours, setDelayHours] = useState(node?.data?.delayHours || 0);
  const [scheduledTime, setScheduledTime] = useState(node?.data?.scheduledTime || '');
  const [timeoutHours, setTimeoutHours] = useState(node?.data?.timeoutHours || 24);
  
  // Subprocess node states
  const [subprocessWorkflowId, setSubprocessWorkflowId] = useState(node?.data?.subprocessWorkflowId || '');
  const [inputMapping, setInputMapping] = useState(node?.data?.inputMapping || {});
  const [outputMapping, setOutputMapping] = useState(node?.data?.outputMapping || {});
  const [workflows, setWorkflows] = useState([]);
  
  // Event node states
  const [eventType, setEventType] = useState(node?.data?.eventType || 'message');
  const [eventAction, setEventAction] = useState(node?.data?.eventAction || 'send');
  const [eventName, setEventName] = useState(node?.data?.eventName || '');
  const [eventPayload, setEventPayload] = useState(node?.data?.eventPayload || {});
  
  // Collapsible sections state
  const [sectionsExpanded, setSectionsExpanded] = useState({
    basic: true,
    advanced: false,
    validation: false,
    dataMapping: false,
  });

  // Workflow variables for data mapping
  const [workflowVariables, setWorkflowVariables] = useState([]);

  useEffect(() => {
    if (node) {
      setLabel(node.data?.label || '');
      setDescription(node.data?.description || '');
      setCondition(node.data?.condition || '');
      setAssignedTo(node.data?.assignedTo || '');
      setAssignmentStrategy(node.data?.assignmentStrategy || 'direct');
      setAssignmentRole(node.data?.assignmentRole || '');
      setPriority(node.data?.priority || 'medium');
      setDueInHours(node.data?.dueInHours || 24);
      setApprovers(node.data?.approvers?.join(', ') || '');
      setApprovalType(node.data?.approvalType || 'single');
      setFormId(node.data?.formId || '');
      setActionType(node.data?.actionType || 'http');
      setUrl(node.data?.url || '');
      setMethod(node.data?.method || 'GET');
      setHeaders(node.data?.headers || {});
      setBody(node.data?.body || {});
      setAuthType(node.data?.authType || 'none');
      setToken(node.data?.token || '');
      setScript(node.data?.script || '');
      
      setTimerType(node.data?.timerType || 'delay');
      setDelaySeconds(node.data?.delaySeconds || 0);
      setDelayMinutes(node.data?.delayMinutes || 0);
      setDelayHours(node.data?.delayHours || 0);
      setScheduledTime(node.data?.scheduledTime || '');
      setTimeoutHours(node.data?.timeoutHours || 24);
      
      setSubprocessWorkflowId(node.data?.subprocessWorkflowId || '');
      setInputMapping(node.data?.inputMapping || {});
      setOutputMapping(node.data?.outputMapping || {});
      
      setEventType(node.data?.eventType || 'message');
      setEventAction(node.data?.eventAction || 'send');
      setEventName(node.data?.eventName || '');
      setEventPayload(node.data?.eventPayload || {});
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

  const loadRolesAndUsers = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/roles`),
        fetch(`${BACKEND_URL}/api/users`)
      ]);
      const rolesData = await rolesRes.json();
      const usersData = await usersRes.json();
      setRoles(rolesData.roles || []);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Failed to load roles/users:', error);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows`);
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  useEffect(() => {
    // Use resolved type for consistency
    const currentType = node?.data?.type || node?.type;
    
    if (currentType === NODE_TYPES.FORM) {
      loadForms();
    }
    if (currentType === NODE_TYPES.TASK) {
      loadRolesAndUsers();
    }
    if (currentType === NODE_TYPES.SUBPROCESS) {
      loadWorkflows();
    }
  }, [node]);

  if (!node) return null;

  // ============ CRITICAL FIX: Robust Type Resolution ============
  // Ensure we always have a valid node type, with multiple fallback strategies
  const nodeType = node.data?.type || node.type;
  
  // Debug logging for troubleshooting
  console.log('🔍 NodeEditor - Type Resolution:', {
    'node.data?.type': node.data?.type,
    'node.type': node.type,
    'resolved nodeType': nodeType,
    'node object': node
  });

  const config = NODE_CONFIGS[nodeType];
  
  // If config is not found after fallback, show detailed error
  if (!config) {
    console.error('❌ NodeEditor - Unknown node type:', {
      'attempted type': nodeType,
      'node.data.type': node.data?.type,
      'node.type': node.type,
      'available types': Object.keys(NODE_CONFIGS)
    });
    
    return (
      <div className="bg-white rounded-xl shadow-2xl border-2 border-red-500 overflow-hidden animate-slide-in">
        <div className="p-5 bg-red-50">
          <div className="flex items-center space-x-3 text-red-700">
            <Info className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg">⚠️ Configuration Error</h3>
              <p className="text-sm mt-1 font-medium">Cannot edit node: Type configuration not found</p>
              <div className="mt-3 text-xs space-y-1 bg-white p-3 rounded border border-red-200">
                <p><strong>Attempted Type:</strong> {nodeType || 'undefined'}</p>
                <p><strong>Node Data Type:</strong> {node.data?.type || 'not set'}</p>
                <p><strong>Node Root Type:</strong> {node.type || 'not set'}</p>
                <p className="mt-2"><strong>Available Types:</strong></p>
                <p className="text-slate-600 ml-2">{Object.keys(NODE_CONFIGS).join(', ')}</p>
              </div>
              <p className="text-xs mt-3 text-amber-700">💡 This node may need to be recreated from the palette.</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-2">
          <button
            onClick={() => {
              console.log('Full node object for debugging:', JSON.stringify(node, null, 2));
              alert('Check browser console for full node details');
            }}
            className="w-full bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 transition-all font-medium text-sm"
          >
            🐛 Show Debug Info
          </button>
          <button
            onClick={onClose}
            className="w-full bg-red-500 text-white px-5 py-3 rounded-lg hover:bg-red-600 transition-all font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  // ============ END CRITICAL FIX ============
  
  // Use resolved nodeType throughout component for consistency
  const resolvedNodeType = nodeType;
  
  const toggleSection = (section) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const CollapsibleSection = ({ title, id, children, icon: Icon }) => (
    <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all"
      >
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-slate-600" />}
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
        {sectionsExpanded[id] ? (
          <ChevronUp className="w-4 h-4 text-slate-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600" />
        )}
      </button>
      {sectionsExpanded[id] && (
        <div className="p-4 space-y-4 collapsible-enter">
          {children}
        </div>
      )}
    </div>
  );

  const handleSave = () => {
    const updatedData = {
      ...node.data,
      label,
      description
    };

    // Use resolved nodeType for consistency
    const currentNodeType = node.data?.type || node.type;
    
    // Decision node
    if (currentNodeType === NODE_TYPES.DECISION) {
      updatedData.condition = condition;
    }

    // Task node
    if (currentNodeType === NODE_TYPES.TASK) {
      updatedData.assignedTo = assignedTo;
      updatedData.assignmentStrategy = assignmentStrategy;
      updatedData.assignmentRole = assignmentRole;
      updatedData.priority = priority;
      updatedData.dueInHours = parseInt(dueInHours) || 24;
    }

    // Approval node
    if (currentNodeType === NODE_TYPES.APPROVAL) {
      updatedData.approvers = approvers.split(',').map(a => a.trim()).filter(a => a);
      updatedData.approvalType = approvalType;
    }

    // Form node
    if (currentNodeType === NODE_TYPES.FORM) {
      updatedData.formId = formId;
    }

    // Action node
    if (currentNodeType === 'action' || currentNodeType === NODE_TYPES.ACTION) {
      updatedData.actionType = actionType;
      updatedData.url = url;
      updatedData.method = method;
      updatedData.headers = headers;
      updatedData.body = body;
      updatedData.authType = authType;
      updatedData.token = token;
      updatedData.script = script;
    }

    // Timer node
    if (currentNodeType === NODE_TYPES.TIMER) {
      updatedData.timerType = timerType;
      updatedData.delaySeconds = parseInt(delaySeconds) || 0;
      updatedData.delayMinutes = parseInt(delayMinutes) || 0;
      updatedData.delayHours = parseInt(delayHours) || 0;
      updatedData.scheduledTime = scheduledTime;
      updatedData.timeoutHours = parseInt(timeoutHours) || 24;
    }

    // Subprocess node
    if (currentNodeType === NODE_TYPES.SUBPROCESS) {
      updatedData.subprocessWorkflowId = subprocessWorkflowId;
      updatedData.inputMapping = inputMapping;
      updatedData.outputMapping = outputMapping;
    }

    // Event node
    if (currentNodeType === NODE_TYPES.EVENT) {
      updatedData.eventType = eventType;
      updatedData.eventAction = eventAction;
      updatedData.eventName = eventName;
      updatedData.eventPayload = eventPayload;
      updatedData.timeoutHours = parseInt(timeoutHours) || 24;
    }
    
    // CRITICAL: Ensure type is always set in data
    updatedData.type = currentNodeType;

    onUpdate(node.id, {
      data: updatedData
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border-2 border-slate-300 overflow-hidden animate-slide-in">
      {/* Enhanced Header with Gradient */}
      <div 
        className="p-5 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${config.color.replace('bg-', '#')} 0%, ${config.color.replace('bg-', '#')} 100%)`
        }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="font-bold text-lg drop-shadow-md">Edit {config.label} Node</h3>
            <p className="text-xs opacity-90 mt-1">Configure node properties and behavior</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all hover:scale-110"
            data-testid="node-editor-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content with improved spacing */}
      <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
        {/* Basic Information Section */}
        <div className="bg-white border-2 border-slate-200 rounded-lg p-4 space-y-4 shadow-sm">
          <h3 className="section-header font-bold text-slate-900 text-sm mb-3">Basic Information</h3>
          
          {/* Label */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all shadow-sm hover:border-slate-300 ${
                !label ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
              placeholder="Enter node label"
              data-testid="node-editor-label"
            />
            {!label && (
              <div className="flex items-center space-x-1 text-xs text-red-600">
                <Info className="w-3 h-3" />
                <span>Label is required to identify this node</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Description <span className="text-slate-400 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all shadow-sm hover:border-slate-300 resize-none"
              placeholder="Example: This step reviews the invoice and checks if approval is needed..."
              data-testid="node-editor-description"
            />
            <p className="text-xs text-slate-500 flex items-center space-x-1">
              <Info className="w-3 h-3" />
              <span>Add context to help team members understand what this step does</span>
            </p>
          </div>
        </div>

        {/* Decision Node - Condition */}
        {resolvedNodeType === NODE_TYPES.DECISION && (
          <div className="bg-white border-2 border-amber-200 rounded-lg p-4 shadow-sm">
            <h3 className="section-header font-bold text-slate-900 text-sm mb-3">Decision Logic</h3>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Condition Expression <span className="text-red-500">*</span>
              </label>
              <ExpressionEditor
                value={condition}
                onChange={setCondition}
                variables={{}}
              />
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center space-x-1">
                  <Info className="w-3 h-3" />
                  <span>Examples:</span>
                </p>
                <ul className="text-xs text-blue-800 space-y-1 ml-4">
                  <li>• <code className="bg-blue-100 px-1 rounded">amount &gt; 1000</code> - Check if amount exceeds limit</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">status === "approved"</code> - Check exact status</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">priority === "high" && urgent === true</code> - Multiple conditions</li>
                </ul>
                <p className="text-xs text-blue-700 mt-2">
                  💡 Use variables from previous nodes in your condition
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task Node - Assignment */}
        {resolvedNodeType === NODE_TYPES.TASK && (
          <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm space-y-4">
            <h3 className="section-header font-bold text-slate-900 text-sm mb-3">Task Configuration</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800 flex items-start space-x-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Tasks create work items that users can complete from their inbox. Configure who should handle this task and set priority/SLA.</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assignment Strategy
              </label>
              <select
                value={assignmentStrategy}
                onChange={(e) => setAssignmentStrategy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="task-assignment-strategy"
              >
                <option value="direct">Direct Assignment</option>
                <option value="role">Role/Group Based</option>
                <option value="round_robin">Round Robin</option>
                <option value="load_balanced">Load Balanced</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {assignmentStrategy === 'direct' && '👤 Assign to a specific user by email'}
                {assignmentStrategy === 'role' && '👥 Assign to first available user in a role'}
                {assignmentStrategy === 'round_robin' && '🔄 Rotate assignments evenly among role members'}
                {assignmentStrategy === 'load_balanced' && '⚖️ Assign to user with lowest current workload'}
              </p>
            </div>
            
            {assignmentStrategy === 'direct' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assign To
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  data-testid="task-assigned-to"
                >
                  <option value="">-- Select User --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.email}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">Or enter email manually:</p>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Role
                </label>
                <select
                  value={assignmentRole}
                  onChange={(e) => setAssignmentRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  data-testid="task-assignment-role"
                >
                  <option value="">-- Select Role --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name} ({role.members?.length || 0} members)
                    </option>
                  ))}
                </select>
              </div>
            )}

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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SLA - Due In (hours)
              </label>
              <input
                type="number"
                value={dueInHours}
                onChange={(e) => setDueInHours(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="24"
                data-testid="task-due-hours"
              />
              <p className="mt-1 text-xs text-slate-500 flex items-center space-x-1">
                <Info className="w-3 h-3" />
                <span>Task will be auto-escalated if not completed within this time</span>
              </p>
            </div>
          </div>
        )}

        {/* Approval Node */}
        {resolvedNodeType === NODE_TYPES.APPROVAL && (
          <div className="bg-white border-2 border-purple-200 rounded-lg p-4 shadow-sm space-y-4">
            <h3 className="section-header font-bold text-slate-900 text-sm mb-3">Approval Configuration</h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-purple-800 flex items-start space-x-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Approval nodes require one or more people to review and approve/reject before workflow continues.</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Approvers (comma-separated) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={approvers}
                onChange={(e) => setApprovers(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="manager@example.com, director@example.com"
                data-testid="approval-approvers"
              />
              <p className="mt-1 text-xs text-slate-500">
                💡 Tip: Enter email addresses separated by commas
              </p>
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
                <option value="single">Single Approver (any one can approve)</option>
                <option value="sequential">Sequential (approve in order)</option>
                <option value="parallel">Parallel (all approve at once)</option>
                <option value="unanimous">Unanimous (all must approve)</option>
                <option value="majority">Majority (more than 50% must approve)</option>
              </select>
              <div className="mt-2 bg-slate-50 rounded p-2">
                <p className="text-xs text-slate-600">
                  {approvalType === 'single' && '✅ First person to respond determines outcome'}
                  {approvalType === 'sequential' && '📋 Each person must approve before next person can review'}
                  {approvalType === 'parallel' && '⚡ Everyone reviews at the same time'}
                  {approvalType === 'unanimous' && '👥 All approvers must approve (any rejection stops workflow)'}
                  {approvalType === 'majority' && '🗳️ More than half of approvers must approve'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Node */}
        {resolvedNodeType === NODE_TYPES.FORM && (
          <div className="bg-white border-2 border-indigo-200 rounded-lg p-4 shadow-sm">
            <h3 className="section-header font-bold text-slate-900 text-sm mb-3">Form Selection</h3>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-indigo-800 flex items-start space-x-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Form nodes collect information from users. The workflow pauses here until the form is submitted.</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Form <span className="text-red-500">*</span>
              </label>
              <select
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                data-testid="form-select"
              >
                <option value="">-- Select a form --</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
              {!formId && (
                <p className="mt-2 text-xs text-amber-700 flex items-center space-x-1 bg-amber-50 p-2 rounded">
                  <Info className="w-3 h-3" />
                  <span>Don't see your form? Create one in the Forms tab first</span>
                </p>
              )}
              {formId && (
                <p className="mt-2 text-xs text-green-700 flex items-center space-x-1 bg-green-50 p-2 rounded">
                  ✅ <span>Form data will be available to subsequent nodes as variables</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Node */}
        {resolvedNodeType === 'action' && (
          <div className="bg-white border-2 border-pink-200 rounded-lg p-4 shadow-sm space-y-4">
            <h3 className="section-header font-bold text-slate-900 text-sm mb-3">Action Configuration</h3>
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-pink-800 flex items-start space-x-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Action nodes integrate with external systems via API calls, webhooks, or custom scripts.</span>
              </p>
            </div>
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
                <option value="http">🌐 HTTP Request (REST API)</option>
                <option value="webhook">🔗 Webhook (Send notification)</option>
                <option value="script">⚙️ Script (Custom JavaScript)</option>
              </select>
            </div>

            {(actionType === 'http' || actionType === 'webhook') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                    placeholder="https://api.example.com/v1/users"
                    data-testid="action-url"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    💡 Tip: Use variables like <code className="bg-slate-100 px-1 rounded">{'{{userId}}'}</code> in your URL
                  </p>
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

                <KeyValueEditor
                  value={headers}
                  onChange={setHeaders}
                  label="Request Headers"
                  keyPlaceholder="Header name (e.g., Content-Type)"
                  valuePlaceholder="Header value (e.g., application/json)"
                  allowJSON={true}
                  testId="action-headers"
                />

                {method !== 'GET' && (
                  <KeyValueEditor
                    value={body}
                    onChange={setBody}
                    label="Request Body"
                    keyPlaceholder="Field name"
                    valuePlaceholder="Field value (use ${variable} for dynamic)"
                    allowJSON={true}
                    testId="action-body"
                  />
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
                <p className="mt-1 text-xs text-slate-500 flex items-center space-x-1">
                  <Info className="w-3 h-3" />
                  <span>JavaScript code to execute</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timer Node */}
        {resolvedNodeType === NODE_TYPES.TIMER && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Timer Type
              </label>
              <select
                value={timerType}
                onChange={(e) => setTimerType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="timer-type"
              >
                <option value="delay">Delay</option>
                <option value="scheduled">Scheduled</option>
                <option value="timeout">Timeout</option>
              </select>
            </div>

            {timerType === 'delay' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    value={delayHours}
                    onChange={(e) => setDelayHours(e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                    data-testid="timer-delay-hours"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(e.target.value)}
                    min="0"
                    max="59"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                    data-testid="timer-delay-minutes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Seconds
                  </label>
                  <input
                    type="number"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(e.target.value)}
                    min="0"
                    max="59"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                    data-testid="timer-delay-seconds"
                  />
                </div>
              </div>
            )}

            {timerType === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  data-testid="timer-scheduled-time"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Or use cron expression for recurring schedules
                </p>
              </div>
            )}

            {timerType === 'timeout' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Timeout (hours)
                </label>
                <input
                  type="number"
                  value={timeoutHours}
                  onChange={(e) => setTimeoutHours(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="24"
                  data-testid="timer-timeout-hours"
                />
                <p className="mt-1 text-xs text-slate-500">
                  SLA timeout for tracking purposes
                </p>
              </div>
            )}
          </>
        )}

        {/* Subprocess Node */}
        {resolvedNodeType === NODE_TYPES.SUBPROCESS && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Subprocess Workflow
              </label>
              <select
                value={subprocessWorkflowId}
                onChange={(e) => setSubprocessWorkflowId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="subprocess-workflow-id"
              >
                <option value="">-- Select a workflow --</option>
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                This workflow will be executed as a subprocess
              </p>
            </div>

            <KeyValueEditor
              value={inputMapping}
              onChange={setInputMapping}
              label="Input Mapping"
              keyPlaceholder="Subprocess variable"
              valuePlaceholder="Parent variable (use ${variable})"
              allowJSON={true}
              testId="subprocess-input-mapping"
            />

            <KeyValueEditor
              value={outputMapping}
              onChange={setOutputMapping}
              label="Output Mapping"
              keyPlaceholder="Parent variable"
              valuePlaceholder="Subprocess output variable"
              allowJSON={true}
              testId="subprocess-output-mapping"
            />
          </>
        )}

        {/* Event Node */}
        {resolvedNodeType === NODE_TYPES.EVENT && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="event-type"
              >
                <option value="message">Message</option>
                <option value="signal">Signal</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Event Action
              </label>
              <select
                value={eventAction}
                onChange={(e) => setEventAction(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="event-action"
              >
                <option value="send">Send/Throw</option>
                <option value="receive">Receive/Catch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="event.name"
                data-testid="event-name"
              />
              <p className="mt-1 text-xs text-slate-500">
                Unique identifier for this event
              </p>
            </div>

            {(eventAction === 'send' || eventAction === 'throw') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Event Payload (JSON)
                </label>
                <textarea
                  value={eventPayload}
                  onChange={(e) => setEventPayload(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-xs"
                  placeholder='{"key": "value"}'
                  data-testid="event-payload"
                />
              </div>
            )}

            {(eventAction === 'receive' || eventAction === 'catch') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Timeout (hours)
                </label>
                <input
                  type="number"
                  value={timeoutHours}
                  onChange={(e) => setTimeoutHours(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="24"
                  data-testid="event-timeout-hours"
                />
                <p className="mt-1 text-xs text-slate-500">
                  How long to wait for the event before timing out
                </p>
              </div>
            )}
          </>
        )}

        {/* Data Mapping - Collapsible */}
        <CollapsibleSection title="Data Mapping" id="dataMapping" icon={Link}>
          <DataMappingPanel 
            node={node}
            workflowVariables={workflowVariables}
            onUpdate={onUpdate}
          />
        </CollapsibleSection>

        {/* Node Metadata - Collapsible */}
        <CollapsibleSection title="Node Metadata" id="metadata" icon={Info}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Node Type
              </label>
              <div className="px-4 py-2.5 bg-slate-100 rounded-lg border-2 border-slate-200 text-sm font-medium text-slate-700">
                {config.label}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Node ID
              </label>
              <div className="text-xs text-slate-600 font-mono bg-white p-3 rounded-lg border-2 border-slate-200 select-all">
                {node.id}
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center space-x-1">
                <Info className="w-3 h-3" />
                <span>Unique identifier used for referencing this node</span>
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Actions - Enhanced with tooltips */}
        <div className="flex space-x-3 pt-5 mt-5 border-t-2 border-slate-200">
          <button
            onClick={handleSave}
            disabled={!label}
            className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-5 py-3.5 rounded-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed toolbar-btn"
            data-testid="node-editor-save"
            title="Save node configuration"
          >
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </button>
          {onDuplicate && (
            <button
              onClick={() => {
                onDuplicate(node.id);
              }}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all font-semibold toolbar-btn"
              data-testid="node-editor-copy"
              title="Duplicate this node"
            >
              <Copy className="w-5 h-5" />
              <span className="hidden sm:inline">Copy</span>
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${label || 'this node'}"?`)) {
                onDelete(node.id);
              }
            }}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-3.5 rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold toolbar-btn"
            data-testid="node-editor-delete"
            title="Delete this node"
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
