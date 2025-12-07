/**
 * Enhanced Validation Messages
 * Phase 2: Business User Experience Enhancement
 * 
 * Provides plain English, user-friendly validation messages with actionable suggestions
 */

export const VALIDATION_MESSAGES = {
  // Workflow Structure
  NO_NODES: {
    type: 'error',
    message: '🎯 Your workflow needs at least one step to get started',
    suggestion: 'Drag a Start node from the palette on the left side of the canvas. This marks where your workflow begins.',
    priority: 'critical',
    category: 'structure'
  },

  NO_START_NODE: {
    type: 'error',
    message: '▶️ Every workflow needs a Start node to begin execution',
    suggestion: 'Add a Start node from the "Flow Components" section in the palette. This tells the system where to begin processing.',
    priority: 'critical',
    category: 'structure',
    quickFix: { action: 'addStartNode', label: '+ Add Start Node' }
  },

  MULTIPLE_START_NODES: {
    type: 'warning',
    message: '⚠️ Found multiple Start nodes - workflows typically have only one',
    suggestion: 'Having multiple start nodes can cause confusion. Consider removing extra Start nodes, or if you need multiple entry points, use different workflows.',
    priority: 'medium',
    category: 'structure'
  },

  NO_END_NODE: {
    type: 'warning',
    message: '🏁 Missing End node to properly complete your workflow',
    suggestion: 'Add at least one End node to mark where your workflow finishes. This helps track successful completions.',
    priority: 'medium',
    category: 'structure',
    quickFix: { action: 'addEndNode', label: '+ Add End Node' }
  },

  // Node Configuration
  NODE_NOT_CONFIGURED: {
    type: 'warning',
    message: '⚙️ This step needs configuration before it can run',
    suggestion: 'Click on the node to open its settings panel and fill in the required fields. Look for fields marked with a red asterisk (*).',
    priority: 'high',
    category: 'configuration',
    quickFix: { action: 'editNode', label: 'Configure Node' }
  },

  MISSING_LABEL: {
    type: 'warning',
    message: '📝 Give this step a clear name so others know what it does',
    suggestion: 'Use an action-oriented name like "Approve Request" or "Send Notification" instead of generic labels like "Task 1".',
    priority: 'high',
    category: 'configuration',
    quickFix: { action: 'editNode', label: 'Add Label' }
  },

  // Task Node
  TASK_NO_ASSIGNEE: {
    type: 'warning',
    message: '👤 Task needs someone to be responsible for it',
    suggestion: 'Assign this task to a specific person, a role (like "Manager"), or use a variable to assign dynamically based on workflow data.',
    priority: 'high',
    category: 'assignment',
    quickFix: { action: 'editNode', label: 'Assign Task' }
  },

  // Form Node
  FORM_NOT_SELECTED: {
    type: 'warning',
    message: '📋 Select a form to collect data from users',
    suggestion: 'Choose an existing form from the dropdown, or create a new form in the Forms section first.',
    priority: 'high',
    category: 'forms',
    quickFix: { action: 'editNode', label: 'Select Form' }
  },

  // Decision Node
  DECISION_NO_CONDITION: {
    type: 'warning',
    message: '🤔 Decision needs a condition to evaluate',
    suggestion: 'Define what should be checked (like "amount > 1000" or "status == approved") to determine which path to take.',
    priority: 'high',
    category: 'logic',
    quickFix: { action: 'editNode', label: 'Add Condition' }
  },

  DECISION_MISSING_YES_BRANCH: {
    type: 'warning',
    message: '✅ Decision is missing "Yes" path',
    suggestion: 'Connect the green "Yes" handle to another node to define what happens when the condition is true.',
    priority: 'high',
    category: 'connections'
  },

  DECISION_MISSING_NO_BRANCH: {
    type: 'warning',
    message: '❌ Decision is missing "No" path',
    suggestion: 'Connect the red "No" handle to another node to define what happens when the condition is false.',
    priority: 'high',
    category: 'connections'
  },

  // Approval Node
  APPROVAL_NO_APPROVERS: {
    type: 'warning',
    message: '✋ Approval needs at least one person to approve',
    suggestion: 'Add email addresses of approvers, separated by commas. Example: manager@company.com, director@company.com',
    priority: 'high',
    category: 'approvals',
    quickFix: { action: 'editNode', label: 'Add Approvers' }
  },

  // Action/API Node
  ACTION_NO_URL: {
    type: 'warning',
    message: '🔗 API call needs a URL endpoint',
    suggestion: 'Enter the API endpoint URL you want to call. You can include variables like: https://api.example.com/users/${user_id}',
    priority: 'high',
    category: 'integrations',
    quickFix: { action: 'editNode', label: 'Configure URL' }
  },

  // Subprocess Node
  SUBPROCESS_NOT_SELECTED: {
    type: 'warning',
    message: '🔄 Choose which workflow to run as a subprocess',
    suggestion: 'Select an existing workflow from the dropdown. The subprocess will run and return control to this workflow when complete.',
    priority: 'high',
    category: 'subprocesses',
    quickFix: { action: 'editNode', label: 'Select Subprocess' }
  },

  // Timer Node
  TIMER_NOT_CONFIGURED: {
    type: 'warning',
    message: '⏰ Timer needs a delay time or schedule',
    suggestion: 'Set how long to wait (hours, minutes, seconds) or schedule a specific date/time for the workflow to continue.',
    priority: 'high',
    category: 'timing',
    quickFix: { action: 'editNode', label: 'Configure Timer' }
  },

  // Connections
  NODE_NO_OUTGOING: {
    type: 'warning',
    message: '🔗 This step doesn\'t lead anywhere',
    suggestion: 'Connect this node to the next step in your workflow, or add an End node if this is where the workflow should finish.',
    priority: 'low',
    category: 'connections'
  },

  NODE_UNREACHABLE: {
    type: 'warning',
    message: '🚫 This step can\'t be reached from the Start node',
    suggestion: 'This node is isolated from your main workflow. Either connect it to your workflow path or remove it if it\'s not needed.',
    priority: 'medium',
    category: 'connections'
  },

  // Data & Variables
  VARIABLE_NOT_DEFINED: {
    type: 'warning',
    message: '📊 Using a variable that hasn\'t been set yet',
    suggestion: 'Make sure this variable is created in a previous step (like a form, API call, or assignment node) before using it here.',
    priority: 'medium',
    category: 'data'
  },

  INVALID_JSON: {
    type: 'error',
    message: '⚠️ Invalid JSON format detected',
    suggestion: 'Check your JSON syntax - look for missing commas, quotes, or brackets. Use a JSON validator if needed.',
    priority: 'high',
    category: 'syntax'
  },

  // Loop Nodes
  LOOP_NO_ITEMS: {
    type: 'warning',
    message: '🔁 For-each loop needs an array to iterate over',
    suggestion: 'Specify which array variable to loop through (like ${order_items} or ${user_list}).',
    priority: 'high',
    category: 'loops',
    quickFix: { action: 'editNode', label: 'Configure Loop' }
  },

  LOOP_NO_CONDITION: {
    type: 'warning',
    message: '🔁 While loop needs a condition to check',
    suggestion: 'Define when the loop should stop (like "counter < 10" or "status != complete"). Be careful to avoid infinite loops!',
    priority: 'high',
    category: 'loops',
    quickFix: { action: 'editNode', label: 'Add Condition' }
  },

  // Data Operations
  DATA_NO_ENTITY: {
    type: 'warning',
    message: '💾 Specify which type of record to work with',
    suggestion: 'Select the entity type (like "users", "orders", or "products") for this data operation.',
    priority: 'high',
    category: 'data',
    quickFix: { action: 'editNode', label: 'Select Entity' }
  },

  DATA_NO_QUERY: {
    type: 'warning',
    message: '🔍 Add search criteria to find specific records',
    suggestion: 'Define how to filter records using JSON format. Example: {"status": "active", "amount": {"$gt": 100}}',
    priority: 'high',
    category: 'data',
    quickFix: { action: 'editNode', label: 'Add Query' }
  }
};

