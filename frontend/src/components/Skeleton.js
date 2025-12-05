import React from 'react';

/**
 * Skeleton Component
 * 
 * A reusable skeleton loader for content placeholders.
 * Provides multiple variants for different content types.
 * 
 * @param {string} variant - Skeleton type: 'text', 'title', 'avatar', 'rectangle', 'card'
 * @param {number} count - Number of skeleton elements (for text)
 * @param {string} className - Additional CSS classes
 */
const Skeleton = ({ 
  variant = 'text',
  count = 1,
  className = '',
  width,
  height
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded';
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    circle: 'rounded-full',
    rectangle: 'h-32 w-full',
    card: 'h-64 w-full',
    button: 'h-10 w-32'
  };

  const variantClass = variants[variant] || variants.text;
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (variant === 'text' && count > 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className={`${baseClasses} ${variantClass}`}
            style={{
              ...style,
              width: i === count - 1 ? '60%' : style.width || '100%'
            }}
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div 
      className={`${baseClasses} ${variantClass} ${className}`}
      style={style}
    ></div>
  );
};

/**
 * SkeletonCard - Pre-built skeleton for card layouts
 */
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`rounded-2xl border-2 border-slate-200 bg-white p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="title" width="60%" />
        <Skeleton variant="circle" width="60px" height="24px" />
      </div>
      <Skeleton variant="text" count={2} className="mb-4" />
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton width="80px" height="16px" />
        <Skeleton width="100px" height="16px" />
      </div>
      <div className="flex space-x-2">
        <Skeleton variant="button" className="flex-1" />
        <Skeleton variant="button" className="flex-1" />
      </div>
    </div>
  );
};

/**
 * SkeletonList - Pre-built skeleton for list items
 */
export const SkeletonList = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-slate-200">
          <Skeleton variant="avatar" />
          <div className="flex-1">
            <Skeleton width="40%" height="20px" className="mb-2" />
            <Skeleton variant="text" count={1} width="80%" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
