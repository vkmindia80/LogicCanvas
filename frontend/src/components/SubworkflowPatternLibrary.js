import React, { useState } from 'react';
import { X, Copy, Layers, CheckCircle, Users, Mail, Database, Clock, AlertTriangle } from 'lucide-react';

// Reusable sub-workflow patterns
const PATTERNS = [
  {
    id: 'approval-chain',
    name: 'Multi-Level Approval Chain',
    description: 'Sequential approvals with escalation logic',
    category: 'Approval Patterns',
    icon: CheckCircle,
    complexity: 'simple',
    useCases: ['Document approval', 'Budget approval', 'Contract review'],
    pattern: {
      nodes: [
        { type: 'approval', label: 'Level 1 Approval', config: { approval_type: 'single' } },
        { type: 'decision', label: 'Approved?', config: { condition: '${approved === true}' } },
        { type: 'approval', label: 'Level 2 Approval', config: { approval_type: 'single' } },
        { type: 'decision', label: 'Final Approved?', config: { condition: '${approved === true}' } }
      ],
      description: 'Connect these nodes in sequence with rejection paths returning to start'
    }
  },
  {
    id: 'parallel-approval',
    name: 'Parallel Approval',
    description: 'Multiple approvers review simultaneously',
    category: 'Approval Patterns',
    icon: Users,
    complexity: 'medium',
    useCases: ['Cross-functional review', 'Committee approval', 'Stakeholder sign-off'],
    pattern: {
      nodes: [
        { type: 'parallel', label: 'Split for Review', config: {} },
        { type: 'approval', label: 'Finance Approval', config: { approvers: ['finance-team'] } },
        { type: 'approval', label: 'Legal Approval', config: { approvers: ['legal-team'] } },
        { type: 'approval', label: 'Operations Approval', config: { approvers: ['ops-team'] } },
        { type: 'merge', label: 'Combine Results', config: {} },
        { type: 'decision', label: 'All Approved?', config: { condition: '${allApproved === true}' } }
      ],
      description: 'Parallel node splits to multiple approvers, merge waits for all, decision checks unanimous approval'
    }
  },
  {
    id: 'email-notification',
    name: 'Email Notification Pattern',
    description: 'Send email with dynamic content and attachments',
    category: 'Communication',
    icon: Mail,
    complexity: 'simple',
    useCases: ['Status updates', 'Alerts', 'Reports'],
    pattern: {
      nodes: [
        { type: 'assignment', label: 'Prepare Email Data', config: { assignments: [{ variable: 'emailBody', value: 'Template content' }] } },
        { type: 'action', label: 'Send Email', config: { action_type: 'webhook', url: 'https://api.email-service.com/send' } },
        { type: 'decision', label: 'Email Sent?', config: { condition: '${emailSent === true}' } }
      ],
      description: 'Prepare email content with variables, send via webhook, check delivery status'
    }
  },
  {
    id: 'data-validation',
    name: 'Data Validation & Cleansing',
    description: 'Validate and clean input data before processing',
    category: 'Data Processing',
    icon: Database,
    complexity: 'medium',
    useCases: ['Form validation', 'Data import', 'API input validation'],
    pattern: {
      nodes: [
        { type: 'assignment', label: 'Extract Fields', config: {} },
        { type: 'decision', label: 'Required Fields Present?', config: { condition: '${hasRequiredFields === true}' } },
        { type: 'assignment', label: 'Clean & Format Data', config: {} },
        { type: 'decision', label: 'Data Valid?', config: { condition: '${isValid === true}' } }
      ],
      description: 'Extract data, check required fields, clean/format, validate business rules'
    }
  },
  {
    id: 'retry-with-backoff',
    name: 'Retry with Exponential Backoff',
    description: 'Retry failed operations with increasing delays',
    category: 'Error Handling',
    icon: AlertTriangle,
    complexity: 'medium',
    useCases: ['API calls', 'External system integration', 'Transient failures'],
    pattern: {
      nodes: [
        { type: 'assignment', label: 'Set Retry Count', config: { assignments: [{ variable: 'retryCount', value: '0' }] } },
        { type: 'action', label: 'Execute Operation', config: {} },
        { type: 'decision', label: 'Success?', config: { condition: '${success === true}' } },
        { type: 'decision', label: 'Max Retries Reached?', config: { condition: '${retryCount >= 3}' } },
        { type: 'timer', label: 'Wait Before Retry', config: { delay_seconds: 300 } },
        { type: 'assignment', label: 'Increment Retry Count', config: { assignments: [{ variable: 'retryCount', value: '${retryCount + 1}' }] } }
      ],
      description: 'Try operation, if fails check retry count, wait with timer, increment counter, retry. Loop back to operation.'
    }
  },
  {
    id: 'scheduled-task',
    name: 'Scheduled Task Execution',
    description: 'Execute task at specific time or after delay',
    category: 'Timing',
    icon: Clock,
    complexity: 'simple',
    useCases: ['Delayed notifications', 'Scheduled reports', 'Time-based triggers'],
    pattern: {
      nodes: [
        { type: 'timer', label: 'Wait Until Scheduled Time', config: { delay_seconds: 86400 } },
        { type: 'task', label: 'Execute Scheduled Task', config: {} },
        { type: 'action', label: 'Send Completion Notification', config: {} }
      ],
      description: 'Wait using timer node, execute task, send notification'
    }
  },
  {
    id: 'batch-processing',
    name: 'Batch Data Processing',
    description: 'Process collections of items with loop',
    category: 'Data Processing',
    icon: Database,
    complexity: 'medium',
    useCases: ['Bulk updates', 'Data migration', 'Report generation'],
    pattern: {
      nodes: [
        { type: 'lookup_record', label: 'Get Items to Process', config: {} },
        { type: 'loop_for_each', label: 'For Each Item', config: {} },
        { type: 'assignment', label: 'Process Item', config: {} },
        { type: 'update_record', label: 'Update Record', config: {} },
        { type: 'assignment', label: 'Aggregate Results', config: {} }
      ],
      description: 'Lookup items, loop through each, process and update, aggregate results after loop'
    }
  },
  {
    id: 'conditional-routing',
    name: 'Complex Conditional Routing',
    description: 'Route based on multiple conditions using switch',
    category: 'Logic',
    icon: Layers,
    complexity: 'medium',
    useCases: ['Priority routing', 'Category-based assignment', 'Risk assessment'],
    pattern: {
      nodes: [
        { type: 'assignment', label: 'Calculate Priority Score', config: {} },
        { type: 'switch', label: 'Route by Priority', config: { cases: [
          { value: 'critical', label: 'Critical' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' }
        ]}},
        { type: 'task', label: 'Immediate Action', config: { sla_hours: 1 } },
        { type: 'task', label: 'High Priority', config: { sla_hours: 4 } },
        { type: 'task', label: 'Normal Priority', config: { sla_hours: 24 } },
        { type: 'task', label: 'Low Priority', config: { sla_hours: 72 } }
      ],
      description: 'Calculate score, use switch for multi-way routing, connect to appropriate handlers'
    }
  }
];

const SubworkflowPatternLibrary = ({ isOpen, onClose, onUsePattern }) => {
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [...new Set(PATTERNS.map(p => p.category))];

  const filteredPatterns = selectedCategory === 'all' 
    ? PATTERNS 
    : PATTERNS.filter(p => p.category === selectedCategory);

  const complexityColors = {
    'simple': 'bg-green-100 text-green-800',
    'medium': 'bg-gold-100 text-gold-800',
    'complex': 'bg-gold-100 text-gold-800'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-green-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Layers className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Sub-workflow Pattern Library</h2>
                <p className="text-cyan-100 text-sm">Reusable workflow components and best practices</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-pattern-library"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              All Patterns ({PATTERNS.length})
            </button>
            {categories.map(category => {
              const count = PATTERNS.filter(p => p.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Patterns Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatterns.map(pattern => {
              const IconComponent = pattern.icon;
              return (
                <div
                  key={pattern.id}
                  className="border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden bg-white"
                  data-testid={`pattern-${pattern.id}`}
                >
                  {/* Pattern Header */}
                  <div className="bg-gradient-to-r from-cyan-500 to-green-500 p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{pattern.name}</h3>
                          <p className="text-xs text-cyan-100">{pattern.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pattern Body */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pattern.description}</p>

                    {/* Complexity Badge */}
                    <div className="mb-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${complexityColors[pattern.complexity]}`}>
                        {pattern.complexity.charAt(0).toUpperCase() + pattern.complexity.slice(1)}
                      </span>
                    </div>

                    {/* Use Cases */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Use Cases:</p>
                      <div className="flex flex-wrap gap-1">
                        {pattern.useCases.slice(0, 3).map((useCase, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPattern(pattern)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        data-testid={`view-${pattern.id}`}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          if (onUsePattern) onUsePattern(pattern);
                          onClose();
                        }}
                        className="flex items-center space-x-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
                        data-testid={`use-${pattern.id}`}
                      >
                        <Copy className="w-4 h-4" />
                        <span>Use</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pattern Details Modal */}
        {selectedPattern && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-600 to-green-600 text-white p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedPattern.name}</h3>
                <button
                  onClick={() => setSelectedPattern(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${complexityColors[selectedPattern.complexity]}`}>
                    {selectedPattern.complexity.charAt(0).toUpperCase() + selectedPattern.complexity.slice(1)} Complexity
                  </span>
                  <span className="ml-2 text-sm text-gray-600">{selectedPattern.category}</span>
                </div>

                <p className="text-gray-700 mb-6">{selectedPattern.description}</p>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Pattern Structure:</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      {selectedPattern.pattern.nodes.map((node, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm text-gray-900">{node.label}</span>
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{node.type}</span>
                            </div>
                            {node.config && Object.keys(node.config).length > 0 && (
                              <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                {JSON.stringify(node.config, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-sm text-gray-700">
                        <strong>Implementation:</strong> {selectedPattern.pattern.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Common Use Cases:</h4>
                  <ul className="space-y-2">
                    {selectedPattern.useCases.map((useCase, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedPattern(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (onUsePattern) onUsePattern(selectedPattern);
                      setSelectedPattern(null);
                      onClose();
                    }}
                    className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Use This Pattern</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubworkflowPatternLibrary;
