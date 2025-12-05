import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, CheckCircle, Zap } from 'lucide-react';

const WIZARD_STEPS = [
  {
    id: 'purpose',
    title: 'What type of workflow?',
    description: 'Choose the purpose of your workflow',
    options: [
      { value: 'approval', label: 'Approval Process', description: 'Get approvals from users' },
      { value: 'automation', label: 'Automation', description: 'Automate tasks and actions' },
      { value: 'data_collection', label: 'Data Collection', description: 'Collect information via forms' },
      { value: 'notification', label: 'Notifications', description: 'Send alerts and updates' }
    ]
  },
  {
    id: 'complexity',
    title: 'How complex should it be?',
    description: 'Select the workflow complexity',
    options: [
      { value: 'simple', label: 'Simple', description: '2-4 steps, single path' },
      { value: 'moderate', label: 'Moderate', description: '5-8 steps, some branching' },
      { value: 'complex', label: 'Complex', description: '9+ steps, multiple paths' }
    ]
  },
  {
    id: 'features',
    title: 'What features do you need?',
    description: 'Select all that apply',
    multiSelect: true,
    options: [
      { value: 'approvals', label: 'Approvals', description: 'User approvals' },
      { value: 'forms', label: 'Forms', description: 'Data collection' },
      { value: 'tasks', label: 'Tasks', description: 'User assignments' },
      { value: 'decisions', label: 'Decisions', description: 'Conditional logic' },
      { value: 'actions', label: 'Actions', description: 'API calls & webhooks' },
      { value: 'parallel', label: 'Parallel Execution', description: 'Concurrent paths' }
    ]
  }
];

const AI_SUGGESTIONS = {
  approval_simple: {
    name: 'Simple Approval Workflow',
    nodes: ['start', 'task', 'approval', 'end'],
    description: 'A straightforward approval process'
  },
  approval_moderate: {
    name: 'Multi-Level Approval',
    nodes: ['start', 'form', 'decision', 'approval', 'approval', 'task', 'end'],
    description: 'Approval with conditional routing'
  },
  automation_simple: {
    name: 'Simple Automation',
    nodes: ['start', 'action', 'action', 'end'],
    description: 'Basic automated workflow'
  },
  data_collection_moderate: {
    name: 'Form Collection & Processing',
    nodes: ['start', 'form', 'task', 'decision', 'action', 'end'],
    description: 'Collect and process form data'
  }
};

const QuickStartWizard = ({ isOpen, onClose, onCreate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelectAnswers, setMultiSelectAnswers] = useState([]);

  if (!isOpen) return null;

  const step = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const handleSelect = (value) => {
    if (step.multiSelect) {
      const newAnswers = multiSelectAnswers.includes(value)
        ? multiSelectAnswers.filter(v => v !== value)
        : [...multiSelectAnswers, value];
      setMultiSelectAnswers(newAnswers);
    } else {
      setAnswers({ ...answers, [step.id]: value });
    }
  };

  const handleNext = () => {
    if (step.multiSelect) {
      setAnswers({ ...answers, [step.id]: multiSelectAnswers });
    }
    
    if (isLastStep) {
      // Generate workflow based on answers
      const purpose = answers.purpose;
      const complexity = answers.complexity;
      const suggestionKey = `${purpose}_${complexity}`;
      const suggestion = AI_SUGGESTIONS[suggestionKey] || AI_SUGGESTIONS.approval_simple;

      const workflow = {
        id: null,
        name: suggestion.name,
        description: suggestion.description,
        nodes: suggestion.nodes.map((type, idx) => ({
          id: `node-${idx + 1}`,
          type,
          position: { x: 250, y: 50 + (idx * 120) },
          data: {
            label: type.charAt(0).toUpperCase() + type.slice(1),
            type,
            description: ''
          }
        })),
        edges: [],
        status: 'draft',
        version: 1,
        tags: ['wizard-generated']
      };

      onCreate(workflow);
      onClose();
      resetWizard();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setAnswers({});
    setMultiSelectAnswers([]);
  };

  const canProceed = step.multiSelect ? multiSelectAnswers.length > 0 : answers[step.id];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Quick Start Wizard</h2>
                <p className="text-primary-100 text-sm">Create a workflow in 3 easy steps</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                resetWizard();
              }}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              data-testid="close-wizard"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            {WIZARD_STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                  idx <= currentStep
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {idx < currentStep ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    idx < currentStep ? 'bg-primary-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-slate-600 text-center">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{step.title}</h3>
            <p className="text-slate-600">{step.description}</p>
          </div>

          <div className="space-y-3">
            {step.options.map((option) => {
              const isSelected = step.multiSelect
                ? multiSelectAnswers.includes(option.value)
                : answers[step.id] === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                  data-testid={`option-${option.value}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 mb-1">{option.label}</div>
                      <div className="text-sm text-slate-600">{option.description}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 ml-3" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* AI Suggestion Hint */}
          {canProceed && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-purple-900 mb-1">AI Suggestion</div>
                  <div className="text-sm text-purple-700">
                    Based on your selection, we'll create an optimized workflow structure
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              data-testid="wizard-back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              canProceed
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl hover:shadow-primary-500/40'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            data-testid="wizard-next"
          >
            <span>{isLastStep ? 'Create Workflow' : 'Next'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickStartWizard;
