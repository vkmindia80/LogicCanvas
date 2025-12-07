import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, CheckCircle, Zap } from 'lucide-react';
import { NODE_TYPES, createNodeData } from '../utils/nodeTypes';

// High-level wizard steps (order matters)
const WIZARD_STEPS = [
  { id: 'basics', title: 'Workflow basics', description: 'Name and describe your workflow' },
  { id: 'purpose', title: 'What type of workflow?', description: 'Choose the primary purpose' },
  { id: 'complexity', title: 'How complex should it be?', description: 'Select overall complexity' },
  { id: 'features', title: 'What features do you need?', description: 'Select all that apply' },
  { id: 'trigger', title: 'How should it start?', description: 'Choose trigger type' },
  { id: 'assignment', title: 'Who works on it?', description: 'Configure default assignment strategy' },
  { id: 'sla', title: 'Deadlines & SLAs', description: 'Define due times for tasks' },
  { id: 'notifications', title: 'Notifications', description: 'Who should be notified and when?' },
  { id: 'review', title: 'Review & create', description: 'Confirm configuration before creation' },
];

// Options for early steps
const PURPOSE_OPTIONS = [
  { value: 'approval', label: 'Approval Process', description: 'Get structured approvals and sign-offs.' },
  { value: 'automation', label: 'Automation', description: 'Automate tasks and API calls.' },
  { value: 'data_collection', label: 'Data Collection', description: 'Collect and route information via forms.' },
  { value: 'notification', label: 'Notifications', description: 'Send alerts, reminders, and updates.' },
];

const COMPLEXITY_OPTIONS = [
  { value: 'simple', label: 'Simple', description: '2–4 steps, single happy path.' },
  { value: 'moderate', label: 'Moderate', description: '5–8 steps, some branching.' },
  { value: 'complex', label: 'Complex', description: '9+ steps, multiple branches & conditions.' },
];

const FEATURE_OPTIONS = [
  { value: 'approvals', label: 'Approvals', description: 'Multi-level approvals and decisions.' },
  { value: 'forms', label: 'Forms', description: 'Collect structured data from users.' },
  { value: 'tasks', label: 'Tasks', description: 'Assign work items with SLAs.' },
  { value: 'decisions', label: 'Decisions', description: 'Conditional branching & routing.' },
  { value: 'actions', label: 'Actions / API Calls', description: 'HTTP calls, webhooks, scripts.' },
  { value: 'parallel', label: 'Parallel Execution', description: 'Run steps in parallel.' },
];

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual', description: 'Users start the workflow from the UI.' },
  { value: 'scheduled', label: 'Scheduled (Cron)', description: 'Runs automatically on a schedule.' },
  { value: 'webhook', label: 'Webhook/API', description: 'External systems trigger via API call.' },
];

const CATEGORY_OPTIONS = [
  'Human Resources',
  'Finance',
  'Procurement',
  'Legal',
  'IT & Support',
  'Custom',
];

