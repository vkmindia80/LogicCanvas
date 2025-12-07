import React, { useState, useRef } from 'react';
import { Star, Plus, Trash2 } from 'lucide-react';

const FormRenderer = ({ fields, formData = {}, onChange = () => {}, readOnly = false }) => {
  const [localData, setLocalData] = useState(formData);
  const canvasRefs = useRef({});

  const handleFieldChange = (fieldId, value) => {
    const newData = { ...localData, [fieldId]: value };
    setLocalData(newData);
    onChange(newData);
  };

  const checkConditionalVisibility = (field) => {
    if (!field.conditional_visibility || !field.conditional_visibility.enabled) {
      return true;
    }

    const { dependsOn, condition, value: expectedValue } = field.conditional_visibility;
    const actualValue = localData[dependsOn];

    switch (condition) {
      case 'equals':
        return actualValue === expectedValue || actualValue == expectedValue; // eslint-disable-line eqeqeq
      case 'not_equals':
        return actualValue !== expectedValue && actualValue != expectedValue; // eslint-disable-line eqeqeq
      case 'contains':
        return actualValue && actualValue.toString().includes(expectedValue);
      case 'not_empty':
        return actualValue != null && actualValue !== '';
      case 'empty':
        return actualValue == null || actualValue === '';
      default:
        return true;
    }
  };

  const renderField = (field) => {
    if (!checkConditionalVisibility(field)) {
      return null;
    }

    const commonClasses = "w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent";
    const value = localData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <input
              type={field.type === 'text' ? 'text' : field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              disabled={readOnly}
              className={commonClasses}
              pattern={field.validation?.pattern || undefined}
              minLength={field.validation?.minLength || undefined}
              maxLength={field.validation?.maxLength || undefined}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              disabled={readOnly}
              rows={field.rows || 4}
              className={commonClasses + " resize-none"}
              minLength={field.validation?.minLength || undefined}
              maxLength={field.validation?.maxLength || undefined}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              disabled={readOnly}
              className={commonClasses}
              min={field.validation?.min || undefined}
              max={field.validation?.max || undefined}
              step={field.validation?.step || 1}
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={readOnly}
              className={commonClasses}
              min={field.validation?.minDate || undefined}
              max={field.validation?.maxDate || undefined}
            />
          </div>
        );

      case 'datetime':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={readOnly}
              className={commonClasses}
            />
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              disabled={readOnly}
              className={commonClasses}
            >
              <option value="">{field.placeholder || 'Select an option...'}</option>
              {(field.options || []).map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {(field.options || []).map((option, idx) => (
                <label key={idx} className="flex items-center space-x-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(value || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(v => v !== option);
                      handleFieldChange(field.id, newValues);
                    }}
                    disabled={readOnly}
                    className="w-4 h-4 text-primary-600 border-green-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-primary-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="flex items-center space-x-3 p-4 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                required={field.required}
                disabled={readOnly}
                className="w-5 h-5 text-primary-600 border-green-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-primary-700">
                  {field.text || field.label}
                  {field.required && <span className="text-gold-500 ml-1">*</span>}
                </span>
              </div>
            </label>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {(field.options || []).map((option, idx) => (
                <label key={idx} className="flex items-center space-x-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    required={field.required}
                    disabled={readOnly}
                    className="w-4 h-4 text-primary-600 border-green-300 focus:ring-primary-500"
                  />
                  <span className="text-primary-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'toggle':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <div className="flex items-center justify-between p-4 border border-green-200 rounded-lg">
              <div>
                <label className="text-sm font-medium text-primary-700">
                  {field.text || field.label}
                  {field.required && <span className="text-gold-500 ml-1">*</span>}
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value || false}
                  onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                  disabled={readOnly}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-green-200 peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-green-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        );

      case 'file':
      case 'image':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept={field.accept || '*'}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && file.size <= (field.maxSize * 1024 * 1024)) {
                    handleFieldChange(field.id, file);
                  } else if (file) {
                    alert(`File size exceeds ${field.maxSize}MB`);
                  }
                }}
                required={field.required}
                disabled={readOnly}
                className="hidden"
                id={`file-${field.id}`}
              />
              <label htmlFor={`file-${field.id}`} className="cursor-pointer">
                <div className="text-primary-600">
                  {value ? (
                    <span className="text-primary-600 font-medium">{value.name || 'File selected'}</span>
                  ) : (
                    <>
                      <p className="font-medium">Click to upload</p>
                      <p className="text-sm mt-1">Max size: {field.maxSize}MB</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <div className="border-2 border-green-300 rounded-lg overflow-hidden">
              <canvas
                ref={(ref) => canvasRefs.current[field.id] = ref}
                width={600}
                height={200}
                className="w-full bg-white cursor-crosshair"
                onMouseDown={(e) => {
                  if (readOnly) return;
                  const canvas = canvasRefs.current[field.id];
                  const ctx = canvas.getContext('2d');
                  ctx.beginPath();
                  ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                  canvas.isDrawing = true;
                }}
                onMouseMove={(e) => {
                  if (readOnly) return;
                  const canvas = canvasRefs.current[field.id];
                  if (!canvas.isDrawing) return;
                  const ctx = canvas.getContext('2d');
                  ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                  ctx.stroke();
                }}
                onMouseUp={() => {
                  if (readOnly) return;
                  const canvas = canvasRefs.current[field.id];
                  canvas.isDrawing = false;
                  handleFieldChange(field.id, canvas.toDataURL());
                }}
              />
              <div className="p-2 bg-green-50 flex justify-between items-center">
                <span className="text-xs text-green-500">Sign above</span>
                <button
                  type="button"
                  onClick={() => {
                    const canvas = canvasRefs.current[field.id];
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    handleFieldChange(field.id, null);
                  }}
                  disabled={readOnly}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <div className="flex space-x-2">
              {[...Array(field.maxRating || 5)].map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleFieldChange(field.id, idx + 1)}
                  disabled={readOnly}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (value || 0) > idx
                        ? 'text-gold-400 fill-yellow-400'
                        : 'text-green-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        );

      case 'slider':
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={field.min || 0}
                max={field.max || 100}
                step={field.step || 1}
                value={value || field.min || 0}
                onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value))}
                disabled={readOnly}
                className="flex-1 h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <span className="text-lg font-semibold text-primary-900 w-12 text-right">
                {value || field.min || 0}
              </span>
            </div>
          </div>
        );

      case 'repeatable':
        const items = value || [{}];
        return (
          <div key={field.id} className="mb-6" data-testid={`field-${field.id}`}>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              {field.label}
              {field.required && <span className="text-gold-500 ml-1">*</span>}
            </label>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-primary-700">Item {idx + 1}</span>
                    {items.length > (field.minItems || 1) && (
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = items.filter((_, i) => i !== idx);
                          handleFieldChange(field.id, newItems);
                        }}
                        disabled={readOnly}
                        className="text-gold-600 hover:text-gold-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Placeholder for repeatable field content */}
                  <input
                    type="text"
                    value={item.value || ''}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx] = { ...item, value: e.target.value };
                      handleFieldChange(field.id, newItems);
                    }}
                    disabled={readOnly}
                    className={commonClasses}
                    placeholder="Enter value..."
                  />
                </div>
              ))}
              {items.length < (field.maxItems || 10) && (
                <button
                  type="button"
                  onClick={() => {
                    const newItems = [...items, {}];
                    handleFieldChange(field.id, newItems);
                  }}
                  disabled={readOnly}
                  className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-green-300 rounded-lg text-primary-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {fields.map(field => renderField(field))}
    </div>
  );
};

export default FormRenderer;
