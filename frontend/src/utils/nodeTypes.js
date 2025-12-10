export const NODE_TYPES = {
  // Flow Control
  START: 'start',
  END: 'end',
  
  // User Interaction
  TASK: 'task',
  FORM: 'form',
  SCREEN: 'screen',
  WAIT: 'wait',
  
  // Logic
  DECISION: 'decision',
  SWITCH: 'switch',
  ASSIGNMENT: 'assignment',
  
  // Loops & Iteration
  LOOP_FOR_EACH: 'loop_for_each',
  LOOP_WHILE: 'loop_while',
  LOOP_DO_WHILE: 'loop_do_while',  // Phase 3.2: Do-While loop (execute at least once)
  LOOP_REPEAT: 'loop_repeat',
  LOOP_BREAK: 'loop_break',      // Phase 3.2: Break out of loop
  LOOP_CONTINUE: 'loop_continue',  // Phase 3.2: Skip to next iteration
  
  // Approval & Review
  APPROVAL: 'approval',
  
  // Data Operations
  CREATE_RECORD: 'create_record',
  UPDATE_RECORD: 'update_record',
  DELETE_RECORD: 'delete_record',
  LOOKUP_RECORD: 'lookup_record',
  QUERY_RECORDS: 'query_records',
  GET_RECORD: 'get_record',
  
  // Data Transform
  TRANSFORM: 'transform',
  FILTER: 'filter',
  SORT: 'sort',
  AGGREGATE: 'aggregate',
  CALCULATE: 'calculate',
  
  // Flow Components
  PARALLEL: 'parallel',
  MERGE: 'merge',
  SUBPROCESS: 'subprocess',
  
  // Integrations & Actions
  ACTION: 'action',
  API_CALL: 'api_call',
  WEBHOOK: 'webhook',
  EMAIL: 'email',
  
  // Advanced
  TIMER: 'timer',
  EVENT: 'event',
  ERROR_HANDLER: 'error_handler',
  
  // Phase 1 Enhancements: Error Handling & Retry Logic
  TRY_CATCH: 'try_catch',
  RETRY: 'retry',
  BATCH_PROCESS: 'batch_process',
  
  // Phase 1 Enhancements: Annotations & Documentation
  COMMENT: 'comment',
  MILESTONE: 'milestone'
};