// Build a starter workflow that respects wizard answers
const buildWorkflowFromAnswers = (answers) => {
  const {
    basics,
    purpose,
    complexity,
    features = [],
    trigger,
    assignment,
    sla,
    notifications,
  } = answers;

  const nodes = [];
  const edges = [];

  // Helper to add node and track edges
  const addNode = (id, type, x, y, dataOverrides = {}) => {
    const baseData = createNodeData(type, dataOverrides.label);
    const node = {
      id,
      type,
      position: { x, y },
      data: {
        ...baseData,
        ...dataOverrides,
      },
    };
    nodes.push(node);
    return node;
  };

  const addEdge = (id, source, target, extra = {}) => {
    edges.push({ id, source, target, ...extra });
  };

  // 1) Start node
  addNode('start-1', NODE_TYPES.START, 200, 80, { label: 'Start' });
  let lastNodeId = 'start-1';

  // 2) Optional intake form
  const wantsForm = purpose === 'data_collection' || features.includes('forms') || purpose === 'approval';
  if (wantsForm) {
    addNode('form-1', NODE_TYPES.FORM, 200, 220, {
      label: 'Request Form',
      description: 'Collect initial request details.',
      formId: '', // user can link a real form later
    });
    addEdge('e-start-form', lastNodeId, 'form-1');
    lastNodeId = 'form-1';
  }

  // 3) Primary task (review / processing)
  const defaultDue = Number.isFinite(Number(sla?.dueInHours)) && Number(sla?.dueInHours) > 0
    ? Number(sla.dueInHours)
    : 24;

  const isApprovalFlow = purpose === 'approval' || features.includes('approvals');

  addNode('task-1', NODE_TYPES.TASK, 200, 360, {
    label: isApprovalFlow ? 'Review & Prepare Approval' : 'Review Request',
    description: isApprovalFlow
      ? 'Review details and prepare for approval.'
      : 'Review and process the incoming request.',
    assignmentStrategy: assignment?.strategy || 'direct',
    assignmentRole: assignment?.strategy !== 'direct' ? assignment?.role || '' : undefined,
    assignedTo: assignment?.strategy === 'direct' ? assignment?.userEmail || '' : undefined,
    priority: 'medium',
    dueInHours: defaultDue,
  });
  addEdge('e-prev-task', lastNodeId, 'task-1');
  lastNodeId = 'task-1';

  // 4) Optional decision + approval path
  if (isApprovalFlow || features.includes('decisions')) {
    addNode('decision-1', NODE_TYPES.DECISION, 200, 520, {
      label: 'Needs Approval?',
      description: 'Route high-risk or high-value items to approvers.',
      condition: "${amount} > 1000",
    });
    addEdge('e-task-decision', lastNodeId, 'decision-1');

    addNode('approval-1', NODE_TYPES.APPROVAL, 200, 680, {
      label: 'Manager Approval',
      description: 'Manager reviews and approves or rejects.',
      approvers: [],
      approvalType: 'single',
    });

    addNode('end-approved', NODE_TYPES.END, 200, 840, {
      label: 'Approved',
    });

    addNode('end-rejected', NODE_TYPES.END, 460, 680, {
      label: 'Rejected',
    });

    // Decision branches
    addEdge('e-decision-yes', 'decision-1', 'approval-1', {
      sourceHandle: 'yes',
      label: 'Yes',
    });
    addEdge('e-decision-no', 'decision-1', 'end-rejected', {
      sourceHandle: 'no',
      label: 'No',
    });
    addEdge('e-approval-end', 'approval-1', 'end-approved');
  } else {
    // Simple end node
    addNode('end-1', NODE_TYPES.END, 200, 520, { label: 'Completed' });
    addEdge('e-task-end', lastNodeId, 'end-1');
  }

  // 5) Optionally include an Action node for API/automation flows
  const wantsAction = purpose === 'automation' || features.includes('actions');
  if (wantsAction) {
    addNode('action-1', NODE_TYPES.ACTION, 500, 360, {
      label: 'Call API / Webhook',
      description: 'Trigger an API call or webhook as part of the flow.',
      actionType: 'http',
      method: 'POST',
      url: 'https://api.example.com/endpoint',
      headers: { 'Content-Type': 'application/json' },
      body: { id: '${requestId}' },
      authType: 'none',
    });
    // Connect from main task in parallel
    addEdge('e-task-action', 'task-1', 'action-1');
  }

  // Build tags and config
  const tags = [];
  if (purpose) tags.push(purpose);
  if (complexity) tags.push(complexity);
  tags.push('wizard-generated');

  return {
    id: null,
    name: basics?.name || 'New Workflow',
    description: basics?.description || '',
    nodes,
    edges,
    status: 'draft',
    version: 1,
    tags,
    config: {
      category: basics?.category || 'Custom',
      trigger: trigger || { type: 'manual' },
      assignment: assignment || { strategy: 'direct' },
      sla: { dueInHours: defaultDue },
      notifications: notifications || {},
      purpose,
      complexity,
      features,
    },
  };
};

