import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Clock, Play } from 'lucide-react';

const NODE_STATES = {
  configured: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
    border: 'border-green-300',
    label: 'Configured'
  },
  incomplete: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    label: 'Incomplete'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-300',
    label: 'Error'
  },
  running: {
    icon: Play,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    label: 'Running'
  },
  waiting: {
    icon: Clock,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    label: 'Waiting'
  }
};

const getNodeState = (node) => {
  // Check if node is properly configured based on type
  const data = node.data || {};
  const type = data.type || node.type;

  // Start and End nodes are always configured
  if (type === 'start' || type === 'end') {
    return 'configured';
  }

  // Task node validation
  if (type === 'task') {
    if (!data.assignedTo && data.assignmentStrategy === 'direct') {
      return 'incomplete';
    }
    if (!data.assignmentRole && data.assignmentStrategy !== 'direct') {
      return 'incomplete';
    }
    return 'configured';
  }

  // Decision node validation
  if (type === 'decision' || type === 'switch') {
    if (!data.condition) {
      return 'incomplete';
    }
    return 'configured';
  }

  // Form node validation
  if (type === 'form') {
    if (!data.formId) {
      return 'incomplete';
    }
    return 'configured';
  }

  // Approval node validation
  if (type === 'approval') {
    if (!data.approvers || data.approvers.length === 0) {
      return 'incomplete';
    }
    return 'configured';
  }

  // Action node validation
  if (type === 'action') {
    const actionType = data.actionType || 'http';
    if (actionType === 'http' && !data.url) {
      return 'incomplete';
    }
    if (actionType === 'script' && !data.script) {
      return 'incomplete';
    }
    return 'configured';
  }

  // Subprocess node validation
  if (type === 'subprocess') {
    if (!data.subprocessWorkflowId) {
      return 'incomplete';
    }
    return 'configured';
  }

  // API call node validation
  if (type === 'api-call') {
    if (!data.url) {
      return 'incomplete';
    }
    return 'configured';
  }

  // Loop nodes validation
  if (type === 'loop-foreach' || type === 'loop-while' || type === 'loop-repeat') {
    if (!data.condition && type !== 'loop-repeat') {
      return 'incomplete';
    }
    if (!data.loopCount && type === 'loop-repeat') {
      return 'incomplete';
    }
    return 'configured';
  }

  // Data operation nodes
  if (type === 'create-record' || type === 'update-record' || type === 'delete-record' || type === 'lookup-record') {
    if (!data.collection) {
      return 'incomplete';
    }
    return 'configured';
  }

  // Default: if has label, consider configured
  if (data.label && data.label.trim()) {
    return 'configured';
  }

  return 'incomplete';
};

const NodeStateIndicator = ({ node, size = 'sm', showLabel = false }) => {
  const state = getNodeState(node);
  const stateConfig = NODE_STATES[state] || NODE_STATES.incomplete;
  const IconComponent = stateConfig.icon;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size] || sizeClasses.sm;

  if (showLabel) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${stateConfig.bg} ${stateConfig.color} ${stateConfig.border} border`}
           data-testid="node-state-badge">
        <IconComponent className={iconSize} />
        <span>{stateConfig.label}</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <IconComponent className={`${iconSize} ${stateConfig.color}`} data-testid="node-state-icon" />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {stateConfig.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
};

export { NodeStateIndicator, getNodeState, NODE_STATES };
export default NodeStateIndicator;