export const NODE_CONFIGS = {
  // ========== FLOW CONTROL ==========
  [NODE_TYPES.START]: {
    label: 'Start',
    category: 'Flow Components',
    color: 'bg-green-500',
    borderColor: 'border-green-600',
    icon: 'play-circle',
    description: 'Workflow starting point'
  },
  [NODE_TYPES.END]: {
    label: 'End',
    category: 'Flow Components',
    color: 'bg-gold-500',
    borderColor: 'border-gold-600',
    icon: 'stop-circle',
    description: 'Workflow ending point'
  },

  // ========== USER INTERACTION ==========
  [NODE_TYPES.TASK]: {
    label: 'Task',
    category: 'User Interaction',
    color: 'bg-green-500',
    borderColor: 'border-green-600',
    icon: 'check-square',
    description: 'Assign a task to users'
  },
  [NODE_TYPES.FORM]: {
    label: 'Form',
    category: 'User Interaction',
    color: 'bg-green-500',
    borderColor: 'border-green-600',
    icon: 'file-text',
    description: 'Collect data via forms'
  },
  [NODE_TYPES.SCREEN]: {
    label: 'Screen',
    category: 'User Interaction',
    color: 'bg-sky-500',
    borderColor: 'border-sky-600',
    icon: 'monitor',
    description: 'Display information to users'
  },
  [NODE_TYPES.WAIT]: {
    label: 'Wait',
    category: 'User Interaction',
    color: 'bg-green-500',
    borderColor: 'border-primary-600',
    icon: 'pause-circle',
    description: 'Wait for user action or event'
  },

  // ========== LOGIC ==========
  [NODE_TYPES.DECISION]: {
    label: 'Decision',
    category: 'Logic',
    color: 'bg-gold-500',
    borderColor: 'border-gold-600',
    icon: 'git-branch',
    description: 'Conditional branching (if/else)',
    outputHandles: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' }
    ]
  },
  [NODE_TYPES.SWITCH]: {
    label: 'Switch/Case',
    category: 'Logic',
    color: 'bg-amber-500',
    borderColor: 'border-amber-600',
    icon: 'list',
    description: 'Multi-way branching (switch/case)'
  },
  [NODE_TYPES.ASSIGNMENT]: {
    label: 'Assignment',
    category: 'Logic',
    color: 'bg-gold-500',
    borderColor: 'border-gold-600',
    icon: 'equal',
    description: 'Set variable values or transform data'
  },

  // ========== LOOPS & ITERATION ==========
  [NODE_TYPES.LOOP_FOR_EACH]: {
    label: 'For Each Loop',
    category: 'Logic',
    color: 'bg-gold-500',
    borderColor: 'border-gold-600',
    icon: 'repeat',
    description: 'Iterate over collection items'
  },
  [NODE_TYPES.LOOP_WHILE]: {
    label: 'While Loop',
    category: 'Logic',
    color: 'bg-violet-500',
    borderColor: 'border-violet-600',
    icon: 'refresh-cw',
    description: 'Repeat while condition is true'
  },
  [NODE_TYPES.LOOP_DO_WHILE]: {
    label: 'Do-While Loop',
    category: 'Logic',
    color: 'bg-green-500',
    borderColor: 'border-green-600',
    icon: 'rotate-cw',
    description: 'Execute once, then repeat while condition is true'
  },
  [NODE_TYPES.LOOP_REPEAT]: {
    label: 'Repeat Loop',
    category: 'Logic',
    color: 'bg-fuchsia-500',
    borderColor: 'border-fuchsia-600',
    icon: 'repeat-1',
    description: 'Repeat fixed number of times'
  },
  [NODE_TYPES.LOOP_BREAK]: {
    label: 'Break Loop',
    category: 'Logic',
    color: 'bg-rose-500',
    borderColor: 'border-rose-600',
    icon: 'x-circle',
    description: 'Exit current loop immediately'
  },
  [NODE_TYPES.LOOP_CONTINUE]: {
    label: 'Continue Loop',
    category: 'Logic',
    color: 'bg-pink-500',
    borderColor: 'border-pink-600',
    icon: 'skip-forward',
    description: 'Skip to next loop iteration'
  },

  // ========== APPROVAL ==========
  [NODE_TYPES.APPROVAL]: {
    label: 'Approval',
    category: 'User Interaction',
    color: 'bg-gold-600',
    borderColor: 'border-gold-700',
    icon: 'clipboard-check',
    description: 'Require approval from users'
  },

  // ========== DATA OPERATIONS ==========
  [NODE_TYPES.CREATE_RECORD]: {
    label: 'Create Record',
    category: 'Data',
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-600',
    icon: 'plus-circle',
    description: 'Create new database record'
  },
  [NODE_TYPES.UPDATE_RECORD]: {
    label: 'Update Record',
    category: 'Data',
    color: 'bg-teal-500',
    borderColor: 'border-teal-600',
    icon: 'edit',
    description: 'Update existing database record'
  },
  [NODE_TYPES.DELETE_RECORD]: {
    label: 'Delete Record',
    category: 'Data',
    color: 'bg-gold-600',
    borderColor: 'border-gold-700',
    icon: 'trash-2',
    description: 'Delete database record'
  },
  [NODE_TYPES.LOOKUP_RECORD]: {
    label: 'Lookup Record',
    category: 'Data',
    color: 'bg-cyan-500',
    borderColor: 'border-cyan-600',
    icon: 'search',
    description: 'Find record by ID or criteria'
  },
  [NODE_TYPES.QUERY_RECORDS]: {
    label: 'Query Records',
    category: 'Data',
    color: 'bg-sky-600',
    borderColor: 'border-sky-700',
    icon: 'database',
    description: 'Query multiple records with filters'
  },
  [NODE_TYPES.GET_RECORD]: {
    label: 'Get Record',
    category: 'Data',
    color: 'bg-green-600',
    borderColor: 'border-green-700',
    icon: 'file-search',
    description: 'Retrieve single record by ID'
  },

  // ========== DATA TRANSFORM ==========
  [NODE_TYPES.TRANSFORM]: {
    label: 'Transform',
    category: 'Data',
    color: 'bg-lime-500',
    borderColor: 'border-lime-600',
    icon: 'shuffle',
    description: 'Transform and map data'
  },
  [NODE_TYPES.FILTER]: {
    label: 'Filter',
    category: 'Data',
    color: 'bg-green-600',
    borderColor: 'border-green-700',
    icon: 'filter',
    description: 'Filter collection by conditions'
  },
  [NODE_TYPES.SORT]: {
    label: 'Sort',
    category: 'Data',
    color: 'bg-emerald-600',
    borderColor: 'border-emerald-700',
    icon: 'arrow-up-down',
    description: 'Sort collection by field'
  },
  [NODE_TYPES.AGGREGATE]: {
    label: 'Aggregate',
    category: 'Data',
    color: 'bg-teal-600',
    borderColor: 'border-teal-700',
    icon: 'bar-chart-2',
    description: 'Aggregate data (sum, count, avg)'
  },
  [NODE_TYPES.CALCULATE]: {
    label: 'Calculate',
    category: 'Data',
    color: 'bg-cyan-600',
    borderColor: 'border-cyan-700',
    icon: 'calculator',
    description: 'Perform calculations and formulas'
  },

  // ========== FLOW COMPONENTS ==========
  [NODE_TYPES.PARALLEL]: {
    label: 'Parallel Gateway',
    category: 'Flow Components',
    color: 'bg-gold-500',
    borderColor: 'border-gold-600',
    icon: 'split',
    description: 'Split into parallel paths',
    outputHandles: [
      { id: 'pathA', label: 'Path A' },
      { id: 'pathB', label: 'Path B' }
    ]
  },
  [NODE_TYPES.MERGE]: {
    label: 'Merge Gateway',
    category: 'Flow Components',
    color: 'bg-teal-500',
    borderColor: 'border-teal-600',
    icon: 'merge',
    description: 'Merge parallel paths'
  },
  [NODE_TYPES.SUBPROCESS]: {
    label: 'Subprocess',
    category: 'Flow Components',
    color: 'bg-violet-500',
    borderColor: 'border-violet-600',
    icon: 'workflow',
    description: 'Execute nested workflow'
  },

  // ========== INTEGRATIONS ==========
  [NODE_TYPES.ACTION]: {
    label: 'Action',
    category: 'Integrations',
    color: 'bg-pink-500',
    borderColor: 'border-pink-600',
    icon: 'zap',
    description: 'Execute custom action or script'
  },
  [NODE_TYPES.API_CALL]: {
    label: 'API Call',
    category: 'Integrations',
    color: 'bg-rose-500',
    borderColor: 'border-rose-600',
    icon: 'cloud',
    description: 'Make HTTP/REST API call'
  },
  [NODE_TYPES.WEBHOOK]: {
    label: 'Webhook',
    category: 'Integrations',
    color: 'bg-pink-600',
    borderColor: 'border-pink-700',
    icon: 'webhook',
    description: 'Send or receive webhook'
  },
  [NODE_TYPES.EMAIL]: {
    label: 'Email',
    category: 'Integrations',
    color: 'bg-gold-400',
    borderColor: 'border-gold-500',
    icon: 'mail',
    description: 'Send email notification'
  },

  // ========== ADVANCED ==========
  [NODE_TYPES.TIMER]: {
    label: 'Timer',
    category: 'Flow Components',
    color: 'bg-cyan-500',
    borderColor: 'border-cyan-600',
    icon: 'clock',
    description: 'Delay execution or schedule timeout'
  },
  [NODE_TYPES.EVENT]: {
    label: 'Event',
    category: 'Integrations',
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-600',
    icon: 'radio',
    description: 'Send/receive messages or signals'
  },
  [NODE_TYPES.ERROR_HANDLER]: {
    label: 'Error Handler',
    category: 'Flow Components',
    color: 'bg-gold-500',
    borderColor: 'border-gold-600',
    icon: 'alert-triangle',
    description: 'Handle errors and exceptions'
  },
  
  // ========== PHASE 1 ENHANCEMENTS ==========
  [NODE_TYPES.TRY_CATCH]: {
    label: 'Try-Catch',
    category: 'Error Handling',
    color: 'bg-amber-500',
    borderColor: 'border-amber-600',
    icon: 'alert-triangle',
    description: 'Execute with error handling fallback',
    outputHandles: [
      { id: 'success', label: 'Success' },
      { id: 'error', label: 'Error' }
    ]
  },
  [NODE_TYPES.RETRY]: {
    label: 'Retry',
    category: 'Error Handling',
    color: 'bg-orange-500',
    borderColor: 'border-orange-600',
    icon: 'refresh-cw',
    description: 'Retry failed operations with backoff',
    outputHandles: [
      { id: 'success', label: 'Success' },
      { id: 'failed', label: 'All Attempts Failed' }
    ]
  },
  [NODE_TYPES.BATCH_PROCESS]: {
    label: 'Batch Process',
    category: 'Data',
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-600',
    icon: 'list',
    description: 'Process items in batches with progress tracking'
  },
  [NODE_TYPES.COMMENT]: {
    label: 'Comment',
    category: 'Documentation',
    color: 'bg-gray-400',
    borderColor: 'border-gray-500',
    icon: 'file-text',
    description: 'Add notes and documentation to workflow'
  },
  [NODE_TYPES.MILESTONE]: {
    label: 'Milestone',
    category: 'Flow Components',
    color: 'bg-purple-500',
    borderColor: 'border-purple-600',
    icon: 'check-circle',
    description: 'Mark important checkpoints in workflow'
  }
};

export const createNodeData = (type, label = '') => {
  const config = NODE_CONFIGS[type];
  return {
    label: label || config.label,
    type: type,
    description: '',
    config: {},
    executionState: null // For live execution visualization
  };
};
