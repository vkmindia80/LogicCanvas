import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from 'reactflow';

const DeletableEdge = (props) => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style } = props;
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  });

  const handleDelete = (event) => {
    event.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all'
          }}
          className="nodrag nopan"
        >
          <button
            onClick={handleDelete}
            className="bg-white text-slate-600 border border-slate-300 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            data-testid={`edge-delete-${id}`}
            title="Delete connection"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default DeletableEdge;
