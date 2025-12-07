import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, GitBranch, Info, Zap } from 'lucide-react';

/**
 * ConditionalBuilder - Visual builder for complex conditional logic
 * Provides a user-friendly interface for building decision conditions without code
 */
const ConditionalBuilder = ({ value, onChange, variables = {} }) => {
  const [conditions, setConditions] = useState([]);
  const [logicOperator, setLogicOperator] = useState('AND');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Comparison operators
  const operators = [
    { value: '==', label: 'Equals (==)', icon: '=' },
    { value: '!=', label: 'Not Equals (!=)', icon: '≠' },
    { value: '>', label: 'Greater Than (>)', icon: '>' },
    { value: '<', label: 'Less Than (<)', icon: '<' },
    { value: '>=', label: 'Greater or Equal (>=)', icon: '≥' },
    { value: '<=', label: 'Less or Equal (<=)', icon: '≤' },
    { value: 'contains', label: 'Contains', icon: '⊃' },
    { value: 'startsWith', label: 'Starts With', icon: '⊲' },
    { value: 'endsWith', label: 'Ends With', icon: '⊳' },
    { value: 'in', label: 'In List', icon: '∈' }
  ];

  // Parse existing expression into conditions
  useEffect(() => {
    if (!value) {
      setConditions([createEmptyCondition()]);
      return;
    }

    // Try to parse the expression
    // For now, if it's a simple expression, keep it as is
    // Complex parsing can be added later
    setConditions([createEmptyCondition()]);
  }, []);

  const createEmptyCondition = () => ({
    id: `cond-${Date.now()}-${Math.random()}`,
    variable: '',
    operator: '==',
    value: '',
    valueType: 'constant' // 'constant', 'variable', 'expression'
  });

  const addCondition = () => {
    setConditions([...conditions, createEmptyCondition()]);
  };

  const updateCondition = (id, field, newValue) => {
    const updated = conditions.map(cond =>
      cond.id === id ? { ...cond, [field]: newValue } : cond
    );
    setConditions(updated);
    updateExpression(updated, logicOperator);
  };

  const removeCondition = (id) => {
    const updated = conditions.filter(cond => cond.id !== id);
    setConditions(updated);
    updateExpression(updated, logicOperator);
  };

  const updateExpression = (conditionsArray, operator) => {
    if (conditionsArray.length === 0) {
      onChange('');
      return;
    }

    const expressionParts = conditionsArray
      .filter(cond => cond.variable && cond.value)
      .map(cond => {
        let left = `\${${cond.variable}}`;
        let right = cond.valueType === 'variable' 
          ? `\${${cond.value}}`
          : cond.valueType === 'constant'
          ? isNaN(cond.value) ? `"${cond.value}"` : cond.value
          : cond.value;

        // Handle special operators
        if (cond.operator === 'contains') {
          return `"${cond.value}" in ${left}`;
        } else if (cond.operator === 'startsWith') {
          return `${left}.startsWith("${cond.value}")`;
        } else if (cond.operator === 'endsWith') {
          return `${left}.endsWith("${cond.value}")`;
        }

        return `${left} ${cond.operator} ${right}`;
      });

    const expression = expressionParts.join(` ${operator.toLowerCase()} `);
    onChange(expression);
  };

  const changeLogicOperator = (newOperator) => {
    setLogicOperator(newOperator);
    updateExpression(conditions, newOperator);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-semibold text-slate-800">Visual Condition Builder</h4>
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
            No Code Required
          </span>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-600 hover:text-slate-800 underline"
        >
          {showAdvanced ? 'Hide' : 'Show'} Generated Expression
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold mb-1">Build Complex Logic Visually</p>
            <p>Create conditional logic by combining multiple rules. Perfect for non-technical users!</p>
          </div>
        </div>
      </div>

      {/* Logic Operator Selector (for multiple conditions) */}
      {conditions.length > 1 && (
        <div className="bg-white border-2 border-slate-200 rounded-lg p-3">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            How should these conditions be combined?
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => changeLogicOperator('AND')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                logicOperator === 'AND'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <Zap className="w-4 h-4" />
                <span>AND (All must be true)</span>
              </div>
            </button>
            <button
              onClick={() => changeLogicOperator('OR')}
              className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                logicOperator === 'OR'
                  ? 'bg-gold-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <GitBranch className="w-4 h-4" />
                <span>OR (Any can be true)</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Conditions List */}
      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div
            key={condition.id}
            className="bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-primary-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Condition {index + 1}
                </span>
              </div>
              {conditions.length > 1 && (
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                  title="Remove condition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-12 gap-2">
              {/* Variable Selection */}
              <div className="col-span-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Variable
                </label>
                <select
                  value={condition.variable}
                  onChange={(e) => updateCondition(condition.id, 'variable', e.target.value)}
                  className="w-full px-2 py-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select variable...</option>
                  {Object.keys(variables).map((varName) => (
                    <option key={varName} value={varName}>
                      ${varName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator Selection */}
              <div className="col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Operator
                </label>
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                  className="w-full px-2 py-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.icon} {op.label.split(' (')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value Input */}
              <div className="col-span-5">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Compare To
                </label>
                <div className="flex space-x-1">
                  <select
                    value={condition.valueType}
                    onChange={(e) => updateCondition(condition.id, 'valueType', e.target.value)}
                    className="w-24 px-2 py-2 border-2 border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="constant">Value</option>
                    <option value="variable">Variable</option>
                  </select>
                  {condition.valueType === 'variable' ? (
                    <select
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                      className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select variable...</option>
                      {Object.keys(variables).map((varName) => (
                        <option key={varName} value={varName}>
                          ${varName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                      placeholder="Enter value"
                      className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Condition Button */}
      <button
        onClick={addCondition}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
      >
        <Plus className="w-4 h-4" />
        <span>Add Another Condition</span>
      </button>

      {/* Generated Expression Preview */}
      {showAdvanced && value && (
        <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-[10px] uppercase tracking-wide">Generated Expression</span>
            <Play className="w-3 h-3 text-green-400" />
          </div>
          <code className="text-green-400">{value}</code>
        </div>
      )}

      {/* Preview Cards */}
      {conditions.filter(c => c.variable && c.value).length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-gold-50 border-2 border-green-200 rounded-lg p-4">
          <h5 className="text-xs font-semibold text-green-900 mb-3">Condition Preview</h5>
          <div className="space-y-2">
            {conditions
              .filter(c => c.variable && c.value)
              .map((condition, index) => (
                <div key={condition.id} className="flex items-center space-x-2 text-xs">
                  <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
                    ${condition.variable}
                  </span>
                  <span className="text-green-600 font-semibold">
                    {operators.find(op => op.value === condition.operator)?.icon}
                  </span>
                  <span className="font-mono bg-gold-100 text-gold-800 px-2 py-1 rounded">
                    {condition.valueType === 'variable' ? `$${condition.value}` : condition.value}
                  </span>
                  {index < conditions.filter(c => c.variable && c.value).length - 1 && (
                    <span className="text-slate-500 font-bold">{logicOperator}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionalBuilder;
