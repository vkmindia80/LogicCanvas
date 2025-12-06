import React, { useState, useEffect } from 'react';
import { GitBranch, Info, AlertCircle, CheckCircle2, ArrowRightLeft, ChevronDown, ChevronRight } from 'lucide-react';
import KeyValueEditor from './KeyValueEditor';

const EnhancedSubprocessConfig = ({
  subprocessWorkflowId,
  onSubprocessWorkflowChange,
  inputMapping,
  onInputMappingChange,
  outputMapping,
  onOutputMappingChange,
  workflows = []
}) => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowVersions, setWorkflowVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('latest');
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [subprocessMetadata, setSubprocessMetadata] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [compatibilityCheck, setCompatibilityCheck] = useState(null);

  // Load workflow details when selection changes
  useEffect(() => {
    if (subprocessWorkflowId) {
      loadWorkflowDetails(subprocessWorkflowId);
      loadWorkflowVersions(subprocessWorkflowId);
    }
  }, [subprocessWorkflowId]);

  const loadWorkflowDetails = async (workflowId) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      setSelectedWorkflow(workflow);

      // Check if workflow is marked as subprocess-compatible
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}`);
      const data = await response.json();
      
      setSubprocessMetadata(data.subprocess_metadata);
      
      // Check compatibility
      if (data.is_subprocess_compatible) {
        setCompatibilityCheck({
          compatible: true,
          message: 'This workflow is optimized for subprocess usage'
        });
      } else {
        setCompatibilityCheck({
          compatible: false,
          message: 'This workflow may not be optimized for subprocess usage'
        });
      }
    } catch (error) {
      console.error('Failed to load workflow details:', error);
    }
  };

  const loadWorkflowVersions = async (workflowId) => {
    try {
      setLoadingVersions(true);
      const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/versions`);
      const data = await response.json();
      setWorkflowVersions(data.versions || []);
    } catch (error) {
      console.error('Failed to load workflow versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleWorkflowChange = (workflowId) => {
    onSubprocessWorkflowChange(workflowId);
    setSelectedVersion('latest');
  };

  const getWorkflowStatus = (workflow) => {
    const status = workflow?.lifecycle_state || workflow?.status || 'draft';
    const statusColors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-red-100 text-red-800'
    };
    return { status, color: statusColors[status] || statusColors.draft };
  };

  // Get subprocess-compatible workflows
  const compatibleWorkflows = workflows.filter(w => {
    const status = w.lifecycle_state || w.status;
    return status === 'published' || status === 'draft';
  });

  return (
    <div className="space-y-6">
      {/* Workflow Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <span className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Select Subprocess Workflow
          </span>
        </label>
        <select
          value={subprocessWorkflowId}
          onChange={(e) => handleWorkflowChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          data-testid="subprocess-workflow-select"
        >
          <option value="">-- Select a workflow --</option>
          {compatibleWorkflows.map((workflow) => {
            const { status, color } = getWorkflowStatus(workflow);
            return (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name} ({status})
              </option>
            );
          })}
        </select>

        {subprocessWorkflowId && selectedWorkflow && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-700">{selectedWorkflow.description || 'No description'}</p>
                {selectedWorkflow.lifecycle_state && (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getWorkflowStatus(selectedWorkflow).color}`}>
                      {getWorkflowStatus(selectedWorkflow).status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compatibility Check */}
      {compatibilityCheck && (
        <div className={`p-4 rounded-lg border ${
          compatibilityCheck.compatible 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            {compatibilityCheck.compatible ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                compatibilityCheck.compatible ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {compatibilityCheck.message}
              </p>
              {subprocessMetadata && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  {subprocessMetadata.max_execution_time && (
                    <div>Max execution time: {subprocessMetadata.max_execution_time}s</div>
                  )}
                  {subprocessMetadata.can_run_in_parallel !== undefined && (
                    <div>Can run in parallel: {subprocessMetadata.can_run_in_parallel ? 'Yes' : 'No'}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version Selection (Phase 3.1 Feature) */}
      {subprocessWorkflowId && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Workflow Version
          </label>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            data-testid="subprocess-version-select"
            disabled={loadingVersions}
          >
            <option value="latest">Latest Version (Recommended)</option>
            {workflowVersions.map((version) => (
              <option key={version.version_number} value={version.version_number}>
                Version {version.version_number} - {new Date(version.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            <Info className="w-3 h-3 inline mr-1" />
            Using "Latest" ensures you always get the newest version
          </p>
        </div>
      )}

      {/* Input/Output Mapping */}
      {subprocessWorkflowId && (
        <>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Input Mapping
                </span>
              </label>
              {subprocessMetadata?.required_inputs?.length > 0 && (
                <span className="text-xs text-orange-600 font-medium">
                  {subprocessMetadata.required_inputs.length} required
                </span>
              )}
            </div>
            <KeyValueEditor
              value={inputMapping || {}}
              onChange={onInputMappingChange}
              keyPlaceholder="Subprocess variable"
              valuePlaceholder="Parent variable (e.g., ${parentVar})"
            />
            <p className="mt-1 text-xs text-slate-500">
              Map parent workflow variables to subprocess input variables
            </p>
            
            {/* Show required inputs from metadata */}
            {subprocessMetadata?.required_inputs?.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs font-medium text-blue-900 mb-1">Required Inputs:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  {subprocessMetadata.required_inputs.map((input, idx) => (
                    <li key={idx}>• {input}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 transform rotate-180" />
                Output Mapping
              </span>
            </label>
            <KeyValueEditor
              value={outputMapping || {}}
              onChange={onOutputMappingChange}
              keyPlaceholder="Parent variable"
              valuePlaceholder="Subprocess output variable"
            />
            <p className="mt-1 text-xs text-slate-500">
              Map subprocess output variables back to parent workflow variables
            </p>
            
            {/* Show expected outputs from metadata */}
            {subprocessMetadata?.expected_outputs?.length > 0 && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-xs font-medium text-green-900 mb-1">Available Outputs:</p>
                <ul className="text-xs text-green-700 space-y-1">
                  {subprocessMetadata.expected_outputs.map((output, idx) => (
                    <li key={idx}>• {output}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Advanced Settings */}
      {subprocessWorkflowId && (
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Advanced Settings
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Error Propagation</span>
                <select className="text-sm border border-gray-300 rounded px-2 py-1">
                  <option value="stop">Stop parent on error</option>
                  <option value="continue">Continue parent on error</option>
                  <option value="retry">Retry subprocess on error</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Timeout (seconds)</span>
                <input
                  type="number"
                  defaultValue={3600}
                  className="text-sm border border-gray-300 rounded px-2 py-1 w-24"
                  min="0"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Max Nesting Level</span>
                <input
                  type="number"
                  defaultValue={5}
                  className="text-sm border border-gray-300 rounded px-2 py-1 w-24"
                  min="1"
                  max="10"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Helper Info */}
      {!subprocessWorkflowId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">About Subprocesses</p>
              <p className="text-sm text-blue-700 mt-1">
                Subprocesses allow you to reuse workflows as modular components. Select a workflow to execute it as a nested subprocess with proper data passing and error handling.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSubprocessConfig;
