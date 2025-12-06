import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Code, Eye, Info } from 'lucide-react';

/**
 * KeyValueEditor - A reusable component for editing key-value pairs with form inputs
 * Replaces JSON text areas with a more user-friendly interface
 * Supports variable interpolation with ${variable} syntax
 */
const KeyValueEditor = ({ 
  value, 
  onChange, 
  label = 'Key-Value Pairs',
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  allowJSON = false, // Allow toggling to JSON view
  showVariableHelp = true,
  testId = 'key-value-editor'
}) => {
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'json'
  const [pairs, setPairs] = useState([]);
  const [jsonValue, setJsonValue] = useState('{}');
  const [jsonError, setJsonError] = useState(null);

  // Initialize pairs from value
  useEffect(() => {
    if (!value) {
      setPairs([]);
      setJsonValue('{}');
      return;
    }

    let parsed = {};
    
    // Handle different input types
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        parsed = {};
      }
    } else if (typeof value === 'object') {
      parsed = value;
    }

    // Convert object to pairs array
    const pairsArray = Object.entries(parsed).map(([key, val], index) => ({
      id: `pair-${index}-${Date.now()}`,
      key,
      value: typeof val === 'string' ? val : JSON.stringify(val)
    }));

    setPairs(pairsArray);
    setJsonValue(JSON.stringify(parsed, null, 2));
  }, [value]);

  // Convert pairs to object
  const pairsToObject = (pairsArray) => {
    const obj = {};
    pairsArray.forEach(pair => {
      if (pair.key) {
        // Try to parse value as JSON if it looks like JSON
        let parsedValue = pair.value;
        if (pair.value && (pair.value.startsWith('{') || pair.value.startsWith('['))) {
          try {
            parsedValue = JSON.parse(pair.value);
          } catch {
            // Keep as string if not valid JSON
            parsedValue = pair.value;
          }
        }
        obj[pair.key] = parsedValue;
      }
    });
    return obj;
  };

  // Update parent component
  const updateValue = (newPairs) => {
    const obj = pairsToObject(newPairs);
    if (onChange) {
      onChange(obj);
    }
  };

  const addPair = () => {
    const newPairs = [...pairs, { id: `pair-${Date.now()}`, key: '', value: '' }];
    setPairs(newPairs);
  };

  const updatePair = (id, field, newValue) => {
    const newPairs = pairs.map(pair => 
      pair.id === id ? { ...pair, [field]: newValue } : pair
    );
    setPairs(newPairs);
    updateValue(newPairs);
  };

  const removePair = (id) => {
    const newPairs = pairs.filter(pair => pair.id !== id);
    setPairs(newPairs);
    updateValue(newPairs);
  };

  const handleJSONChange = (newJson) => {
    setJsonValue(newJson);
    try {
      const parsed = JSON.parse(newJson);
      setJsonError(null);
      
      // Convert to pairs
      const pairsArray = Object.entries(parsed).map(([key, val], index) => ({
        id: `pair-${index}-${Date.now()}`,
        key,
        value: typeof val === 'string' ? val : JSON.stringify(val)
      }));
      
      setPairs(pairsArray);
      if (onChange) {
        onChange(parsed);
      }
    } catch (e) {
      setJsonError(e.message);
    }
  };

  // JSON View
  if (viewMode === 'json') {
    return (
      <div className="space-y-2" data-testid={testId}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">{label} (JSON)</label>
          <button
            onClick={() => setViewMode('form')}
            className="flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            data-testid="switch-to-form"
          >
            <Eye className="w-3 h-3" />
            <span>Form View</span>
          </button>
        </div>
        <textarea
          value={jsonValue}
          onChange={(e) => handleJSONChange(e.target.value)}
          className={`w-full h-32 px-3 py-2 border-2 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
            jsonError ? 'border-red-300 bg-red-50' : 'border-slate-200'
          }`}
          placeholder='{"key": "value"}'
          data-testid="json-textarea"
        />
        {jsonError && (
          <div className="flex items-center space-x-1 text-xs text-red-600 bg-red-50 p-2 rounded">
            <Info className="w-3 h-3" />
            <span>Invalid JSON: {jsonError}</span>
          </div>
        )}
      </div>
    );
  }

  // Form View
  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <div className="flex items-center space-x-2">
          {allowJSON && (
            <button
              onClick={() => setViewMode('json')}
              className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-800 font-medium"
              data-testid="switch-to-json"
            >
              <Code className="w-3 h-3" />
              <span>JSON</span>
            </button>
          )}
          <button
            onClick={addPair}
            className="flex items-center space-x-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-xs font-medium"
            data-testid="add-pair-btn"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-500 mb-2">No entries added yet</p>
          <button
            onClick={addPair}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Click "Add" to create your first entry
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {pairs.map((pair) => (
            <div key={pair.id} className="grid grid-cols-12 gap-2 items-start" data-testid="key-value-pair">
              <div className="col-span-5">
                <input
                  type="text"
                  value={pair.key}
                  onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
                  placeholder={keyPlaceholder}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                  data-testid="pair-key"
                />
              </div>
              <div className="col-span-6">
                <input
                  type="text"
                  value={pair.value}
                  onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
                  placeholder={valuePlaceholder}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                  data-testid="pair-value"
                />
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <button
                  onClick={() => removePair(pair.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove entry"
                  data-testid="remove-pair-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showVariableHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold mb-1">💡 Pro Tip: Dynamic Variables</p>
              <p>Use <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">${'{variable}'}</code> syntax to insert workflow variables dynamically.</p>
              <p className="mt-1 text-blue-700">Example: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">${'{userId}'}</code> or <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">${'{apiToken}'}</code></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyValueEditor;
