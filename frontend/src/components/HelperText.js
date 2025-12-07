import React from 'react';
import { HelpCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * HelperText Component
 * 
 * A reusable component for displaying contextual help text and tips.
 * Supports multiple types: info, warning, success, error, tip
 * 
 * @param {string} type - Type of helper text
 * @param {string} text - Helper text content
 * @param {React.ReactNode} children - Alternative to text prop
 * @param {boolean} dismissible - Whether the helper text can be dismissed
 */
const HelperText = ({ 
  type = 'info',
  text,
  children,
  dismissible = false,
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (isDismissed) return null;

  const types = {
    info: {
      icon: Info,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500'
    },
    tip: {
      icon: HelpCircle,
      bgColor: 'bg-gold-50',
      borderColor: 'border-gold-200',
      textColor: 'text-gold-800',
      iconColor: 'text-gold-500'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      iconColor: 'text-amber-500'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500'
    },
    error: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500'
    }
  };

  const config = types[type] || types.info;
  const Icon = config.icon;

  return (
    <div 
      className={`
        ${config.bgColor} 
        ${config.borderColor} 
        ${config.textColor}
        border rounded-lg p-4 flex items-start space-x-3
        ${className}
      `}
    >
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 text-sm leading-relaxed">
        {text || children}
      </div>
      {dismissible && (
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * InlineHelperText - Compact version for inline use
 */
export const InlineHelperText = ({ text, type = 'info' }) => {
  const colors = {
    info: 'text-green-600',
    tip: 'text-gold-600',
    warning: 'text-amber-600',
    success: 'text-green-600',
    error: 'text-red-600'
  };

  return (
    <span className={`text-xs ${colors[type]} flex items-center space-x-1`}>
      <HelpCircle className="w-3 h-3" />
      <span>{text}</span>
    </span>
  );
};

export default HelperText;
