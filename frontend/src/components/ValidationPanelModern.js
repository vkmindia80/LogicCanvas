import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, X, ChevronDown, ChevronUp, Zap, Target } from 'lucide-react';
import { modernBadgeStyles, modernButtonStyles, modernCardStyles } from '../utils/modernDesignSystem';

const ValidationPanelModern = ({ nodes, edges, onNodeSelect, isOpen, onClose }) => {
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
    <div className="fixed right-4 top-20 z-40 w-96 max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 rounded-t-2xl border-b border-indigo-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {hasErrors ? (
              <div className="p-2 bg-rose-500 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            ) : hasWarnings ? (
              <div className="p-2 bg-amber-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="p-2 bg-emerald-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-white">
                Workflow Validation
              </h3>
              <p className="text-xs text-indigo-200">
                {totalIssues === 0 ? 'All checks passed' : `${totalIssues} issue${totalIssues > 1 ? 's' : ''} detected`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            data-testid="close-validation-panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Health Score Bar */}
        {totalIssues > 0 && (
          <div className="mt-3">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  hasErrors ? 'bg-rose-400' : hasWarnings ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(10, 100 - (totalIssues * 10))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {totalIssues === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <p className="text-base font-semibold text-slate-900 mb-2">Workflow is Valid!</p>
            <p className="text-sm text-slate-600">No validation issues found. Ready to execute.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Errors */}
            {categorizedIssues.errors.length > 0 && (
              <div className="bg-white rounded-xl border border-rose-200 overflow-hidden">
                <button
                  onClick={() => toggleCategory('errors')}
                  className="w-full flex items-center justify-between p-4 hover:bg-rose-50 transition-colors"
                  data-testid="validation-errors-toggle"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
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
                  <div className="border-t border-rose-100">
                    {categorizedIssues.errors.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-4 border-l-4 border-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                        onClick={() => handleIssueClick(issue)}
                        data-testid={`validation-error-${idx}`}
                      >
                        <p className="text-sm font-medium text-rose-900 mb-2">
                          {issue.message}
                        </p>
                        {issue.suggestion && (
                          <div className="flex items-start space-x-2">
                            <Target className="w-3.5 h-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-rose-700">
                              {issue.suggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {categorizedIssues.warnings.length > 0 && (
              <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                <button
                  onClick={() => toggleCategory('warnings')}
                  className="w-full flex items-center justify-between p-4 hover:bg-amber-50 transition-colors"
                  data-testid="validation-warnings-toggle"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
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
                  <div className="border-t border-amber-100">
                    {categorizedIssues.warnings.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-4 border-l-4 border-amber-500 hover:bg-amber-50 cursor-pointer transition-colors"
                        onClick={() => handleIssueClick(issue)}
                        data-testid={`validation-warning-${idx}`}
                      >
                        <p className="text-sm font-medium text-amber-900 mb-2">
                          {issue.message}
                        </p>
                        {issue.suggestion && (
                          <div className="flex items-start space-x-2">
                            <Target className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700">
                              {issue.suggestion}
                            </p>
                          </div>
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
      <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Last validated: {new Date().toLocaleTimeString()}</span>
          {totalIssues > 0 && (
            <span className="font-medium text-indigo-600">Click issues to navigate</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationPanelModern;