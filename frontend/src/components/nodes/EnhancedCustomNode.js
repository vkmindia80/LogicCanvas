import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import {
  PlayCircle, CheckSquare, GitBranch, ClipboardCheck, FileText, StopCircle,
  Split, Merge, Zap, Clock, CheckCircle, AlertCircle, Workflow, Radio,
  Monitor, PauseCircle, List, Equal, Repeat, RefreshCw, Repeat1, PlusCircle,
  Edit, Trash2, Search, Database, FileSearch, Shuffle, Filter, ArrowUpDown,
  BarChart2, Calculator, Cloud, Mail, AlertTriangle, Settings, Info, Loader
} from 'lucide-react';
import { NODE_TYPES, NODE_CONFIGS } from '../../utils/nodeTypes';

const iconMap = {
  'play-circle': PlayCircle, 'check-square': CheckSquare, 'git-branch': GitBranch,
  'clipboard-check': ClipboardCheck, 'file-text': FileText, 'stop-circle': StopCircle,
  'split': Split, 'merge': Merge, 'zap': Zap, 'clock': Clock, 'workflow': Workflow,
  'radio': Radio, 'monitor': Monitor, 'pause-circle': PauseCircle, 'list': List,
  'equal': Equal, 'repeat': Repeat, 'refresh-cw': RefreshCw, 'repeat-1': Repeat1,
  'plus-circle': PlusCircle, 'edit': Edit, 'trash-2': Trash2, 'search': Search,
  'database': Database, 'file-search': FileSearch, 'shuffle': Shuffle, 'filter': Filter,
  'arrow-up-down': ArrowUpDown, 'bar-chart-2': BarChart2, 'calculator': Calculator,
  'cloud': Cloud, 'mail': Mail, 'webhook': Mail, 'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle
};

const EnhancedCustomNode = ({ data, selected }) => {
  const config = NODE_CONFIGS[data.type];
  const IconComponent = config ? iconMap[config.icon] : null;
  
  // Enhanced execution states
  const executionState = data.executionState;
  const progress = data.progress || 0; // 0-100
  const executionTime = data.executionTime || 0; // in seconds
  const retryCount = data.retryCount || 0;
  const batchProgress = data.batchProgress || { current: 0, total: 0 };
  
  // Visual states
  const isExecuting = executionState === 'running';
  const isCompleted = executionState === 'completed';
  const isWaiting = executionState === 'waiting';
  const isFailed = executionState === 'failed';
  const isPaused = executionState === 'paused';
  
  // Validation
  const validationStatus = data.validationStatus;
  const hasValidationError = validationStatus === 'error';
  const hasValidationWarning = validationStatus === 'warning';

  // Get node styling based on state
  const getNodeStyle = () => {
    const gradients = {
      [NODE_TYPES.START]: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      [NODE_TYPES.END]: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      [NODE_TYPES.TASK]: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      [NODE_TYPES.DECISION]: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
      [NODE_TYPES.APPROVAL]: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      [NODE_TYPES.FORM]: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      [NODE_TYPES.TRY_CATCH]: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      [NODE_TYPES.RETRY]: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      [NODE_TYPES.BATCH_PROCESS]: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    };

    let background = gradients[data.type] || 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
    let border = '2px solid';
    let borderColor = '#e2e8f0';
    let boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

    // State-based styling
    if (isExecuting) {
      border = '3px solid';
      borderColor = '#3b82f6';
      boxShadow = '0 0 20px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(0,0,0,0.15)';
    } else if (isCompleted) {
      border = '2px solid';
      borderColor = '#10b981';
      boxShadow = '0 0 12px rgba(16, 185, 129, 0.3)';
    } else if (isFailed) {
      border = '3px solid';
      borderColor = '#ef4444';
      boxShadow = '0 0 20px rgba(239, 68, 68, 0.5)';
      background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
    } else if (isWaiting) {
      border = '2px dashed';
      borderColor = '#f59e0b';
      boxShadow = '0 0 12px rgba(245, 158, 11, 0.3)';
    } else if (isPaused) {
      border = '2px solid';
      borderColor = '#6b7280';
      boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }

    if (selected) {
      border = '3px solid';
      borderColor = '#8b5cf6';
      boxShadow = '0 0 24px rgba(139, 92, 246, 0.4)';
    }

    if (hasValidationError) {
      borderColor = '#dc2626';
    } else if (hasValidationWarning) {
      borderColor = '#f59e0b';
    }

    return { background, border, borderColor, boxShadow };
  };

  const style = getNodeStyle();

  // Format execution time
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div
      className="rounded-xl min-w-[200px] max-w-[280px] transition-all duration-300"
      style={{
        background: style.background,
        border: style.border,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        position: 'relative'
      }}
    >
      {/* Execution State Badge */}
      {executionState && (
        <div className="absolute -top-2 -right-2 z-10">
          {isExecuting && (
            <div className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 animate-pulse">
              <Loader className="w-3 h-3 animate-spin" />
              Running
            </div>
          )}
          {isCompleted && (
            <div className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Done
            </div>
          )}
          {isFailed && (
            <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Failed
            </div>
          )}
          {isWaiting && (
            <div className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Waiting
            </div>
          )}
        </div>
      )}

      {/* Retry Counter */}
      {retryCount > 0 && (
        <div className="absolute -top-2 -left-2 z-10 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
          Retry #{retryCount}
        </div>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Node Content */}
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          {IconComponent && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5">
              <IconComponent className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1">
            <div className="text-sm font-bold text-white leading-tight">
              {data.label}
            </div>
            <div className="text-xs text-white/80">
              {config?.label || data.type}
            </div>
          </div>
        </div>

        {/* Progress Bar (for running nodes) */}
        {isExecuting && progress > 0 && (
          <div className="mb-2">
            <div className="bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-white/90 mt-1 text-center">{progress}%</div>
          </div>
        )}

        {/* Batch Progress */}
        {data.type === NODE_TYPES.BATCH_PROCESS && batchProgress.total > 0 && (
          <div className="mb-2 bg-white/10 rounded-lg p-2">
            <div className="text-xs text-white/90 mb-1">
              Processing: {batchProgress.current} / {batchProgress.total}
            </div>
            <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-400 h-full transition-all duration-300"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Execution Time */}
        {executionTime > 0 && (
          <div className="text-xs text-white/80 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(executionTime)}
          </div>
        )}

        {/* Validation Messages */}
        {hasValidationError && (
          <div className="mt-2 text-xs text-red-100 bg-red-500/30 rounded px-2 py-1">
            ⚠️ Configuration needed
          </div>
        )}
        {hasValidationWarning && !hasValidationError && (
          <div className="mt-2 text-xs text-amber-100 bg-amber-500/30 rounded px-2 py-1">
            ⚡ Incomplete setup
          </div>
        )}
      </div>

      {/* Output Handles */}
      {config?.outputHandles ? (
        config.outputHandles.map((handle, idx) => (
          <Handle
            key={handle.id}
            type="source"
            position={Position.Bottom}
            id={handle.id}
            className="w-3 h-3 !bg-green-500 !border-2 !border-white"
            style={{ left: `${(100 / (config.outputHandles.length + 1)) * (idx + 1)}%` }}
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs bg-white px-2 py-0.5 rounded shadow-lg whitespace-nowrap text-gray-700 font-medium">
              {handle.label}
            </div>
          </Handle>
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        />
      )}
    </div>
  );
};

export default memo(EnhancedCustomNode);
