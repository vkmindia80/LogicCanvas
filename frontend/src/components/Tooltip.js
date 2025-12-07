import React, { useState } from 'react';

/**
 * Tooltip Component
 * 
 * A reusable tooltip wrapper that shows helpful information on hover.
 * Supports multiple positions and custom styling.
 * 
 * @param {React.ReactNode} children - Element to attach tooltip to
 * @param {string} content - Tooltip text content
 * @param {string} position - Tooltip position: 'top', 'bottom', 'left', 'right'
 * @param {boolean} disabled - Whether to disable tooltip
 */
const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  disabled = false,
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  if (!content || disabled) {
    return children;
  }

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-primary-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-primary-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-primary-900'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} animate-in fade-in-0 zoom-in-95 duration-200`}
          style={{ pointerEvents: 'none' }}
        >
          {/* Tooltip Content */}
          <div className="relative">
            <div className="bg-primary-900 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-xl max-w-xs whitespace-normal">
              {content}
            </div>
            {/* Arrow */}
            <div 
              className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
