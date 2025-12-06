import React, { useState, useRef, useEffect } from 'react';
import { Code, Play, Info, Lightbulb, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ExpressionEditor = ({ value, onChange, variables = {} }) => {
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0);
  const textareaRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Common expression patterns and examples
  const commonExpressions = [
    { label: 'Greater than', template: '${variable} > value', example: '${amount} > 1000' },
    { label: 'Less than', template: '${variable} < value', example: '${count} < 50' },
    { label: 'Equals', template: '${variable} == value', example: '${status} == "approved"' },
    { label: 'Not equals', template: '${variable} != value', example: '${type} != "guest"' },
    { label: 'Contains text', template: '"text" in ${variable}', example: '"urgent" in ${priority}' },
    { label: 'And condition', template: '${var1} and ${var2}', example: '${amount} > 1000 and ${approved} == true' },
    { label: 'Or condition', template: '${var1} or ${var2}', example: '${urgent} == true or ${vip} == true' },
  ];

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
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const textBefore = value.substring(0, start);
      const textAfter = value.substring(end);
      const newValue = textBefore + `\${${varName}}` + textAfter;
      onChange(newValue);
      
      // Set cursor after inserted variable
      setTimeout(() => {
        const newPosition = start + varName.length + 3; // ${} = 3 chars
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const insertTemplate = (template) => {
    onChange(template);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-800">
            Expression
          </label>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
          >
            <Lightbulb className="w-3 h-3" />
            <span>{showSuggestions ? 'Hide' : 'Show'} Examples</span>
          </button>
        </div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setCursorPosition(e.target.selectionStart);
            }}
            onClick={(e) => setCursorPosition(e.target.selectionStart)}
            onKeyUp={(e) => setCursorPosition(e.target.selectionStart)}
            placeholder="e.g., ${amount} > 1000 or ${status} == 'approved'"
            rows={4}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm transition-all"
            data-testid="expression-input"
          />
          <div className="absolute bottom-2 right-2 text-xs text-slate-400">
            <Code className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Expression Templates */}
      {showSuggestions && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-900">Common Expression Patterns</h4>
          </div>
          <div className="space-y-2">
            {commonExpressions.map((expr, idx) => (
              <button
                key={idx}
                onClick={() => insertTemplate(expr.example)}
                className="w-full text-left p-2 bg-white hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-700 mb-1">{expr.label}</div>
                    <code className="text-xs text-blue-700 font-mono">{expr.example}</code>
                  </div>
                  <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Use →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variable Helpers - Enhanced */}
      {Object.keys(variables).length > 0 && (
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
          <label className="block text-xs font-semibold text-slate-700 mb-3 flex items-center space-x-2">
            <span>Available Variables</span>
            <span className="text-slate-500 font-normal">(click to insert)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(variables).map((varName) => (
              <button
                key={varName}
                onClick={() => insertVariable(varName)}
                className="text-xs bg-white text-blue-700 px-3 py-2 rounded-lg border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-all font-mono font-semibold shadow-sm hover:shadow-md"
                data-testid={`insert-variable-${varName}`}
                title={`Insert ${varName} variable`}
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

      {/* Help Text - Enhanced */}
      <div className="bg-slate-100 border border-slate-300 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-700 space-y-2">
            <div>
              <span className="font-semibold text-slate-800">Quick Reference:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="font-medium text-slate-700 mb-1">Comparisons</div>
                <div className="space-y-0.5 text-slate-600">
                  <div><code className="bg-white px-1 py-0.5 rounded">==</code> equals</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">!=</code> not equals</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">{'>'}</code> greater than</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">{'<'}</code> less than</div>
                </div>
              </div>
              <div>
                <div className="font-medium text-slate-700 mb-1">Logical</div>
                <div className="space-y-0.5 text-slate-600">
                  <div><code className="bg-white px-1 py-0.5 rounded">and</code> both true</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">or</code> either true</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">not</code> negate</div>
                  <div><code className="bg-white px-1 py-0.5 rounded">in</code> contains</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpressionEditor;