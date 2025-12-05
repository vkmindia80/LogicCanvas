import React, { useState } from 'react';
import { X, Activity, Workflow, FileText, CheckSquare, BarChart3, Search, Download } from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to LogicCanvas',
    description:
      'LogicCanvas is your visual workflow builder. You can design workflows, build forms, manage tasks and approvals, and analyze performance – all in one place.',
  },
  {
    id: 'workflows',
    title: 'Workflows Dashboard',
    description:
      'Use the Workflows tab to create, search, and filter workflows. The status filter and search bar help you quickly find what you need.',
  },
  {
    id: 'canvas',
    title: 'Visual Canvas',
    description:
      'On the canvas you can drag nodes from the palette, connect them, and configure properties in the side panel to define your process logic.',
  },
  {
    id: 'forms',
    title: 'Form Library & Builder',
    description:
      'The Forms tab lets you design reusable forms with validation and conditional logic. Forms can be linked into workflows via Form nodes.',
  },
  {
    id: 'tasks_approvals',
    title: 'Tasks & Approvals',
    description:
      'Use the Tasks and Approvals quick actions in the header to review work items, reassign, escalate, and make approval decisions.',
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description:
      'The Analytics view gives you throughput, SLA, node performance, and user productivity insights so you can optimize your workflows.',
  },
  {
    id: 'power_tools',
    title: 'Search & Import/Export',
    description:
      'Global Search finds workflows, forms, tasks, and approvals. Import/Export lets you back up or migrate workflows as JSON files.',
  },
];

const OnboardingTour = ({ isOpen, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);

  if (!isOpen) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const goNext = () => {
    if (isLast) {
      onClose();
    } else {
      setStepIndex((idx) => Math.min(idx + 1, steps.length - 1));
    }
  };

  const goPrev = () => {
    setStepIndex((idx) => Math.max(idx - 1, 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" data-testid="onboarding-overlay">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6 sm:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Close onboarding tour"
          data-testid="onboarding-close-btn"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Getting started</p>
            <h2 className="text-xl font-bold text-slate-900">LogicCanvas Tour</h2>
          </div>
        </div>

        {/* Step content */}
        <div className="mb-6 rounded-xl bg-slate-50 p-4">
          <div className="mb-2 flex items-center space-x-2">
            {step.id === 'workflows' && <Workflow className="h-5 w-5 text-primary-600" />}
            {step.id === 'forms' && <FileText className="h-5 w-5 text-primary-600" />}
            {step.id === 'tasks_approvals' && <CheckSquare className="h-5 w-5 text-primary-600" />}
            {step.id === 'analytics' && <BarChart3 className="h-5 w-5 text-primary-600" />}
            {step.id === 'power_tools' && <Search className="h-5 w-5 text-primary-600" />}
            {!['workflows', 'forms', 'tasks_approvals', 'analytics', 'power_tools'].includes(step.id) && (
              <Download className="h-5 w-5 text-primary-600" />
            )}
            <h3 className="text-lg font-semibold text-slate-900" data-testid="onboarding-step-title">
              {step.title}
            </h3>
          </div>
          <p className="text-sm text-slate-600" data-testid="onboarding-step-description">
            {step.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2" data-testid="onboarding-step-indicator">
            {steps.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setStepIndex(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === stepIndex ? 'w-6 bg-primary-600' : 'w-2.5 bg-slate-300'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 underline-offset-2 hover:underline"
            data-testid="onboarding-skip-btn"
          >
            Skip tour
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="onboarding-prev-btn"
            >
              Back
            </button>
            <button
              onClick={goNext}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              data-testid="onboarding-next-btn"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
