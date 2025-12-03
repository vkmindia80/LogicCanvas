import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

const FieldEditor = ({ field, onUpdate, onClose, allFields }) => {
  const [localField, setLocalField] = useState(field);

  useEffect(() => {
    setLocalField(field);
  }, [field]);

  const handleChange = (key, value) => {
    const updatedField = { ...localField, [key]: value };
    setLocalField(updatedField);
    onUpdate(updatedField);
  };

  const handleValidationChange = (key, value) => {
    const updatedField = {
      ...localField,
      validation: { ...localField.validation, [key]: value }
    };
    setLocalField(updatedField);
    onUpdate(updatedField);
  };

  const handleOptionsChange = (index, value) => {
    const newOptions = [...(localField.options || [])];
    newOptions[index] = value;
    handleChange('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(localField.options || []), `Option ${(localField.options?.length || 0) + 1}`];
    handleChange('options', newOptions);
  };

  const removeOption = (index) => {
    const newOptions = localField.options.filter((_, i) => i !== index);
    handleChange('options', newOptions);
  };

  const toggleConditionalVisibility = () => {
    if (localField.conditional_visibility) {
      handleChange('conditional_visibility', null);
    } else {
      handleChange('conditional_visibility', {
        enabled: true,
        dependsOn: '',
        condition: 'equals',
        value: ''
      });
    }
  };

  const handleConditionalChange = (key, value) => {
    const updatedField = {
      ...localField,
      conditional_visibility: {
        ...localField.conditional_visibility,
        [key]: value
      }
    };
    setLocalField(updatedField);
    onUpdate(updatedField);
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
        <h3 className="font-semibold text-slate-900">Field Properties</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
          data-testid="close-field-editor"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Properties */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Field Label
          </label>
          <input
            type="text"
            value={localField.label}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            data-testid="field-label-input"
          />
        </div>

        {/* Placeholder (for applicable fields) */}
        {['text', 'textarea', 'number', 'email', 'phone', 'url', 'dropdown', 'multiselect'].includes(localField.type) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Placeholder
            </label>
            <input
              type="text"
              value={localField.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              data-testid="field-placeholder-input"
            />
          </div>
        )}

        {/* Required */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Required Field</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localField.required}
              onChange={(e) => handleChange('required', e.target.checked)}
              className="sr-only peer"
              data-testid="field-required-toggle"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {/* Options for dropdown, multiselect, radio */}
        {['dropdown', 'multiselect', 'radio'].includes(localField.type) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Options
            </label>
            <div className="space-y-2">
              {(localField.options || []).map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionsChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    data-testid={`option-input-${index}`}
                  />
                  <button
                    onClick={() => removeOption(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    data-testid={`remove-option-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                data-testid="add-option-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            </div>
          </div>
        )}

        {/* Text for checkbox/toggle */}
        {['checkbox', 'toggle'].includes(localField.type) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Display Text
            </label>
            <input
              type="text"
              value={localField.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              data-testid="field-text-input"
            />
          </div>
        )}

        {/* Textarea rows */}
        {localField.type === 'textarea' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rows
            </label>
            <input
              type="number"
              value={localField.rows || 4}
              onChange={(e) => handleChange('rows', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="2"
              max="20"
            />
          </div>
        )}

        {/* Validation Rules */}
        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Validation Rules</h4>
          
          {/* Min/Max Length for text fields */}
          {['text', 'textarea'].includes(localField.type) && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Min Length
                </label>
                <input
                  type="number"
                  value={localField.validation?.minLength || ''}
                  onChange={(e) => handleValidationChange('minLength', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Length
                </label>
                <input
                  type="number"
                  value={localField.validation?.maxLength || ''}
                  onChange={(e) => handleValidationChange('maxLength', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </>
          )}

          {/* Min/Max for number fields */}
          {localField.type === 'number' && (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Min Value
                </label>
                <input
                  type="number"
                  value={localField.validation?.min || ''}
                  onChange={(e) => handleValidationChange('min', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Value
                </label>
                <input
                  type="number"
                  value={localField.validation?.max || ''}
                  onChange={(e) => handleValidationChange('max', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </>
          )}

          {/* Pattern for text fields */}
          {['text', 'phone'].includes(localField.type) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Custom Pattern (Regex)
              </label>
              <input
                type="text"
                value={localField.validation?.pattern || ''}
                onChange={(e) => handleValidationChange('pattern', e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder="^[a-zA-Z]+$"
              />
            </div>
          )}
        </div>

        {/* Conditional Visibility */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900">Conditional Visibility</h4>
            <button
              onClick={toggleConditionalVisibility}
              className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
              data-testid="toggle-conditional-visibility"
            >
              {localField.conditional_visibility ? (
                <><Eye className="w-4 h-4" /><span>Enabled</span></>
              ) : (
                <><EyeOff className="w-4 h-4" /><span>Disabled</span></>
              )}
            </button>
          </div>

          {localField.conditional_visibility && (
            <div className="space-y-3 bg-slate-50 p-3 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Show when field
                </label>
                <select
                  value={localField.conditional_visibility.dependsOn || ''}
                  onChange={(e) => handleConditionalChange('dependsOn', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  data-testid="conditional-depends-on"
                >
                  <option value="">Select a field...</option>
                  {allFields
                    .filter(f => f.id !== localField.id)
                    .map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Condition
                </label>
                <select
                  value={localField.conditional_visibility.condition || 'equals'}
                  onChange={(e) => handleConditionalChange('condition', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  data-testid="conditional-condition"
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="not_empty">Not Empty</option>
                  <option value="empty">Empty</option>
                </select>
              </div>

              {!['not_empty', 'empty'].includes(localField.conditional_visibility.condition) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    value={localField.conditional_visibility.value || ''}
                    onChange={(e) => handleConditionalChange('value', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Expected value"
                    data-testid="conditional-value"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldEditor;
