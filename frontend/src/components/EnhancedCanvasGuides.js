import React, { useEffect, useState, useCallback } from 'react';
import { Grid, AlignHorizontal, AlignVertical, Magnet } from 'lucide-react';

/**
 * Enhanced Canvas Guides with Snap-to-Align, Grid, and Smart Connection Helpers
 */
const EnhancedCanvasGuides = ({ nodes, edges, selectedNode, onNodeMove, enabled = true }) => {
  const [guides, setGuides] = useState({ vertical: [], horizontal: [] });
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);

  const SNAP_THRESHOLD = 10; // pixels
  const GUIDE_COLORS = {
    align: '#8B5CF6', // purple
    distribute: '#3B82F6', // blue
    grid: '#E5E7EB' // gray
  };

  // Calculate alignment guides when node is being moved
  const calculateGuides = useCallback((movingNode) => {
    if (!movingNode || !snapEnabled) return { vertical: [], horizontal: [] };

    const otherNodes = nodes.filter(n => n.id !== movingNode.id);
    const vertical = [];
    const horizontal = [];

    const movingRect = {
      left: movingNode.position.x,
      right: movingNode.position.x + 200, // approximate node width
      centerX: movingNode.position.x + 100,
      top: movingNode.position.y,
      bottom: movingNode.position.y + 80, // approximate node height
      centerY: movingNode.position.y + 40
    };

    otherNodes.forEach(node => {
      const rect = {
        left: node.position.x,
        right: node.position.x + 200,
        centerX: node.position.x + 100,
        top: node.position.y,
        bottom: node.position.y + 80,
        centerY: node.position.y + 40
      };

      // Vertical alignment guides
      if (Math.abs(movingRect.left - rect.left) < SNAP_THRESHOLD) {
        vertical.push({ x: rect.left, type: 'align-left' });
      }
      if (Math.abs(movingRect.centerX - rect.centerX) < SNAP_THRESHOLD) {
        vertical.push({ x: rect.centerX, type: 'align-center' });
      }
      if (Math.abs(movingRect.right - rect.right) < SNAP_THRESHOLD) {
        vertical.push({ x: rect.right, type: 'align-right' });
      }

      // Horizontal alignment guides
      if (Math.abs(movingRect.top - rect.top) < SNAP_THRESHOLD) {
        horizontal.push({ y: rect.top, type: 'align-top' });
      }
      if (Math.abs(movingRect.centerY - rect.centerY) < SNAP_THRESHOLD) {
        horizontal.push({ y: rect.centerY, type: 'align-middle' });
      }
      if (Math.abs(movingRect.bottom - rect.bottom) < SNAP_THRESHOLD) {
        horizontal.push({ y: rect.bottom, type: 'align-bottom' });
      }
    });

    return { vertical, horizontal };
  }, [nodes, snapEnabled]);

  // Snap position to grid
  const snapToGrid = useCallback((position) => {
    if (!snapEnabled || !showGrid) return position;
    
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }, [snapEnabled, showGrid, gridSize]);

  // Snap position to guides
  const snapToGuides = useCallback((position) => {
    if (!snapEnabled || guides.vertical.length === 0 && guides.horizontal.length === 0) {
      return position;
    }

    let snappedPosition = { ...position };

    // Check vertical guides
    guides.vertical.forEach(guide => {
      if (Math.abs(position.x - guide.x) < SNAP_THRESHOLD) {
        snappedPosition.x = guide.x;
      }
    });

    // Check horizontal guides
    guides.horizontal.forEach(guide => {
      if (Math.abs(position.y - guide.y) < SNAP_THRESHOLD) {
        snappedPosition.y = guide.y;
      }
    });

    return snappedPosition;
  }, [guides, snapEnabled]);

  // Update guides when selected node moves
  useEffect(() => {
    if (selectedNode) {
      const newGuides = calculateGuides(selectedNode);
      setGuides(newGuides);
    } else {
      setGuides({ vertical: [], horizontal: [] });
    }
  }, [selectedNode, calculateGuides]);

  if (!enabled) return null;

  return (
    <>
      {/* Grid Background */}
      {showGrid && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', zIndex: 0 }}
        >
          <defs>
            <pattern
              id="grid-pattern"
              width={gridSize}
              height={gridSize}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={gridSize} cy={gridSize} r="1" fill={GUIDE_COLORS.grid} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      )}

      {/* Vertical Alignment Guides */}
      {guides.vertical.map((guide, idx) => (
        <div
          key={`v-${idx}`}
          className="absolute pointer-events-none"
          style={{
            left: `${guide.x}px`,
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: GUIDE_COLORS.align,
            zIndex: 1000,
            boxShadow: `0 0 4px ${GUIDE_COLORS.align}`
          }}
        />
      ))}

      {/* Horizontal Alignment Guides */}
      {guides.horizontal.map((guide, idx) => (
        <div
          key={`h-${idx}`}
          className="absolute pointer-events-none"
          style={{
            top: `${guide.y}px`,
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: GUIDE_COLORS.align,
            zIndex: 1000,
            boxShadow: `0 0 4px ${GUIDE_COLORS.align}`
          }}
        />
      ))}

      {/* Controls Toolbar */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-green-200 p-2 flex items-center gap-2 z-50">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded transition ${
            showGrid
              ? 'bg-gold-100 text-gold-700'
              : 'text-primary-600 hover:bg-green-100'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={`p-2 rounded transition ${
            snapEnabled
              ? 'bg-gold-100 text-gold-700'
              : 'text-primary-600 hover:bg-green-100'
          }`}
          title="Toggle Snap"
        >
          <Magnet className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-green-300" />
        <select
          value={gridSize}
          onChange={(e) => setGridSize(parseInt(e.target.value))}
          className="text-xs border border-green-300 rounded px-2 py-1"
          title="Grid Size"
        >
          <option value="10">10px</option>
          <option value="15">15px</option>
          <option value="20">20px</option>
          <option value="25">25px</option>
          <option value="50">50px</option>
        </select>
      </div>
    </>
  );
};

export default EnhancedCanvasGuides;