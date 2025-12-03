import React from 'react';
import { 
  PlayCircle, CheckSquare, GitBranch, ClipboardCheck, 
  FileText, StopCircle, Split, Merge, Plus, Zap 
} from 'lucide-react';
import { NODE_TYPES, NODE_CONFIGS } from '../utils/nodeTypes';

const iconMap = {
  'play-circle': PlayCircle,
  'check-square': CheckSquare,
  'git-branch': GitBranch,
  'clipboard-check': ClipboardCheck,
  'file-text': FileText,
  'stop-circle': StopCircle,
  'split': Split,
  'merge': Merge,
  'zap': Zap
};

const NodePalette = ({ onAddNode }) => {
  const nodeTypes = Object.values(NODE_TYPES);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
        <Plus className="w-4 h-4 mr-2" />
        Add Nodes
      </h3>
      <div className="space-y-2">
        {nodeTypes.map(type => {
          const config = NODE_CONFIGS[type];
          const IconComponent = iconMap[config.icon];
          
          return (
            <button
              key={type}
              onClick={() => onAddNode(type)}
              className={`
                w-full flex items-center space-x-3 p-3 rounded-lg
                border-2 transition-all text-left
                hover:shadow-md hover:scale-105
                ${config.color} ${config.borderColor}
              `}
              data-testid={`palette-node-${type}`}
            >
              {IconComponent && <IconComponent className="w-5 h-5 text-white flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-white">{config.label}</div>
                <div className="text-xs text-white opacity-90 truncate">{config.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NodePalette;