/**
 * Get a user-friendly validation message
 */
export function getValidationMessage(type, nodeData = {}) {
  const template = VALIDATION_MESSAGES[type];
  if (!template) {
    return {
      type: 'warning',
      message: 'This step needs attention',
      suggestion: 'Click to review and configure this node.',
      priority: 'medium',
      category: 'general'
    };
  }

  // Clone template and potentially customize with node data
  const message = { ...template };
  
  // Add node label to message if available
  if (nodeData.label && nodeData.label !== 'New Node') {
    message.message = `"${nodeData.label}": ${message.message}`;
  }

  return message;
}

/**
 * Get validation category color
 */
export function getCategoryColor(category) {
  const colors = {
    structure: 'red',
    configuration: 'amber',
    assignment: 'blue',
    forms: 'indigo',
    logic: 'yellow',
    connections: 'purple',
    approvals: 'pink',
    integrations: 'cyan',
    subprocesses: 'teal',
    timing: 'orange',
    data: 'green',
    syntax: 'red',
    loops: 'violet',
    general: 'slate'
  };
  return colors[category] || 'slate';
}

/**
 * Get priority badge styling
 */
export function getPriorityStyle(priority) {
  const styles = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-gold-100 text-gold-800 border-gold-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  };
  return styles[priority] || styles.medium;
}

/**
 * Sort validation issues by priority
 */
export function sortByPriority(issues) {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return issues.sort((a, b) => {
    const aPriority = priorityOrder[a.priority] ?? 2;
    const bPriority = priorityOrder[b.priority] ?? 2;
    return aPriority - bPriority;
  });
}

export default {
  VALIDATION_MESSAGES,
  getValidationMessage,
  getCategoryColor,
  getPriorityStyle,
  sortByPriority
};
