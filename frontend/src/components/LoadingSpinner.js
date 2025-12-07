import React from 'react';

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner with multiple sizes and styles.
 * 
 * @param {string} size - Size: 'sm', 'md', 'lg', 'xl'
 * @param {string} color - Color: 'primary', 'white', 'slate'
 * @param {string} text - Optional loading text
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  text = '',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  };

  const colorClasses = {
    primary: 'border-primary-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    slate: 'border-slate-500 border-t-transparent',
    blue: 'border-green-500 border-t-transparent',
    green: 'border-green-500 border-t-transparent'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const spinner = (
    <>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}></div>
      {text && (
        <p className={`mt-3 font-medium text-slate-600 ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center">
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
