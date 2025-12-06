import React, { useState } from 'react';
import { ChevronRight, ChevronDown, HelpCircle, Sparkles, Info } from 'lucide-react';
import Tooltip from './Tooltip';

/**
 * Smart Node Configuration Panel with Progressive Disclosure
 * Shows basic config by default, advanced settings on demand
 */
const SmartNodeConfigPanel = ({ node, nodeType, config, onChange }) => {
  const [expandedSections, setExpandedSections] = useState({ basic: true });
  const [showAIAssist, setShowAIAssist] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFieldChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  // Configuration organized by complexity
  const sections = {
    basic: {
      title: 'Basic Configuration',
      icon: '📝',
      fields: ['label', 'description']
    },
    advanced: {
      title: 'Advanced Settings',
      icon: '⚙️',
      fields: ['timeout', 'retryCount', 'errorHandling']
    },
    validation: {
      title: 'Validation Rules',
      icon: '✔️',
      fields: ['required', 'validationRules']
    },
    notifications: {
      title: 'Notifications',
      icon: '🔔',
      fields: ['notifyOnComplete', 'notifyOnError', 'recipients']
    }
  };

  const getFieldComponent = (field, value) => {
    const fieldMeta = getFieldMetadata(field);
    
    switch (fieldMeta.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={fieldMeta.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={fieldMeta.placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field, parseInt(e.target.value))}
            placeholder={fieldMeta.placeholder}
            min={fieldMeta.min}
            max={fieldMeta.max}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {fieldMeta.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field, e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">{fieldMeta.label}</span>
          </label>
        );
      default:
        return null;
    }
  };

  const getFieldMetadata = (field) => {
    const metadata = {
      label: { type: 'text', label: 'Node Label', placeholder: 'Enter a descriptive name', help: 'A short, clear name for this step' },
      description: { type: 'textarea', label: 'Description', placeholder: 'Describe what this node does', help: 'Detailed explanation of this step\'s purpose' },
      timeout: { type: 'number', label: 'Timeout (seconds)', placeholder: '30', min: 1, max: 3600, help: 'How long to wait before timing out' },
      retryCount: { type: 'number', label: 'Retry Attempts', placeholder: '3', min: 0, max: 10, help: 'Number of times to retry on failure' },
      errorHandling: { 
        type: 'select',
        label: 'Error Handling',
        options: [
          { value: 'fail', label: 'Fail Workflow' },
          { value: 'continue', label: 'Continue Anyway' },
          { value: 'skip', label: 'Skip This Step' },
          { value: 'retry', label: 'Retry with Backoff' }
        ],
        help: 'What to do when this node fails'
      },
      required: { type: 'checkbox', label: 'This step is required', help: 'Workflow cannot complete without this step' },
      notifyOnComplete: { type: 'checkbox', label: 'Notify when complete', help: 'Send notification upon successful completion' },
      notifyOnError: { type: 'checkbox', label: 'Notify on errors', help: 'Send notification if this step fails' }
    };
    return metadata[field] || { type: 'text', label: field, placeholder: '' };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with AI Assist */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Configure {nodeType}</h3>
            <p className="text-xs text-gray-600 mt-0.5">Customize this node's behavior</p>
          </div>
          <Tooltip content="Get AI suggestions for configuration">
            <button
              onClick={() => setShowAIAssist(!showAIAssist)}
              className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-purple-700 font-medium">AI Assist</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {showAIAssist && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 text-sm">AI Configuration Suggestions</p>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li>• Recommended timeout: 30 seconds for API calls</li>
                <li>• Enable retries (3 attempts) for reliability</li>
                <li>• Add error notifications for critical steps</li>
              </ul>
              <button className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">
                Apply all suggestions →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Sections */}
      <div className="divide-y divide-gray-200">
        {Object.entries(sections).map(([key, section]) => (
          <div key={key}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(key)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-2">
                {expandedSections[key] ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-lg">{section.icon}</span>
                <span className="font-medium text-gray-900 text-sm">{section.title}</span>
              </div>
              {key !== 'basic' && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Optional
                </span>
              )}
            </button>

            {/* Section Content */}
            {expandedSections[key] && (
              <div className="px-4 pb-4 space-y-4">
                {section.fields.map(field => {
                  const fieldMeta = getFieldMetadata(field);
                  return (
                    <div key={field}>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-sm font-medium text-gray-700">
                          {fieldMeta.label}
                        </label>
                        {fieldMeta.help && (
                          <Tooltip content={fieldMeta.help}>
                            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                          </Tooltip>
                        )}
                      </div>
                      {getFieldComponent(field, config[field])}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5" />
          <p className="text-xs text-gray-600">
            <strong>Tip:</strong> Only configure what you need. Default values work for most cases.
            Use advanced settings when you need fine-grained control.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SmartNodeConfigPanel;