const QuickStartWizard = ({ isOpen, onClose, onCreate }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({
    basics: { name: '', description: '', category: 'Custom' },
    purpose: null,
    complexity: null,
    features: [],
    trigger: { type: 'manual', cron: '0 0 * * *', webhookPath: '' },
    assignment: { strategy: 'direct', role: '', userEmail: '' },
    sla: { dueInHours: 24 },
    notifications: {
      onTaskCreated: true,
      onTaskOverdue: true,
      onApprovalRequired: true,
    },
  });

  if (!isOpen) return null;

  const step = WIZARD_STEPS[currentStepIndex];
  const isLastStep = step.id === 'review';

  const goToNext = () => {
    if (isLastStep) {
      const workflow = buildWorkflowFromAnswers(answers);
      onCreate(workflow);
      handleClose();
    } else {
      setCurrentStepIndex((idx) => Math.min(idx + 1, WIZARD_STEPS.length - 1));
    }
  };

  const goToPrev = () => {
    setCurrentStepIndex((idx) => Math.max(idx - 1, 0));
  };

  const handleClose = () => {
    setCurrentStepIndex(0);
    setAnswers({
      basics: { name: '', description: '', category: 'Custom' },
      purpose: null,
      complexity: null,
      features: [],
      trigger: { type: 'manual', cron: '0 0 * * *', webhookPath: '' },
      assignment: { strategy: 'direct', role: '', userEmail: '' },
      sla: { dueInHours: 24 },
      notifications: {
        onTaskCreated: true,
        onTaskOverdue: true,
        onApprovalRequired: true,
      },
    });
    onClose();
  };

  // Selection handlers for choice steps
  const handleSelectPurpose = (value) => {
    setAnswers((prev) => ({ ...prev, purpose: value }));
  };

  const handleSelectComplexity = (value) => {
    setAnswers((prev) => ({ ...prev, complexity: value }));
  };

  const handleToggleFeature = (value) => {
    setAnswers((prev) => {
      const exists = prev.features.includes(value);
      const features = exists
        ? prev.features.filter((f) => f !== value)
        : [...prev.features, value];
      return { ...prev, features };
    });
  };

  // Validation per step
  const canProceed = () => {
    switch (step.id) {
      case 'basics':
        return Boolean(answers.basics.name?.trim());
      case 'purpose':
        return Boolean(answers.purpose);
      case 'complexity':
        return Boolean(answers.complexity);
      case 'features':
        return answers.features.length > 0;
      case 'sla': {
        const v = Number(answers.sla.dueInHours);
        return Number.isFinite(v) && v > 0;
      }
      // Other steps are optional configuration – always allowed to proceed
      default:
        return true;
    }
  };

  // Step-specific content renderers
  const renderChoiceCards = (options, selectedValues, multi = false) => (
    <div className="space-y-3">
      {options.map((opt) => {
        const isSelected = multi
          ? selectedValues.includes(opt.value)
          : selectedValues === opt.value;

        return (
          <button
            key={opt.value}
            onClick={() => {
              if (multi) {
                handleToggleFeature(opt.value);
              } else if (step.id === 'purpose') {
                handleSelectPurpose(opt.value);
              } else if (step.id === 'complexity') {
                handleSelectComplexity(opt.value);
              }
            }}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/20'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
            }`}
            data-testid={`option-${opt.value}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-slate-900 mb-1">{opt.label}</div>
                <div className="text-sm text-slate-600">{opt.description}</div>
              </div>
              {isSelected && (
                <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 ml-3" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderStepContent = () => {
    switch (step.id) {
      case 'basics': {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Workflow name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={answers.basics.name}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    basics: { ...prev.basics, name: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                placeholder="Invoice approval, HR onboarding, IT ticketing…"
                data-testid="wizard-basics-name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={answers.basics.description}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    basics: { ...prev.basics, description: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 resize-none"
                placeholder="Short description to help others understand this workflow."
                data-testid="wizard-basics-description"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Category
              </label>
              <select
                value={answers.basics.category}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    basics: { ...prev.basics, category: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                data-testid="wizard-basics-category"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      }

      case 'purpose':
        return renderChoiceCards(PURPOSE_OPTIONS, answers.purpose, false);

      case 'complexity':
        return renderChoiceCards(COMPLEXITY_OPTIONS, answers.complexity, false);

      case 'features':
        return renderChoiceCards(FEATURE_OPTIONS, answers.features, true);

      case 'trigger': {
        return (
          <div className="space-y-4">
            {TRIGGER_TYPES.map((opt) => {
              const isSelected = answers.trigger.type === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      trigger: { ...prev.trigger, type: opt.value },
                    }))
                  }
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                  data-testid={`trigger-${opt.value}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 mb-1">{opt.label}</div>
                      <div className="text-sm text-slate-600">{opt.description}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 ml-3" />
                    )}
                  </div>
                </button>
              );
            })}

            {answers.trigger.type === 'scheduled' && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Cron expression
                </label>
                <input
                  type="text"
                  value={answers.trigger.cron}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      trigger: { ...prev.trigger, cron: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  placeholder="0 0 * * * (daily at midnight)"
                  data-testid="wizard-trigger-cron"
                />
                <p className="text-xs text-slate-500">Format: minute hour day month weekday.</p>
              </div>
            )}

            {answers.trigger.type === 'webhook' && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Webhook path
                </label>
                <input
                  type="text"
                  value={answers.trigger.webhookPath}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      trigger: { ...prev.trigger, webhookPath: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  placeholder="/api/hooks/my-workflow"
                  data-testid="wizard-trigger-webhook"
                />
                <p className="text-xs text-slate-500">
                  This will be used later with the Trigger configuration panel.
                </p>
              </div>
            )}
          </div>
        );
      }

      case 'assignment': {
        const { strategy, role, userEmail } = answers.assignment;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Default assignment strategy
              </label>
              <select
                value={strategy}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    assignment: { ...prev.assignment, strategy: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                data-testid="wizard-assignment-strategy"
              >
                <option value="direct">Direct assignment to a user</option>
                <option value="role">Role / Group based</option>
                <option value="round_robin">Round-robin within role</option>
                <option value="load_balanced">Load-balanced by workload</option>
              </select>
            </div>

            {strategy === 'direct' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Default assignee email
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      assignment: { ...prev.assignment, userEmail: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  placeholder="manager@example.com"
                  data-testid="wizard-assignment-email"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Default role / group name
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      assignment: { ...prev.assignment, role: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  placeholder="approver, manager, finance…"
                  data-testid="wizard-assignment-role"
                />
              </div>
            )}
          </div>
        );
      }

      case 'sla': {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Default task SLA (hours)
              </label>
              <input
                type="number"
                min="1"
                value={answers.sla.dueInHours}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    sla: { ...prev.sla, dueInHours: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                placeholder="24"
                data-testid="wizard-sla-hours"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used as the default "due in" time for tasks generated by this wizard.
              </p>
            </div>
          </div>
        );
      }

      case 'notifications': {
        const { onTaskCreated, onTaskOverdue, onApprovalRequired } = answers.notifications;
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                id="notif-task-created"
                type="checkbox"
                checked={onTaskCreated}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      onTaskCreated: e.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                data-testid="wizard-notif-task-created"
              />
              <label htmlFor="notif-task-created" className="text-sm text-slate-800">
                Notify assignees when new tasks are created
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                id="notif-task-overdue"
                type="checkbox"
                checked={onTaskOverdue}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      onTaskOverdue: e.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                data-testid="wizard-notif-task-overdue"
              />
              <label htmlFor="notif-task-overdue" className="text-sm text-slate-800">
                Alert owners when tasks are overdue
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                id="notif-approval-required"
                type="checkbox"
                checked={onApprovalRequired}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      onApprovalRequired: e.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                data-testid="wizard-notif-approval-required"
              />
              <label htmlFor="notif-approval-required" className="text-sm text-slate-800">
                Notify approvers when their approval is required
              </label>
            </div>
          </div>
        );
      }

      case 'review': {
        const { basics, purpose, complexity, features, trigger, assignment, sla, notifications } = answers;
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Overview</h4>
              <p className="text-sm text-slate-700">
                We will create a workflow called <span className="font-semibold">{basics.name || 'New Workflow'}</span>
                {' '}with a {complexity || 'simple'} {purpose || 'approval/automation'} pattern, preconfigured
                tasks, decisions, and nodes so you can start tailoring immediately.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Basics</h4>
                <ul className="space-y-1 text-slate-700">
                  <li><span className="font-medium">Name:</span> {basics.name || 'New Workflow'}</li>
                  <li><span className="font-medium">Category:</span> {basics.category}</li>
                  {basics.description && (
                    <li><span className="font-medium">Description:</span> {basics.description}</li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Structure</h4>
                <ul className="space-y-1 text-slate-700">
                  <li><span className="font-medium">Purpose:</span> {purpose || 'Not specified'}</li>
                  <li><span className="font-medium">Complexity:</span> {complexity || 'simple'}</li>
                  <li>
                    <span className="font-medium">Features:</span>{' '}
                    {features.length > 0 ? features.join(', ') : 'None selected'}
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Execution</h4>
                <ul className="space-y-1 text-slate-700">
                  <li><span className="font-medium">Trigger:</span> {trigger.type}</li>
                  {trigger.type === 'scheduled' && (
                    <li><span className="font-medium">Cron:</span> {trigger.cron}</li>
                  )}
                  {trigger.type === 'webhook' && (
                    <li><span className="font-medium">Webhook path:</span> {trigger.webhookPath || '(later in Trigger config)'}
                    </li>
                  )}
                  <li>
                    <span className="font-medium">Assignment:</span>{' '}
                    {assignment.strategy}
                    {assignment.strategy === 'direct' && assignment.userEmail && ` → ${assignment.userEmail}`}
                    {assignment.strategy !== 'direct' && assignment.role && ` → ${assignment.role}`}
                  </li>
                  <li><span className="font-medium">Default SLA:</span> {sla.dueInHours} hours</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Notifications</h4>
                <ul className="space-y-1 text-slate-700">
                  <li>Task created: {notifications.onTaskCreated ? 'Enabled' : 'Disabled'}</li>
                  <li>Task overdue: {notifications.onTaskOverdue ? 'Enabled' : 'Disabled'}</li>
                  <li>Approval required: {notifications.onApprovalRequired ? 'Enabled' : 'Disabled'}</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="text-sm text-emerald-800">
                <p className="font-semibold mb-1">AI-inspired starter structure</p>
                <p>
                  The wizard will generate a best-practice structure with Start, Form (optional), Task, Decision,
                  Approval, and End nodes so you can focus on refining details instead of wiring everything from
                  scratch.
                </p>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const canGoNext = canProceed();

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full" 
        data-testid="quick-start-wizard"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Quick Start Wizard</h2>
                <p className="text-primary-100 text-sm">Create a workflow in a few guided steps</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              data-testid="close-wizard"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            {WIZARD_STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                    idx < currentStepIndex
                      ? 'bg-primary-500 text-white'
                      : idx === currentStepIndex
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {idx < currentStepIndex ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      idx < currentStepIndex ? 'bg-primary-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-slate-600 text-center">
            Step {currentStepIndex + 1} of {WIZARD_STEPS.length}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{step.title}</h3>
            <p className="text-slate-600">{step.description}</p>
          </div>

          {renderStepContent()}

          {/* AI Suggestion Hint */}
          {canGoNext && step.id !== 'review' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-gold-50 to-pink-50 border border-gold-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-gold-900 mb-1">AI Suggestion</div>
                  <div className="text-sm text-gold-700">
                    Based on your selections, we&apos;ll generate an optimized starter workflow structure you can
                    refine in the canvas.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {currentStepIndex > 0 && (
            <button
              onClick={goToPrev}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              data-testid="wizard-back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}
          <button
            onClick={goToNext}
            disabled={!canGoNext}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              canGoNext
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl hover:shadow-primary-500/40'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            data-testid="wizard-next"
          >
            <span>{isLastStep ? 'Create Workflow' : 'Next'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickStartWizard;
