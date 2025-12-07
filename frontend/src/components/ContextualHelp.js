import React, { useState } from 'react';
import { HelpCircle, X, Lightbulb, CheckCircle2, AlertCircle, Info } from 'lucide-react';

/**
 * Contextual Help Component
 * Provides inline help, tooltips, and guidance for users
 */

// Help content database for different node types and features
const HELP_CONTENT = {
  // Node Types
  start: {
    title: 'Start Node',
    description: 'Every workflow begins here. This is the entry point where execution starts.',
    tips: [
      'A workflow should have exactly one Start node',
      'Configure triggers in the Triggers panel to determine when workflows start',
      'Connect the Start node to the first action in your workflow'
    ],
    examples: ['Manual trigger', 'Scheduled start', 'Webhook trigger']
  },
  task: {
    title: 'Task Node',
    description: 'Assigns work to users or groups. Creates tasks that appear in inboxes.',
    tips: [
      'Choose an assignment strategy: direct, role-based, round-robin, or load-balanced',
      'Set priority and due dates to manage workload',
      'Add clear instructions in the description field'
    ],
    examples: ['Review document', 'Approve request', 'Complete assessment']
  },
  form: {
    title: 'Form Node',
    description: 'Collects data from users through customizable forms.',
    tips: [
      'Select or create a form in the Forms section first',
      'Form data becomes available as workflow variables',
      'Use form validation to ensure data quality'
    ],
    examples: ['Employee information', 'Expense details', 'Feedback survey']
  },
  decision: {
    title: 'Decision Node',
    description: 'Routes workflow based on conditions. Creates branching logic.',
    tips: [
      'Write conditions using workflow variables (e.g., amount > 1000)',
      'Yes path: condition is true, No path: condition is false',
      'Test your conditions before running the workflow'
    ],
    examples: ['If amount > 5000', 'If status === "approved"', 'If days > 30']
  },
  approval: {
    title: 'Approval Node',
    description: 'Requests approval from one or more approvers.',
    tips: [
      'Single: Any one approver can approve',
      'Unanimous: All approvers must approve',
      'Majority: More than 50% must approve',
      'Sequential: Approvers review in order'
    ],
    examples: ['Manager approval', 'Budget approval', 'Contract review']
  },
  action: {
    title: 'Action Node',
    description: 'Executes external actions like API calls, webhooks, or scripts.',
    tips: [
      'Use ${variable} syntax to include workflow data in requests',
      'Test API calls with the Test button before saving',
      'Configure retry logic for reliability'
    ],
    examples: ['Send Slack message', 'Create Salesforce record', 'Call payment API']
  },
  loop_for_each: {
    title: 'For Each Loop',
    description: 'Iterates over a collection, executing nodes for each item.',
    tips: [
      'Provide an array variable to iterate over',
      'Current item is available in loop body',
      'Use to process lists, arrays, or collections'
    ],
    examples: ['Process each invoice', 'Send emails to list', 'Update multiple records']
  },
  subprocess: {
    title: 'Subprocess Node',
    description: 'Executes another workflow as a sub-step.',
    tips: [
      'Reuse common workflow patterns',
      'Pass data using input/output mapping',
      'Monitor sub-workflow execution separately'
    ],
    examples: ['Common approval flow', 'Notification workflow', 'Data validation']
  },
  
  // Features
  validation: {
    title: 'Workflow Validation',
    description: 'Checks your workflow for errors and potential issues before execution.',
    tips: [
      'Run validation before publishing workflows',
      'Fix all errors (red) before running',
      'Consider warnings (yellow) for best practices',
      'Use Quick Fix buttons for common issues'
    ]
  },
  variables: {
    title: 'Workflow Variables',
    description: 'Data that flows through your workflow, passed between nodes.',
    tips: [
      'Variables are created when forms are submitted or nodes execute',
      'Access variables in conditions using their names',
      'View all variables in the Variables panel during execution',
      'Use ${variable} syntax in action nodes'
    ]
  },
  triggers: {
    title: 'Workflow Triggers',
    description: 'Determines when and how workflows start execution.',
    tips: [
      'Manual: Start workflows on-demand from the UI',
      'Scheduled: Use cron expressions for recurring workflows',
      'Webhook: Trigger via external API calls',
      'Test webhooks using tools like Postman'
    ]
  }
};

