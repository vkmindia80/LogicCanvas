import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import {
  PlayCircle,
  CheckSquare,
  GitBranch,
  ClipboardCheck,
  FileText,
  StopCircle,
  Split,
  Merge,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Workflow,
  Radio,
  Monitor,
  PauseCircle,
  List,
  Equal,
  Repeat,
  RefreshCw,
  Repeat1,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Database,
  FileSearch,
  Shuffle,
  Filter,
  ArrowUpDown,
  BarChart2,
  Calculator,
  Cloud,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { NODE_TYPES, NODE_CONFIGS } from '../../utils/nodeTypes';

const iconMap = {
  'play-circle': PlayCircle,
  'check-square': CheckSquare,
  'git-branch': GitBranch,
  'clipboard-check': ClipboardCheck,
  'file-text': FileText,
  'stop-circle': StopCircle,
  'split': Split,
  'merge': Merge,
  'zap': Zap,
  'clock': Clock,
  'workflow': Workflow,
  'radio': Radio,
  'monitor': Monitor,
  'pause-circle': PauseCircle,
  'list': List,
  'equal': Equal,
  'repeat': Repeat,
  'refresh-cw': RefreshCw,
  'repeat-1': Repeat1,
  'plus-circle': PlusCircle,
  'edit': Edit,
  'trash-2': Trash2,
  'search': Search,
  'database': Database,
  'file-search': FileSearch,
  'shuffle': Shuffle,
  'filter': Filter,
  'arrow-up-down': ArrowUpDown,
  'bar-chart-2': BarChart2,
  'calculator': Calculator,
  'cloud': Cloud,
  'mail': Mail,
  'webhook': Mail,
  'alert-triangle': AlertTriangle
};

const CustomNode = ({ data, selected }) => {
  const config = NODE_CONFIGS[data.type];
  const IconComponent = config ? iconMap[config.icon] : null;

  // Execution state from data (if provided)
  const executionState = data.executionState; // 'running', 'completed', 'waiting', 'failed'

  // Validation state from data (if provided)
  const validationStatus = data.validationStatus; // 'error' | 'warning' | null

  const isExecuting = executionState === 'running';
  const isCompleted = executionState === 'completed';
  const isWaiting = executionState === 'waiting';
  const isFailed = executionState === 'failed';

  const hasValidationError = validationStatus === 'error';
  const hasValidationWarning = validationStatus === 'warning';

  // Enhanced Salesforce-style color scheme with gradients
  const getNodeStyle = () => {
    const baseStyles = {
      background: '',
      boxShadow: '',
      border: ''
    };

    // Salesforce-style gradient backgrounds based on node type
    const gradientMap = {
      [NODE_TYPES.START]: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      [NODE_TYPES.END]: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      [NODE_TYPES.TASK]: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      [NODE_TYPES.FORM]: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      [NODE_TYPES.SCREEN]: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      [NODE_TYPES.WAIT]: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      [NODE_TYPES.DECISION]: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      [NODE_TYPES.SWITCH]: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
      [NODE_TYPES.ASSIGNMENT]: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      [NODE_TYPES.APPROVAL]: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      [NODE_TYPES.PARALLEL]: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      [NODE_TYPES.MERGE]: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      [NODE_TYPES.SUBPROCESS]: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      [NODE_TYPES.TIMER]: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      [NODE_TYPES.EVENT]: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      [NODE_TYPES.ACTION]: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      [NODE_TYPES.API_CALL]: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      [NODE_TYPES.WEBHOOK]: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      [NODE_TYPES.EMAIL]: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      // Loop nodes
      [NODE_TYPES.LOOP_FOR_EACH]: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      [NODE_TYPES.LOOP_WHILE]: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      [NODE_TYPES.LOOP_REPEAT]: 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)',
      // Data nodes
      [NODE_TYPES.CREATE_RECORD]: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      [NODE_TYPES.UPDATE_RECORD]: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      [NODE_TYPES.DELETE_RECORD]: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      [NODE_TYPES.LOOKUP_RECORD]: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      [NODE_TYPES.QUERY_RECORDS]: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      [NODE_TYPES.GET_RECORD]: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      [NODE_TYPES.TRANSFORM]: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      [NODE_TYPES.FILTER]: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      [NODE_TYPES.SORT]: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      [NODE_TYPES.AGGREGATE]: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      [NODE_TYPES.CALCULATE]: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      [NODE_TYPES.ERROR_HANDLER]: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
    };

    baseStyles.background = gradientMap[data.type] || 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
    
    // Enhanced shadows with depth
    if (selected) {
      baseStyles.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(59, 130, 246, 0.5)';
    } else if (isExecuting) {
      baseStyles.boxShadow = '0 8px 25px -5px rgba(59, 130, 246, 0.5), 0 0 0 2px rgba(59, 130, 246, 0.3)';
    } else if (isCompleted) {
      baseStyles.boxShadow = '0 8px 25px -5px rgba(34, 197, 94, 0.4), 0 0 0 2px rgba(34, 197, 94, 0.3)';
    } else if (isFailed) {
      baseStyles.boxShadow = '0 8px 25px -5px rgba(239, 68, 68, 0.5), 0 0 0 2px rgba(239, 68, 68, 0.3)';
    } else {
      baseStyles.boxShadow = '0 4px 15px -3px rgba(0, 0, 0, 0.15), 0 2px 6px -2px rgba(0, 0, 0, 0.1)';
    }

    return baseStyles;
  };

  const nodeStyle = getNodeStyle();

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 border-white/20 transition-all duration-200
        min-w-[160px] backdrop-blur-sm
        ${selected ? 'scale-105' : 'hover:scale-102'}
        ${isExecuting ? 'animate-pulse-slow' : ''}
        cursor-pointer node-enhanced
      `}
      style={nodeStyle}
      data-testid={`node-${data.type}`}
    >
      {/* Execution State Indicator - Enhanced with animations */}
      {executionState && (
        <div className="absolute -top-2 -right-2 z-10">
          {isExecuting && (
            <div className="bg-blue-500 rounded-full p-1.5 shadow-lg animate-bounce" style={{ animationDuration: '1s' }}>
              <Clock className="w-4 h-4 text-white" />
            </div>
          )}
          {isCompleted && (
            <div className="bg-green-500 rounded-full p-1.5 shadow-lg animate-check-bounce">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
          {isWaiting && (
            <div className="bg-orange-500 rounded-full p-1.5 shadow-lg animate-pulse">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          )}
          {isFailed && (
            <div className="bg-red-500 rounded-full p-1.5 shadow-lg animate-shake">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Validation Indicator */}
      {validationStatus && (
        <div className="absolute -top-2 -left-2 z-10" data-testid="node-validation-indicator">
          {hasValidationError && (
            <div className="bg-red-600 rounded-full p-1 shadow-md animate-pulse" title="This node has validation errors">
              <AlertCircle className="w-3 h-3 text-white" />
            </div>
          )}
          {hasValidationWarning && !hasValidationError && (
            <div className="bg-amber-500 rounded-full p-1 shadow-md" title="This node has validation warnings">
              <AlertCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Shine effect overlay for Salesforce aesthetic */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Input Handle - not for start node */}
      {data.type !== NODE_TYPES.START && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-white !border-2 !border-gray-300 shadow-md hover:scale-125 transition-transform"
          data-testid="node-handle-input"
        />
      )}

      {/* Node Content */}
      <div className="flex items-center space-x-3 text-white relative z-10">
        {IconComponent && (
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <IconComponent className="w-5 h-5 drop-shadow-md" />
          </div>
        )}
        <div className="flex-1">
          <div className="font-bold text-sm drop-shadow-md">{data.label}</div>
          {data.description && (
            <div className="text-xs opacity-90 mt-1 drop-shadow-sm line-clamp-2">
              {data.description}
            </div>
          )}
        </div>
      </div>

      {/* Output Handles - not for end node */}
      {data.type !== NODE_TYPES.END && (
        <>
          {/* Default single output for most nodes */}
          {!NODE_CONFIGS[data.type]?.outputHandles && (
            <Handle
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 !bg-white !border-2 !border-gray-300 shadow-md hover:scale-125 transition-transform"
              data-testid="node-handle-output"
            />
          )}

          {/* Multiple named outputs for special nodes */}
          {NODE_CONFIGS[data.type]?.outputHandles && (
            <div className="absolute -bottom-3 left-0 right-0 text-[10px] text-white/90">
              {NODE_CONFIGS[data.type].outputHandles.map((handle, index) => (
                <div
                  key={handle.id}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${((index + 1) * 100) / (NODE_CONFIGS[data.type].outputHandles.length + 1)}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <Handle
                    id={handle.id}
                    type="source"
                    position={Position.Bottom}
                    className="w-3 h-3 !bg-white !border-2 !border-gray-300 shadow-md hover:scale-125 transition-transform"
                    data-testid={`node-handle-output-${handle.id}`}
                  />
                  <span className="mt-1 bg-black/40 px-2 py-0.5 rounded-full whitespace-nowrap font-semibold drop-shadow-md backdrop-blur-sm">
                    {handle.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default memo(CustomNode);
