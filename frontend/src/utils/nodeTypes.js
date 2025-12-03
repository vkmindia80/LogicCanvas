export const NODE_TYPES = {
  START: 'start',
  TASK: 'task',
  DECISION: 'decision',
  APPROVAL: 'approval',
  FORM: 'form',
  END: 'end',
  PARALLEL: 'parallel',
  MERGE: 'merge'
};

export const NODE_CONFIGS = {
  [NODE_TYPES.START]: {
    label: 'Start',
    color: 'bg-green-500',
    borderColor: 'border-green-600',
    icon: 'play-circle',
    description: 'Workflow starting point'
  },
  [NODE_TYPES.TASK]: {
    label: 'Task',
    color: 'bg-blue-500',
    borderColor: 'border-blue-600',
    icon: 'check-square',
    description: 'Assign a task to users'
  },
  [NODE_TYPES.DECISION]: {
    label: 'Decision',
    color: 'bg-yellow-500',
    borderColor: 'border-yellow-600',
    icon: 'git-branch',
    description: 'Conditional branching'
  },
  [NODE_TYPES.APPROVAL]: {
    label: 'Approval',
    color: 'bg-purple-500',
    borderColor: 'border-purple-600',
    icon: 'clipboard-check',
    description: 'Require approval from users'
  },
  [NODE_TYPES.FORM]: {
    label: 'Form',
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-600',
    icon: 'file-text',
    description: 'Collect data via forms'
  },
  [NODE_TYPES.END]: {
    label: 'End',
    color: 'bg-red-500',
    borderColor: 'border-red-600',
    icon: 'stop-circle',
    description: 'Workflow ending point'
  },
  [NODE_TYPES.PARALLEL]: {
    label: 'Parallel Gateway',
    color: 'bg-orange-500',
    borderColor: 'border-orange-600',
    icon: 'split',
    description: 'Split into parallel paths'
  },
  [NODE_TYPES.MERGE]: {
    label: 'Merge Gateway',
    color: 'bg-teal-500',
    borderColor: 'border-teal-600',
    icon: 'merge',
    description: 'Merge parallel paths'
  }
};

export const createNodeData = (type, label = '') => {
  const config = NODE_CONFIGS[type];
  return {
    label: label || config.label,
    type: type,
    description: '',
    config: {}
  };
};
