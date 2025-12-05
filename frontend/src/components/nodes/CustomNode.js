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
} from 'lucide-react';
import { NODE_TYPES, NODE_CONFIGS } from '../../utils/nodeTypes';

const iconMap = {
  'play-circle': PlayCircle,
  'check-square': CheckSquare,
  'git-branch': GitBranch,
  'clipboard-check': ClipboardCheck,
  'file-text': FileText,
  'stop-circle': StopCircle,
  split: Split,
  merge: Merge,
  zap: Zap,
  clock: Clock,
  workflow: Workflow,
  radio: Radio,
};

const CustomNode = ({ data, selected }) => {
  const config = NODE_CONFIGS[data.type];
  const IconComponent = iconMap[config.icon];

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

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg shadow-md border-2 transition-all
        ${selected ? 'ring-2 ring-primary-400 ring-offset-2' : ''}
        ${config.color} ${config.borderColor}
        hover:shadow-lg cursor-pointer
        min-w-[150px]
        ${isExecuting ? 'ring-2 ring-blue-400 ring-offset-2 animate-pulse' : ''}
        ${isCompleted ? 'ring-2 ring-green-400 ring-offset-2' : ''}
        ${isWaiting ? 'ring-2 ring-orange-400 ring-offset-2' : ''}
        ${isFailed ? 'ring-2 ring-red-400 ring-offset-2' : ''}
      `}
      data-testid={`node-${data.type}`}
    >
      {/* Execution State Indicator */}
      {executionState && (
        <div className="absolute -top-2 -right-2 z-10">
          {isExecuting && (
            <div className="bg-blue-500 rounded-full p-1 shadow-lg animate-pulse">
              <Clock className="w-4 h-4 text-white" />
            </div>
          )}
          {isCompleted && (
            <div className="bg-green-500 rounded-full p-1 shadow-lg">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
          {isWaiting && (
            <div className="bg-orange-500 rounded-full p-1 shadow-lg animate-pulse">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          )}
          {isFailed && (
            <div className="bg-red-500 rounded-full p-1 shadow-lg">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Validation Indicator (separate from execution state) */}
      {validationStatus && (
        <div className="absolute -top-2 -left-2 z-10" data-testid="node-validation-indicator">
          {hasValidationError && (
            <div className="bg-red-600 rounded-full p-1 shadow-md" title="This node has validation errors">
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

      {/* Input Handle - not for start node */}
      {data.type !== NODE_TYPES.START && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-white border-2 border-gray-400"
          data-testid="node-handle-input"
        />
      )}

      {/* Node Content */}
      <div className="flex items-center space-x-2 text-white">
        {IconComponent && <IconComponent className="w-5 h-5" />}
        <div className="flex-1">
          <div className="font-semibold text-sm">{data.label}</div>
          {data.description && <div className="text-xs opacity-90 mt-1">{data.description}</div>}
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
              className="w-3 h-3 !bg-white border-2 border-gray-400"
              data-testid="node-handle-output"
            />
          )}

          {/* Multiple named outputs for special nodes (e.g., Decision, Parallel) */}
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
                    className="w-3 h-3 !bg-white border-2 border-gray-400"
                    data-testid={`node-handle-output-${handle.id}`}
                  />
                  <span className="mt-1 bg-black/30 px-1 py-0.5 rounded-full whitespace-nowrap">
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
