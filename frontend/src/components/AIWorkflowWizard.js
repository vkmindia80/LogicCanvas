import React, { useState } from 'react';
import { X, Wand2, Loader2, CheckCircle, AlertCircle, Sparkles, Lightbulb } from 'lucide-react';

const AIWorkflowWizard = ({ onClose, onWorkflowCreated }) => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  
  const [step, setStep] = useState(1); // 1: Input, 2: Generating, 3: Review
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('general');
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const industries = [
    { value: 'general', label: 'General Business', icon: '🏢' },
    { value: 'hr', label: 'Human Resources', icon: '👥' },
    { value: 'finance', label: 'Finance & Accounting', icon: '💰' },
    { value: 'it', label: 'IT & Operations', icon: '💻' },
    { value: 'sales', label: 'Sales & Marketing', icon: '📈' },
    { value: 'legal', label: 'Legal & Compliance', icon: '⚖️' },
    { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { value: 'manufacturing', label: 'Manufacturing', icon: '🏭' }
  ];

  const examples = [
    'Create an employee onboarding workflow with document collection, IT setup, and first-day orientation',
    'Build an invoice approval process with multi-level sign-off and payment processing',
    'Design a customer support ticket workflow with automatic routing and escalation',
    'Set up a purchase request approval flow with budget checks and vendor management',
    'Create a leave request process with manager approval and calendar integration'
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe your workflow');
      return;
    }

    setLoading(true);
    setError(null);
    setStep(2);

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/generate-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          industry,
          preferences: {
            includeApprovals: true,
            includeForms: true,
            includeNotifications: true
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate workflow');

      const data = await response.json();
      setGeneratedWorkflow(data.workflow);
      setStep(3);
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedWorkflow)
      });

      if (!response.ok) throw new Error('Failed to create workflow');

      const data = await response.json();
      onWorkflowCreated(data.id);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExampleClick = (example) => {
    setDescription(example);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Wand2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Workflow Wizard</h2>
                <p className="text-purple-100 text-sm">Describe your process, we'll build the workflow</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-white text-purple-600' : 'bg-purple-400 text-white'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Describe</span>
            </div>
            <div className="flex-1 h-0.5 bg-purple-400" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-white text-purple-600' : 'bg-purple-400 text-white'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Generate</span>
            </div>
            <div className="flex-1 h-0.5 bg-purple-400" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 3 ? 'bg-white text-purple-600' : 'bg-purple-400 text-white'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Input */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Industry Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select your industry (optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {industries.map((ind) => (
                    <button
                      key={ind.value}
                      onClick={() => setIndustry(ind.value)}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        industry === ind.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{ind.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{ind.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your workflow
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., I need an employee onboarding workflow that collects documents, creates IT accounts, and schedules first-day orientation..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Be as detailed as possible. Include steps, approvals, notifications, and any specific requirements.
                </p>
              </div>

              {/* Examples */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <label className="text-sm font-medium text-gray-700">
                    Need inspiration? Try these examples:
                  </label>
                </div>
                <div className="space-y-2">
                  {examples.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example)}
                      className="w-full text-left p-3 text-sm text-gray-700 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition border border-transparent hover:border-purple-200"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Generating */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                <Sparkles className="w-8 h-8 text-amber-500 absolute top-0 right-0 animate-pulse" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">Generating your workflow...</h3>
              <p className="mt-2 text-gray-600 text-center max-w-md">
                Our AI is analyzing your requirements and creating a custom workflow with nodes, connections, and configurations.
              </p>
              <div className="mt-8 space-y-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                  <span>Analyzing requirements...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span>Designing workflow structure...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <span>Configuring nodes and connections...</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && generatedWorkflow && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Workflow Generated Successfully!</p>
                  <p className="text-sm text-green-700 mt-1">Review the workflow below and create it when ready.</p>
                </div>
              </div>

              {/* Workflow Preview */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{generatedWorkflow.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{generatedWorkflow.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Nodes</p>
                    <p className="text-2xl font-bold text-purple-600">{generatedWorkflow.nodes?.length || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Connections</p>
                    <p className="text-2xl font-bold text-purple-600">{generatedWorkflow.edges?.length || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Estimated Time</p>
                    <p className="text-2xl font-bold text-purple-600">{generatedWorkflow.metadata?.estimatedTime || '~5min'}</p>
                  </div>
                </div>

                {/* Node Types Summary */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Workflow Components:</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedWorkflow.metadata?.nodeTypes?.map((type, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              {generatedWorkflow.metadata?.suggestions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">AI Suggestions</p>
                      <ul className="mt-2 space-y-1 text-sm text-blue-700">
                        {generatedWorkflow.metadata.suggestions.map((suggestion, idx) => (
                          <li key={idx}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {step === 1 && (
              <button
                onClick={handleGenerate}
                disabled={!description.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Generate Workflow
              </button>
            )}
            {step === 3 && (
              <>
                <button
                  onClick={() => {
                    setStep(1);
                    setGeneratedWorkflow(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
                >
                  Start Over
                </button>
                <button
                  onClick={handleCreateWorkflow}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Create Workflow
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWorkflowWizard;