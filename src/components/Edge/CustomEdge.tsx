import React, { memo } from 'react';
import { 
  getBezierPath, 
  BaseEdge, 
  EdgeLabelRenderer,
  EdgeProps
} from 'reactflow';

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  label,
  labelStyle,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#f43f5e' : style?.stroke || '#6366f1',
          strokeWidth: 2,
          transition: 'stroke 0.2s ease',
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              fontWeight: 700,
              pointerEvents: 'all',
              ...labelStyle,
            }}
            className="nodrag nopan bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm text-slate-600"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';
