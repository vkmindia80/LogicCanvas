import React from 'react';
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';

const AnimatedExecutionEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get execution state from data
  const isActive = data?.isActive || false;
  const isCompleted = data?.isCompleted || false;
  const isFailed = data?.isFailed || false;
  const flowCount = data?.flowCount || 0;
  const label = data?.label || '';

  // Determine edge styling based on state
  const getEdgeStyle = () => {
    if (isFailed) {
      return {
        stroke: '#ef4444',
        strokeWidth: 3,
        strokeDasharray: '5,5',
        animation: 'none'
      };
    }
    
    if (isActive) {
      return {
        stroke: '#3b82f6',
        strokeWidth: 4,
        strokeDasharray: '10,5',
        animation: 'flowAnimation 1s linear infinite'
      };
    }
    
    if (isCompleted) {
      return {
        stroke: '#10b981',
        strokeWidth: 3,
        strokeDasharray: 'none',
        animation: 'none'
      };
    }
    
    // Default state
    return {
      stroke: '#94a3b8',
      strokeWidth: 2,
      strokeDasharray: 'none',
      animation: 'none'
    };
  };

  const edgeStyle = getEdgeStyle();

  return (
    <>
      {/* Main Edge Path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: edgeStyle.stroke,
          strokeWidth: edgeStyle.strokeWidth,
          strokeDasharray: edgeStyle.strokeDasharray,
          strokeLinecap: 'round',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Animated Particles for Active Edges */}
      {isActive && (
        <>
          <circle r="3" fill="#3b82f6" className="edge-particle">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="3" fill="#60a5fa" className="edge-particle">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} begin="0.5s" />
          </circle>
        </>
      )}

      {/* Glow Effect for Active/Completed Edges */}
      {(isActive || isCompleted) && (
        <path
          d={edgePath}
          fill="none"
          stroke={isActive ? '#3b82f6' : '#10b981'}
          strokeWidth={edgeStyle.strokeWidth + 4}
          opacity="0.3"
          filter="blur(4px)"
        />
      )}

      {/* Edge Label */}
      <EdgeLabelRenderer>
        {(label || flowCount > 0 || isActive) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className={`
              px-2 py-1 rounded-full text-xs font-semibold
              ${isActive ? 'bg-blue-500 text-white animate-pulse' : ''}
              ${isCompleted ? 'bg-green-100 text-green-700 border border-green-300' : ''}
              ${isFailed ? 'bg-red-100 text-red-700 border border-red-300' : ''}
              ${!isActive && !isCompleted && !isFailed ? 'bg-white text-gray-600 border border-gray-300' : ''}
            `}>
              {label || (flowCount > 0 ? `×${flowCount}` : 'Flow')}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>

      <style jsx>{`
        @keyframes flowAnimation {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -15;
          }
        }
      `}</style>
    </>
  );
};

export default AnimatedExecutionEdge;
