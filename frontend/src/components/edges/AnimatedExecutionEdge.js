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
  markerEnd,
  label
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // PHASE 1: Enhanced execution state with color-coding
  const isActive = data?.isActive || false;
  const isCompleted = data?.isCompleted || false;
  const isFailed = data?.isFailed || false;
  const isRetrying = data?.isRetrying || false;
  const flowCount = data?.flowCount || 0;
  const executionOrder = data?.executionOrder || null;
  const branchType = data?.branchType || null; // 'success', 'error', 'yes', 'no', 'default'
  const edgeLabel = label || data?.label || '';

  // PHASE 1: Color-coded branch paths
  const getBranchColor = () => {
    if (branchType === 'success' || branchType === 'yes') return '#10b981';
    if (branchType === 'error' || branchType === 'no') return '#ef4444';
    if (branchType === 'retry') return '#f97316';
    return '#94a3b8';
  };

  // Determine edge styling based on state
  const getEdgeStyle = () => {
    if (isFailed) {
      return {
        stroke: '#ef4444',
        strokeWidth: 3,
        strokeDasharray: '5,5',
        animation: 'failPulse 1.5s ease-in-out infinite',
        glowColor: '#ef4444',
        glowOpacity: 0.4
      };
    }
    
    if (isRetrying) {
      return {
        stroke: '#f97316',
        strokeWidth: 3.5,
        strokeDasharray: '8,4',
        animation: 'retryFlow 1s linear infinite',
        glowColor: '#f97316',
        glowOpacity: 0.5
      };
    }
    
    if (isActive) {
      return {
        stroke: '#3b82f6',
        strokeWidth: 4,
        strokeDasharray: '10,5',
        animation: 'activeFlow 1s linear infinite',
        glowColor: '#3b82f6',
        glowOpacity: 0.6
      };
    }
    
    if (isCompleted) {
      return {
        stroke: '#10b981',
        strokeWidth: 3,
        strokeDasharray: 'none',
        animation: 'none',
        glowColor: '#10b981',
        glowOpacity: 0.3
      };
    }
    
    // Default state - use branch color
    const branchColor = getBranchColor();
    return {
      stroke: branchColor,
      strokeWidth: 2,
      strokeDasharray: 'none',
      animation: 'none',
      glowColor: branchColor,
      glowOpacity: 0.1
    };
  };

  const edgeStyle = getEdgeStyle();

  // Get particle color based on state
  const getParticleColor = () => {
    if (isRetrying) return '#f97316';
    if (isActive) return '#3b82f6';
    return '#6366f1';
  };

  return (
    <>
      {/* Glow Effect Layer */}
      {(isActive || isCompleted || isFailed || isRetrying) && (
        <path
          d={edgePath}
          fill="none"
          stroke={edgeStyle.glowColor}
          strokeWidth={edgeStyle.strokeWidth + 6}
          opacity={edgeStyle.glowOpacity}
          filter="blur(6px)"
        />
      )}

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
          strokeLinejoin: 'round',
          transition: 'all 0.3s ease',
        }}
      />

      {/* PHASE 1: Animated Flow Particles */}
      {isActive && (
        <>
          {/* Primary particle */}
          <circle r="4" fill={getParticleColor()} className="edge-particle">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
          </circle>
          {/* Secondary particle */}
          <circle r="3" fill="#60a5fa" className="edge-particle" opacity="0.8">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} begin="0.5s" />
          </circle>
          {/* Tertiary particle */}
          <circle r="2" fill="#93c5fd" className="edge-particle" opacity="0.6">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} begin="1s" />
          </circle>
        </>
      )}

      {/* Retry particles - faster and orange */}
      {isRetrying && (
        <>
          <circle r="3.5" fill="#f97316" className="edge-particle">
            <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="3" fill="#fb923c" className="edge-particle" opacity="0.8">
            <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} begin="0.3s" />
          </circle>
        </>
      )}

      {/* Failed pulse effect */}
      {isFailed && (
        <circle r="5" fill="#ef4444" opacity="0.4">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Completion sparkle effect */}
      {isCompleted && (
        <>
          <circle r="2" fill="#10b981" opacity="0.8">
            <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="1.5" fill="#34d399" opacity="0.6">
            <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} begin="1s" />
          </circle>
        </>
      )}

      {/* Edge Label with Enhanced Styling */}
      <EdgeLabelRenderer>
        {(edgeLabel || flowCount > 0 || executionOrder !== null || isActive || isRetrying) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className={`
              px-2.5 py-1 rounded-full text-xs font-bold shadow-lg border-2 backdrop-blur-sm
              transition-all duration-300
              ${isActive ? 'bg-blue-500 text-white border-blue-300 animate-pulse scale-110' : ''}
              ${isRetrying ? 'bg-orange-500 text-white border-orange-300 animate-pulse' : ''}
              ${isCompleted ? 'bg-green-500/90 text-white border-green-300' : ''}
              ${isFailed ? 'bg-red-500/90 text-white border-red-300' : ''}
              ${!isActive && !isCompleted && !isFailed && !isRetrying ? 'bg-white/90 text-gray-700 border-gray-300' : ''}
            `}>
              {/* Execution Order Badge */}
              {executionOrder !== null && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs font-bold mr-1">
                  {executionOrder}
                </span>
              )}
              
              {/* Label or Flow Count */}
              {edgeLabel || (flowCount > 0 ? `×${flowCount}` : isActive ? '▶' : isRetrying ? '↻' : '')}
              
              {/* Branch Type Indicator */}
              {branchType && !edgeLabel && (
                <span className="ml-1 text-xs">
                  {branchType === 'success' || branchType === 'yes' ? '✓' : ''}
                  {branchType === 'error' || branchType === 'no' ? '✗' : ''}
                  {branchType === 'retry' ? '↻' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>

      {/* PHASE 1: Animation Styles */}
      <style jsx>{`
        @keyframes activeFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -15; }
        }
        
        @keyframes retryFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -12; }
        }
        
        @keyframes failPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .edge-particle {
          filter: drop-shadow(0 0 3px currentColor);
        }
      `}</style>
    </>
  );
};

export default AnimatedExecutionEdge;
