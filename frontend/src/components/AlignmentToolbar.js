import React from 'react';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignTop,
  AlignCenterVertical,
  AlignBottom,
  Distribute Horizontal,
  DistributeVertical,
  Grid3x3
} from 'lucide-react';

/**
 * AlignmentToolbar - Advanced node alignment and distribution tools
 * Part of Phase 2: Advanced Snap-to-Align Enhancement
 * 
 * Features:
 * - Align multiple nodes (left, center, right, top, middle, bottom)
 * - Distribute nodes evenly (horizontal, vertical)
 * - Smart spacing controls
 * - Keyboard shortcuts (Ctrl+L, Ctrl+R, Ctrl+T, etc.)
 */

const AlignmentToolbar = ({ selectedNodes, onAlign, onDistribute }) => {
  if (!selectedNodes || selectedNodes.length < 2) {
    return null;
  }

  const handleAlign = (type) => {
    if (onAlign) {
      onAlign(type, selectedNodes);
    }
  };

  const handleDistribute = (direction) => {
    if (onDistribute) {
      onDistribute(direction, selectedNodes);
    }
  };

  return (
    <div 
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border-2 border-slate-200 p-3"
      data-testid="alignment-toolbar"
    >
      <div className="flex items-center gap-4">
        {/* Horizontal Alignment */}
        <div className="flex items-center gap-1 border-r pr-3">
          <span className="text-xs font-semibold text-slate-600 mr-2">Align:</span>
          <button
            onClick={() => handleAlign('left')}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
            title="Align Left (Ctrl+Shift+L)"
            data-testid="align-left"
          >
            <AlignLeft className="w-4 h-4 text-slate-600 group-hover:text-primary-600" />
          </button>
          <button
            onClick={() => handleAlign('center-h')}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
            title="Align Center Horizontal (Ctrl+Shift+C)"
            data-testid="align-center-h"
          >
            <AlignCenter className="w-4 h-4 text-slate-600 group-hover:text-primary-600" />
          </button>
          <button
            onClick={() => handleAlign('right')}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
            title="Align Right (Ctrl+Shift+R)"
            data-testid="align-right"
          >
            <AlignRight className="w-4 h-4 text-slate-600 group-hover:text-primary-600" />
          </button>
        </div>

        {/* Vertical Alignment */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={() => handleAlign('top')}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
            title="Align Top (Ctrl+Shift+T)"
            data-testid="align-top"
          >
            <AlignTop className="w-4 h-4 text-slate-600 group-hover:text-primary-600" />
          </button>
          <button
            onClick={() => handleAlign('center-v')}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
            title="Align Center Vertical (Ctrl+Shift+M)"
            data-testid="align-center-v"
          >
            <AlignCenterVertical className="w-4 h-4 text-slate-600 group-hover:text-primary-600" />
          </button>
          <button
            onClick={() => handleAlign('bottom')}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
            title="Align Bottom (Ctrl+Shift+B)"
            data-testid="align-bottom"
          >
            <AlignBottom className="w-4 h-4 text-slate-600 group-hover:text-primary-600" />
          </button>
        </div>

        {/* Distribution */}
        <div className="flex items-center gap-1 border-r pr-3">
          <span className="text-xs font-semibold text-slate-600 mr-2">Distribute:</span>
          <button
            onClick={() => handleDistribute('horizontal')}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
            title="Distribute Horizontally (Ctrl+Shift+H)"
            data-testid="distribute-h"
          >
            <AlignHorizontalJustifyCenter className="w-4 h-4 text-slate-600 group-hover:text-primary-600" />
          </button>
          <button
            onClick={() => handleDistribute('vertical')}
            className="p-2 hover:bg-primary-50 rounded-lg transition-colors group"
            title="Distribute Vertically (Ctrl+Shift+V)"
            data-testid="distribute-v"
          >
            <AlignVerticalJustifyCenter className="w-4 h-4 text-slate-600 group-hover:text-primary-600" />
          </button>
        </div>

        {/* Grid Snap */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
            {selectedNodes.length} nodes selected
          </span>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-2 pt-2 border-t border-slate-200">
        <div className="text-xs text-slate-500 text-center">
          💡 Use <kbd className="px-1 py-0.5 bg-slate-200 rounded font-mono text-xs">Ctrl+Shift</kbd> + alignment key for quick access
        </div>
      </div>
    </div>
  );
};

export default AlignmentToolbar;
