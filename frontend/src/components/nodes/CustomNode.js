import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  PlayCircle, CheckSquare, GitBranch, ClipboardCheck, 
  FileText, StopCircle, Split, Merge 
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
  'merge': Merge
};

const CustomNode = ({ data, selected }) => {
  const config = NODE_CONFIGS[data.type];
  const IconComponent = iconMap[config.icon];

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg shadow-md border-2 transition-all
        ${selected ? 'ring-2 ring-primary-400 ring-offset-2' : ''}
        ${config.color} ${config.borderColor}
        hover:shadow-lg cursor-pointer
        min-w-[150px]
      `}
      data-testid={`node-${data.type}`}
    >
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
          {data.description && (
            <div className="text-xs opacity-90 mt-1">{data.description}</div>
          )}
        </div>
      </div>

      {/* Output Handle - not for end node */}
      {data.type !== NODE_TYPES.END && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-white border-2 border-gray-400"
          data-testid="node-handle-output"
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