export const ContextualTooltip = ({ content, type = 'info', children, placement = 'top' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const icons = {
    info: Info,
    help: HelpCircle,
    tip: Lightbulb,
    success: CheckCircle2,
    warning: AlertCircle
  };

  const colors = {
    info: 'bg-green-500',
    help: 'bg-green-500',
    tip: 'bg-amber-500',
    success: 'bg-green-500',
    warning: 'bg-gold-500'
  };

  const Icon = icons[type] || HelpCircle;
  const colorClass = colors[type] || colors.info;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        {children || (
          <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
        )}
      </div>
      
      {showTooltip && (
        <div className={`absolute z-50 ${
          placement === 'top' ? 'bottom-full mb-2' : 
          placement === 'bottom' ? 'top-full mt-2' :
          placement === 'left' ? 'right-full mr-2' :
          'left-full ml-2'
        } left-1/2 transform -translate-x-1/2 w-64`}>
          <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl">
            <div className="relative">
              {content}
              <div className={`absolute ${
                placement === 'top' ? 'top-full left-1/2 transform -translate-x-1/2' :
                placement === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 rotate-180' :
                ''
              } w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900`}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const InlineHelp = ({ topic, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const helpData = HELP_CONTENT[topic];

  if (!helpData) {
    return null;
  }

  if (compact) {
    return (
      <ContextualTooltip
        content={
          <div>
            <div className="font-semibold mb-1">{helpData.title}</div>
            <div>{helpData.description}</div>
          </div>
        }
        type="help"
      />
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="bg-green-500 rounded-full p-1.5">
            <HelpCircle className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-green-900">{helpData.title}</h4>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-green-600 hover:text-green-800 text-xs font-medium"
            >
              {expanded ? 'Less' : 'More'} →
            </button>
          </div>
          <p className="text-xs text-green-800 mb-2">{helpData.description}</p>
          
          {expanded && (
            <div className="space-y-3 mt-3">
              {helpData.tips && helpData.tips.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-slate-800">Tips</span>
                  </div>
                  <ul className="space-y-1 ml-5">
                    {helpData.tips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-slate-700 list-disc">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {helpData.examples && helpData.examples.length > 0 && (
                <div>
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-semibold text-slate-800">Examples</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {helpData.examples.map((example, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const HelpPanel = ({ isOpen, onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState('start');
  const helpData = HELP_CONTENT[selectedTopic];

  if (!isOpen) return null;

  const categories = {
    'Core Nodes': ['start', 'end', 'task', 'form'],
    'Logic': ['decision', 'approval', 'loop_for_each', 'subprocess'],
    'Actions': ['action'],
    'Features': ['validation', 'variables', 'triggers']
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-4 px-2">Help Topics</h3>
          {Object.entries(categories).map(([category, topics]) => (
            <div key={category} className="mb-4">
              <h4 className="text-xs font-semibold text-slate-600 mb-2 px-2">
                {category}
              </h4>
              <div className="space-y-1">
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedTopic === topic
                        ? 'bg-green-500 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {HELP_CONTENT[topic]?.title || topic}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{helpData?.title}</h2>
              <p className="text-sm text-slate-600 mt-1">Need help? We've got you covered.</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-sm max-w-none">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-6">
                <p className="text-sm text-green-900">{helpData?.description}</p>
              </div>

              {helpData?.tips && helpData.tips.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-slate-900">Tips & Best Practices</h3>
                  </div>
                  <ul className="space-y-2">
                    {helpData.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {helpData?.examples && helpData.examples.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Info className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold text-slate-900">Common Examples</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {helpData.examples.map((example, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                      >
                        <code className="text-xs text-slate-800">{example}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default { ContextualTooltip, InlineHelp, HelpPanel };
