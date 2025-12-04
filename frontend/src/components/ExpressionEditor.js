import React, { useState } from 'react';
import { Code, Play } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ExpressionEditor = ({ value, onChange, variables = {} }) => {
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/expressions/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression: value,
          variables
        })
      });
      const data = await response.json();
      setTestResult(data.result);
    } catch (error) {
      setTestResult('Error: ' + error.message);
    }
    setTesting(false);
  };

  const insertVariable = (varName) => {
    const newValue = value + `\${${varName}}`;
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expression
        </label>
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g., ${amount} > 1000"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            data-testid="expression-input"
          />
        </div>
      </div>

      {/* Variable Helpers */}
      {Object.keys(variables).length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Available Variables:
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(variables).map((varName) => (
              <button
                key={varName}
                onClick={() => insertVariable(varName)}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100"
                data-testid={`insert-variable-${varName}`}
              >
                {'${' + varName + '}'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test Expression */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTest}
          disabled={testing || !value}
          className="flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          data-testid="test-expression-button"
        >
          <Play className="w-4 h-4" />
          {testing ? 'Testing...' : 'Test Expression'}
        </button>
      </div>

      {testResult !== null && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-1">Result:</div>
          <div className="font-mono text-sm text-gray-900" data-testid="test-result">
            {typeof testResult === 'object' ? JSON.stringify(testResult, null, 2) : String(testResult)}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        <div className="font-medium mb-1">Expression Syntax:</div>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Variables: ${'{'}variable_name{'}'}</li>
          <li>Comparisons: ==, !=, >, <, >=, <=</li>
          <li>Logic: and, or, not</li>
          <li>Examples: ${'{'}amount{'}'} > 1000, ${'{'}status{'}'} == "approved"</li>
        </ul>
      </div>
    </div>
  );
};

export default ExpressionEditor;