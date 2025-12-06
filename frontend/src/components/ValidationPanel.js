import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, X, ChevronDown, ChevronUp, ZapOff } from 'lucide-react';

const ValidationPanel = ({ nodes, edges, onNodeSelect, isOpen, onClose }) => {
  const [validationIssues, setValidationIssues] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({
    errors: true,
    warnings: true,
    info: false
  });

  useEffect(() => {
    if (isOpen) {
      validateWorkflow();
    }
  }, [nodes, edges, isOpen]);

  const validateWorkflow = () => {
    const issues = [];

    // Check for start node
    const startNode = nodes.find(n => n.data?.type === 'start');
    if (!startNode) {
      issues.push({
        severity: 'error',
        node: null,
        message: 'Workflow must have a Start node',
        suggestion: 'Add a Start node from the palette'
      });
    }

    // Check for end node
    const endNode = nodes.find(n => n.data?.type === 'end');
    if (!endNode) {
      issues.push({
        severity: 'error',
        node: null,
        message: 'Workflow must have an End node',
        suggestion: 'Add an End node from the palette'
      });
    }

    // Check each node
    nodes.forEach(node => {
      const nodeType = node.data?.type || node.type;
      
      // Check if node has no outgoing edges (except end nodes)
      if (nodeType !== 'end') {
        const hasOutgoing = edges.some(e => e.source === node.id);
        if (!hasOutgoing) {
          issues.push({
            severity: 'warning',
            node: node,
            message: `${node.data?.label || nodeType} has no outgoing connections`,
            suggestion: 'Connect this node to the next step'
          });
        }
      }

      // Check if node has no incoming edges (except start nodes)
      if (nodeType !== 'start') {
        const hasIncoming = edges.some(e => e.target === node.id);
        if (!hasIncoming) {
          issues.push({
            severity: 'warning',
            node: node,
            message: `${node.data?.label || nodeType} is not connected to workflow`,
            suggestion: 'Connect a previous node to this one'
          });
        }
      }

      // Node-specific validation
      switch (nodeType) {
        case 'decision':
          if (!node.data?.condition) {
            issues.push({
              severity: 'error',
              node: node,
              message: 'Decision node has no condition',
              suggestion: 'Configure the decision condition'
            });
          }
          break;

        case 'form':
          if (!node.data?.formId) {
            issues.push({
              severity: 'error',
              node: node,
              message: 'Form node has no form selected',
              suggestion: 'Select a form for this node'
            });
          }
          break;

        case 'task':
          if (!node.data?.assignedTo) {
            issues.push({
              severity: 'warning',
              node: node,
              message: 'Task node has no assignee',
              suggestion: 'Assign this task to a user or role'
            });
          }
          break;

        case 'approval':
          if (!node.data?.approvers || node.data.approvers.length === 0) {
            issues.push({
              severity: 'error',
              node: node,
              message: 'Approval node has no approvers',
              suggestion: 'Add at least one approver'
            });
          }
          break;

        case 'action':
          if (!node.data?.url && !node.data?.script) {
            issues.push({
              severity: 'error',
              node: node,
              message: 'Action node is not configured',
              suggestion: 'Configure the HTTP request or script'
            });
          }
          break;

        case 'subprocess':
          if (!node.data?.subworkflowId) {
            issues.push({
              severity: 'error',
              node: node,
              message: 'Subprocess node has no workflow selected',
              suggestion: 'Select a sub-workflow'
            });
          }
          break;
      }
    });

    // Check for disconnected nodes (unreachable from start)
    if (startNode) {
      const reachableNodes = new Set([startNode.id]);
      let changed = true;
      while (changed) {
        changed = false;
        edges.forEach(edge => {
          if (reachableNodes.has(edge.source) && !reachableNodes.has(edge.target)) {
            reachableNodes.add(edge.target);
            changed = true;
          }
        });
      }

      nodes.forEach(node => {
        if (!reachableNodes.has(node.id) && node.data?.type !== 'start') {
          issues.push({
            severity: 'warning',
            node: node,
            message: `${node.data?.label || node.data?.type} is unreachable from Start`,
            suggestion: 'Connect this node to the workflow path'
          });
        }
      });
    }

    setValidationIssues(issues);
  };

  const categorizedIssues = {
    errors: validationIssues.filter(i => i.severity === 'error'),
    warnings: validationIssues.filter(i => i.severity === 'warning'),
    info: validationIssues.filter(i => i.severity === 'info')
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleIssueClick = (issue) => {
    if (issue.node && onNodeSelect) {
      onNodeSelect(issue.node);
    }
  };

  if (!isOpen) return null;

  const totalIssues = validationIssues.length;
  const hasErrors = categorizedIssues.errors.length > 0;
  const hasWarnings = categorizedIssues.warnings.length > 0;

  return (
    <div className="fixed right-4 top-20 z-40 w-96 max-h-[calc(100vh-120px)] bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700">
        <div className="flex items-center space-x-3">
          {hasErrors ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : hasWarnings ? (
            <AlertCircle className="w-5 h-5 text-orange-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Workflow Validation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalIssues === 0 ? 'No issues found' : `${totalIssues} issue${totalIssues > 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">
        {totalIssues === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Workflow is valid!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">No validation issues found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {/* Errors */}
            {categorizedIssues.errors.length > 0 && (
              <div>
                <button
                  onClick={() => toggleCategory('errors')}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Errors ({categorizedIssues.errors.length})
                    </span>
                  </div>
                  {expandedCategories.errors ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {expandedCategories.errors && (
                  <div className="bg-red-50 dark:bg-red-900/10">
                    {categorizedIssues.errors.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3 border-l-2 border-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                        onClick={() => handleIssueClick(issue)}
                      >
                        <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                          {issue.message}
                        </p>
                        {issue.suggestion && (
                          <p className="text-xs text-red-700 dark:text-red-300 italic">
                            💡 {issue.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {categorizedIssues.warnings.length > 0 && (
              <div>
                <button
                  onClick={() => toggleCategory('warnings')}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Warnings ({categorizedIssues.warnings.length})
                    </span>
                  </div>
                  {expandedCategories.warnings ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {expandedCategories.warnings && (
                  <div className="bg-orange-50 dark:bg-orange-900/10">
                    {categorizedIssues.warnings.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-3 border-l-2 border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/20 cursor-pointer transition-colors"
                        onClick={() => handleIssueClick(issue)}
                      >
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
                          {issue.message}
                        </p>
                        {issue.suggestion && (
                          <p className="text-xs text-orange-700 dark:text-orange-300 italic">
                            💡 {issue.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {totalIssues > 0 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
            Click on an issue to navigate to the node
          </p>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;
