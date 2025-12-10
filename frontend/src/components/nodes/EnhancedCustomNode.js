import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import {
  PlayCircle, CheckSquare, GitBranch, ClipboardCheck, FileText, StopCircle,
  Split, Merge, Zap, Clock, CheckCircle, AlertCircle, Workflow, Radio,
  Monitor, PauseCircle, List, Equal, Repeat, RefreshCw, Repeat1, PlusCircle,
  Edit, Trash2, Search, Database, FileSearch, Shuffle, Filter, ArrowUpDown,
  BarChart2, Calculator, Cloud, Mail, AlertTriangle, Settings, Info, Loader,
  RotateCw, XCircle, Layers
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
  'check-circle': CheckCircle, 'rotate-cw': RotateCw, 'x-circle': XCircle, 'layers': Layers
};

const EnhancedCustomNode = ({ data, selected }) => {
  const config = NODE_CONFIGS[data.type];
  const IconComponent = config ? iconMap[config.icon] : null;
  
  // PHASE 1: Enhanced execution states with progress tracking
  const executionState = data.executionState;
  const progress = data.progress || 0; // 0-100
  const executionTime = data.executionTime || 0; // in seconds
  const retryCount = data.retryCount || 0;
  const retryAttempt = data.retryAttempt || 0;
  const maxRetries = data.maxRetries || 3;
  const batchProgress = data.batchProgress || { current: 0, total: 0 };
  const startTime = data.startTime;
  const annotations = data.annotations || [];
  
  // Time tracking
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (executionState === 'running' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - new Date(startTime).getTime();
        setElapsedTime(Math.floor(elapsed / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [executionState, startTime]);
  
  // Visual states
  const isExecuting = executionState === 'running';
  const isCompleted = executionState === 'completed';
  const isWaiting = executionState === 'waiting';
  const isFailed = executionState === 'failed';
  const isPaused = executionState === 'paused';
  const isRetrying = executionState === 'retrying';
  
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
    if (isExecuting || isRetrying) {
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

  const nodeStyle = getNodeStyle();

  // Format time display
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Get status badge
  const renderStatusBadge = () => {
    if (!executionState) return null;

    const badges = {
      running: { bg: 'bg-blue-500', text: 'Running', icon: Loader, animate: 'animate-spin' },
      completed: { bg: 'bg-green-500', text: 'Complete', icon: CheckCircle },
      failed: { bg: 'bg-red-500', text: 'Failed', icon: XCircle },
      waiting: { bg: 'bg-amber-500', text: 'Waiting', icon: Clock, animate: 'animate-pulse' },
      paused: { bg: 'bg-gray-500', text: 'Paused', icon: PauseCircle },
      retrying: { bg: 'bg-orange-500', text: `Retry ${retryAttempt}/${maxRetries}`, icon: RotateCw, animate: 'animate-spin' }
    };

    const badge = badges[executionState];
    if (!badge) return null;

    const BadgeIcon = badge.icon;

    return (
      <div className={`absolute -top-2 -right-2 ${badge.bg} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg z-10`}>
        <BadgeIcon className={`w-3 h-3 ${badge.animate || ''}`} />
        <span className="font-semibold">{badge.text}</span>
      </div>
    );
  };

  // Render progress indicator
  const renderProgressIndicator = () => {
    if (!isExecuting && !isRetrying) return null;

    // Batch progress
    if (batchProgress.total > 0) {
      const batchPercent = (batchProgress.current / batchProgress.total) * 100;
      return (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${batchPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ fontSize: '8px', lineHeight: '1' }}>
            {batchProgress.current}/{batchProgress.total}
          </div>
        </div>
      );
    }

    // Regular progress
    if (progress > 0) {
      return (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      );
    }

    // Indeterminate progress
    return (
      <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" style={{ animation: 'slide 1.5s ease-in-out infinite' }} />
      </div>
    );
  };

  // Render time tracker
  const renderTimeTracker = () => {
    if (!isExecuting || elapsedTime === 0) return null;

    return (
      <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg z-10">
        <Clock className="w-3 h-3" />
        <span className="font-mono font-semibold">{formatTime(elapsedTime)}</span>
      </div>
    );
  };

  // Render retry counter
  const renderRetryCounter = () => {
    if (retryCount === 0) return null;

    return (
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-10">
        <RotateCw className="w-2.5 h-2.5" />
        <span className="font-bold">{retryCount}</span>
      </div>
    );
  };

  // Render annotation indicator
  const renderAnnotations = () => {
    if (annotations.length === 0) return null;

    return (
      <div className="absolute -bottom-2 right-0 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full shadow-sm z-10" title={`${annotations.length} annotation(s)`}>
        <FileText className="w-3 h-3" />
      </div>
    );
  };

  // Render swim lane indicator
  const renderLaneIndicator = () => {
    if (!data.laneId) return null;

    return (
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-sm shadow-sm z-10">
        <Layers className="w-2.5 h-2.5" />
      </div>
    );
  };

  return (
    <div
      className="relative"
      style={{
        minWidth: '180px',
        minHeight: '60px',
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#6366f1',
          width: 12,
          height: 12,
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />

      {/* Main Node */}
      <div
        className="px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
        style={{
          background: nodeStyle.background,
          border: nodeStyle.border,
          borderColor: nodeStyle.borderColor,
          boxShadow: nodeStyle.boxShadow,
        }}
      >
        {/* Icon & Label */}
        <div className="flex items-center space-x-2">
          {IconComponent && (
            <div className="flex-shrink-0 bg-white/20 rounded-lg p-1.5">
              <IconComponent className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">
              {data.label || config?.label || 'Node'}
            </div>
            {data.description && (
              <div className="text-xs text-white/80 truncate mt-0.5">
                {data.description}
              </div>
            )}
          </div>
        </div>

        {/* Validation Indicator */}
        {(hasValidationError || hasValidationWarning) && (
          <div className="absolute top-1 right-1">
            <AlertCircle 
              className={`w-4 h-4 ${hasValidationError ? 'text-red-200' : 'text-yellow-200'}`}
            />
          </div>
        )}
      </div>

      {/* PHASE 1: Enhanced Visual Indicators */}
      {renderStatusBadge()}
      {renderTimeTracker()}
      {renderProgressIndicator()}
      {renderRetryCounter()}
      {renderAnnotations()}
      {renderLaneIndicator()}

      {/* Output Handles */}
      {config?.outputHandles ? (
        config.outputHandles.map((handle, index) => (
          <Handle
            key={handle.id}
            type="source"
            position={Position.Bottom}
            id={handle.id}
            style={{
              background: '#6366f1',
              width: 12,
              height: 12,
              border: '2px solid white',
              left: `${(index + 1) * (100 / (config.outputHandles.length + 1))}%`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 whitespace-nowrap bg-white px-1.5 py-0.5 rounded shadow-sm">
              {handle.label}
            </div>
          </Handle>
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: '#6366f1',
            width: 12,
            height: 12,
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default memo(EnhancedCustomNode);
