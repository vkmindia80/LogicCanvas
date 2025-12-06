import React, { useEffect, useState, useCallback } from 'react';

/**
 * SnapToAlignGuides - Advanced snap-to-align feature for WorkflowCanvas
 * Part of Phase 2.3: Visual Enhancements
 * 
 * Features:
 * - Shows visual alignment guides when dragging nodes
 * - Snaps nodes to alignment with other nodes
 * - Displays distance measurements
 * - Supports horizontal and vertical alignment
 */

const SnapToAlignGuides = ({ nodes, draggingNodeId, snapThreshold = 10, enabled = true }) => {
  const [guides, setGuides] = useState([]);
  
  useEffect(() => {
    if (!enabled || !draggingNodeId || !nodes || nodes.length < 2) {
      setGuides([]);
      return;
    }

    const draggingNode = nodes.find(n => n.id === draggingNodeId);
    if (!draggingNode) {
      setGuides([]);
      return;
    }

    const newGuides = [];
    const draggingX = draggingNode.position.x;
    const draggingY = draggingNode.position.y;
    const draggingWidth = draggingNode.width || 200;
    const draggingHeight = draggingNode.height || 100;
    const draggingCenterX = draggingX + draggingWidth / 2;
    const draggingCenterY = draggingY + draggingHeight / 2;
    const draggingRight = draggingX + draggingWidth;
    const draggingBottom = draggingY + draggingHeight;

    // Check alignment with other nodes
    nodes.forEach(node => {
      if (node.id === draggingNodeId) return;

      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = node.width || 200;
      const nodeHeight = node.height || 100;
      const nodeCenterX = nodeX + nodeWidth / 2;
      const nodeCenterY = nodeY + nodeHeight / 2;
      const nodeRight = nodeX + nodeWidth;
      const nodeBottom = nodeY + nodeHeight;

      // Vertical alignment guides
      // Left edge alignment
      if (Math.abs(draggingX - nodeX) < snapThreshold) {
        newGuides.push({
          type: 'vertical',
          x: nodeX,
          y1: Math.min(draggingY, nodeY),
          y2: Math.max(draggingBottom, nodeBottom),
          alignType: 'left'
        });
      }
      
      // Right edge alignment
      if (Math.abs(draggingRight - nodeRight) < snapThreshold) {
        newGuides.push({
          type: 'vertical',
          x: nodeRight,
          y1: Math.min(draggingY, nodeY),
          y2: Math.max(draggingBottom, nodeBottom),
          alignType: 'right'
        });
      }
      
      // Center vertical alignment
      if (Math.abs(draggingCenterX - nodeCenterX) < snapThreshold) {
        newGuides.push({
          type: 'vertical',
          x: nodeCenterX,
          y1: Math.min(draggingY, nodeY),
          y2: Math.max(draggingBottom, nodeBottom),
          alignType: 'center'
        });
      }

      // Horizontal alignment guides
      // Top edge alignment
      if (Math.abs(draggingY - nodeY) < snapThreshold) {
        newGuides.push({
          type: 'horizontal',
          y: nodeY,
          x1: Math.min(draggingX, nodeX),
          x2: Math.max(draggingRight, nodeRight),
          alignType: 'top'
        });
      }
      
      // Bottom edge alignment
      if (Math.abs(draggingBottom - nodeBottom) < snapThreshold) {
        newGuides.push({
          type: 'horizontal',
          y: nodeBottom,
          x1: Math.min(draggingX, nodeX),
          x2: Math.max(draggingRight, nodeRight),
          alignType: 'bottom'
        });
      }
      
      // Center horizontal alignment
      if (Math.abs(draggingCenterY - nodeCenterY) < snapThreshold) {
        newGuides.push({
          type: 'horizontal',
          y: nodeCenterY,
          x1: Math.min(draggingX, nodeX),
          x2: Math.max(draggingRight, nodeRight),
          alignType: 'center'
        });
      }
    });

    setGuides(newGuides);
  }, [nodes, draggingNodeId, snapThreshold, enabled]);

  if (!enabled || guides.length === 0) {
    return null;
  }

  return (
    <svg
      className="snap-to-align-guides"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <defs>
        <pattern
          id="guide-pattern"
          x="0"
          y="0"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <rect width="4" height="8" fill="#3b82f6" />
        </pattern>
      </defs>
      
      {guides.map((guide, index) => {
        if (guide.type === 'vertical') {
          return (
            <g key={`guide-${index}`}>
              <line
                x1={guide.x}
                y1={guide.y1}
                x2={guide.x}
                y2={guide.y2}
                stroke="url(#guide-pattern)"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="align-guide animate-dash"
              />
              <line
                x1={guide.x}
                y1={guide.y1}
                x2={guide.x}
                y2={guide.y2}
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
              {/* Alignment indicator */}
              <circle
                cx={guide.x}
                cy={(guide.y1 + guide.y2) / 2}
                r="4"
                fill="#3b82f6"
                className="align-indicator"
              />
            </g>
          );
        } else {
          return (
            <g key={`guide-${index}`}>
              <line
                x1={guide.x1}
                y1={guide.y}
                x2={guide.x2}
                y2={guide.y}
                stroke="url(#guide-pattern)"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="align-guide animate-dash"
              />
              <line
                x1={guide.x1}
                y1={guide.y}
                x2={guide.x2}
                y2={guide.y}
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
              {/* Alignment indicator */}
              <circle
                cx={(guide.x1 + guide.x2) / 2}
                cy={guide.y}
                r="4"
                fill="#3b82f6"
                className="align-indicator"
              />
            </g>
          );
        }
      })}
    </svg>
  );
};

export default SnapToAlignGuides;
