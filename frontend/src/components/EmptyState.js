import React from 'react';

/**
 * EmptyState Component
 * 
 * A reusable component for displaying helpful empty states throughout the application.
 * Includes icons, titles, descriptions, and optional actions.
 * 
 * @param {string} icon - Lucide icon component to display
 * @param {string} title - Main heading text
 * @param {string} description - Supporting description text
 * @param {React.ReactNode} action - Optional action button/element
 * @param {string} illustration - Optional illustration URL
 */
const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  illustration,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-6 w-full max-w-md">
          <img 
            src={illustration} 
            alt={title} 
            className="w-full h-auto opacity-80"
          />
        </div>
      ) : Icon ? (
        <div className="mb-6">
          <div className="relative">
            {/* Background circle with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full blur-2xl opacity-50"></div>
            {/* Icon container */}
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-full p-6 shadow-xl shadow-slate-200/50">
              <Icon className="w-16 h-16 text-slate-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Title */}
      <h3 className="mb-3 text-2xl font-bold text-slate-900">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-base text-slate-600 leading-relaxed">
        {description}
      </p>

      {/* Action */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
