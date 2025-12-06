import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * FormValidator - Real-time form validation with helpful feedback
 * Provides inline validation messages and quick-fix suggestions
 */

// Validation rules
export const validators = {
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return {
        valid: false,
        message: `${fieldName} is required`,
        severity: 'error',
        quickFix: 'Please enter a value'
      };
    }
    return { valid: true };
  },

  url: (value, fieldName = 'URL') => {
    if (!value) return { valid: true };
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(value)) {
      return {
        valid: false,
        message: `${fieldName} must be a valid URL`,
        severity: 'error',
        quickFix: 'URLs should start with http:// or https://',
        example: 'https://api.example.com'
      };
    }
    return { valid: true };
  },

  email: (value, fieldName = 'Email') => {
    if (!value) return { valid: true };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return {
        valid: false,
        message: `${fieldName} must be a valid email address`,
        severity: 'error',
        quickFix: 'Format: user@example.com'
      };
    }
    return { valid: true };
  },

  expression: (value, fieldName = 'Expression') => {
    if (!value) return { valid: true };
    
    // Basic expression validation
    const issues = [];
    
    // Check for unmatched brackets
    const openBrackets = (value.match(/\(/g) || []).length;
    const closeBrackets = (value.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push('Unmatched parentheses');
    }

    // Check for incomplete variable syntax
    if (value.includes('${') && !value.includes('}')) {
      issues.push('Incomplete variable syntax ${variable}');
    }

    // Check for common typos
    if (value.includes('=') && !value.includes('==') && !value.includes('!=') && !value.includes('>=') && !value.includes('<=')) {
      issues.push('Use == for comparison, not =');
    }

    if (issues.length > 0) {
      return {
        valid: false,
        message: `${fieldName} has syntax errors`,
        severity: 'error',
        quickFix: issues.join(', ')
      };
    }

    return { valid: true };
  },

  json: (value, fieldName = 'JSON') => {
    if (!value) return { valid: true };
    try {
      JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: `${fieldName} contains invalid JSON`,
        severity: 'error',
        quickFix: error.message,
        example: '{"key": "value"}'
      };
    }
  },

  minLength: (min) => (value, fieldName = 'Field') => {
    if (!value) return { valid: true };
    if (value.length < min) {
      return {
        valid: false,
        message: `${fieldName} must be at least ${min} characters`,
        severity: 'warning',
        quickFix: `Current: ${value.length}, required: ${min}`
      };
    }
    return { valid: true };
  },

  maxLength: (max) => (value, fieldName = 'Field') => {
    if (!value) return { valid: true };
    if (value.length > max) {
      return {
        valid: false,
        message: `${fieldName} must be at most ${max} characters`,
        severity: 'warning',
        quickFix: `Current: ${value.length}, maximum: ${max}`
      };
    }
    return { valid: true };
  },

  number: (value, fieldName = 'Number') => {
    if (!value) return { valid: true };
    if (isNaN(value)) {
      return {
        valid: false,
        message: `${fieldName} must be a valid number`,
        severity: 'error',
        quickFix: 'Enter only numeric values'
      };
    }
    return { valid: true };
  },

  range: (min, max) => (value, fieldName = 'Number') => {
    if (!value) return { valid: true };
    const num = parseFloat(value);
    if (num < min || num > max) {
      return {
        valid: false,
        message: `${fieldName} must be between ${min} and ${max}`,
        severity: 'error',
        quickFix: `Value ${num} is out of range`
      };
    }
    return { valid: true };
  },

  csvEmails: (value, fieldName = 'Emails') => {
    if (!value) return { valid: true };
    const emails = value.split(',').map(e => e.trim());
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => email && !emailPattern.test(email));
    
    if (invalidEmails.length > 0) {
      return {
        valid: false,
        message: `${fieldName} contains invalid email addresses`,
        severity: 'error',
        quickFix: `Invalid: ${invalidEmails.join(', ')}`,
        example: 'user1@example.com, user2@example.com'
      };
    }
    return { valid: true };
  }
};

// Validation feedback component
export const ValidationFeedback = ({ validation, className = '' }) => {
  if (!validation || validation.valid) {
    return null;
  }

  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    error: 'red',
    warning: 'amber',
    info: 'blue'
  };

  const Icon = icons[validation.severity] || AlertCircle;
  const color = colors[validation.severity] || 'red';

  return (
    <div className={`mt-2 ${className}`}>
      <div className={`flex items-start space-x-2 p-2 bg-${color}-50 border border-${color}-200 rounded-lg`}>
        <Icon className={`w-4 h-4 text-${color}-600 mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-xs font-semibold text-${color}-900`}>
            {validation.message}
          </p>
          {validation.quickFix && (
            <p className={`text-xs text-${color}-700 mt-1`}>
              💡 {validation.quickFix}
            </p>
          )}
          {validation.example && (
            <code className={`block text-xs font-mono bg-${color}-100 text-${color}-800 px-2 py-1 rounded mt-1`}>
              {validation.example}
            </code>
          )}
        </div>
      </div>
    </div>
  );
};

// Success feedback component
export const SuccessFeedback = ({ message, className = '' }) => {
  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <p className="text-xs font-medium text-green-800">
          {message || 'Valid'}
        </p>
      </div>
    </div>
  );
};

// Validate multiple fields
export const validateForm = (fields) => {
  const results = {};
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, { value, validators: fieldValidators }]) => {
    for (const validator of fieldValidators) {
      const result = validator(value, fieldName);
      if (!result.valid) {
        results[fieldName] = result;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  });

  return { isValid, results };
};

export default { validators, ValidationFeedback, SuccessFeedback, validateForm };
