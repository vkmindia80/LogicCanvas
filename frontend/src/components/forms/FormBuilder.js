import React, { useState } from 'react';
import { Save, Eye, ArrowLeft, Settings, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import FieldPalette from './FieldPalette';
import FieldEditor from './FieldEditor';
import FormRenderer from './FormRenderer';
import { getFieldTypeById } from '../../utils/fieldTypes';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const OPTION_FIELD_TYPES = ['dropdown', 'multiselect', 'radio'];

const FormBuilder = ({ form, onBack }) => {
  const [formData, setFormData] = useState({
    id: form?.id || null,
    name: form?.name || 'Untitled Form',
    description: form?.description || '',
    fields: form?.fields || [],
    version: form?.version || 1,
    tags: form?.tags || [],
  });
  const [selectedField, setSelectedField] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formErrorSummary, setFormErrorSummary] = useState('');

  const handleAddField = (fieldType) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: fieldType.id,
      ...fieldType.defaultProps,
    };

    setFormData({
      ...formData,
      fields: [...formData.fields, newField],
    });

    setSelectedField(newField);
  };

  const handleUpdateField = (updatedField) => {
    setFormData({
      ...formData,
      fields: formData.fields.map((f) => (f.id === updatedField.id ? updatedField : f)),
    });
    setSelectedField(updatedField);
  };

  const handleDeleteField = (fieldId) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      setFormData({
        ...formData,
        fields: formData.fields.filter((f) => f.id !== fieldId),
      });
      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFields = [...formData.fields];
    const draggedField = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedField);

    setFormData({ ...formData, fields: newFields });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const validateForm = () => {
    const errorsByField = {};
    const messages = [];

    if (!formData.name || !formData.name.trim()) {
      messages.push('Form name is required.');
    }

    const seenIds = new Set();
    for (const field of formData.fields) {
      const fieldIssues = [];

      // Unique ID check
      if (seenIds.has(field.id)) {
        fieldIssues.push('Duplicate field ID detected.');
      } else {
        seenIds.add(field.id);
      }

      // Label required
      if (!field.label || !String(field.label).trim()) {
        fieldIssues.push('Label is required.');
      }

      // Options required for certain field types
      if (OPTION_FIELD_TYPES.includes(field.type)) {
        if (!Array.isArray(field.options) || field.options.length === 0) {
          fieldIssues.push('At least one option is required.');
        }
      }

      if (fieldIssues.length > 0) {
        errorsByField[field.id] = fieldIssues;
      }
    }

    if (Object.keys(errorsByField).length > 0 || messages.length > 0) {
      const totalIssues = Object.keys(errorsByField).length + messages.length;
      setFieldErrors(errorsByField);
      setFormErrorSummary(
        `${totalIssues} issue${totalIssues > 1 ? 's' : ''} found. Please fix the highlighted fields before saving.`,
      );

      // Scroll to first problematic field if any
      const firstFieldId = Object.keys(errorsByField)[0];
      if (firstFieldId) {
        const el = document.getElementById(`field-card-${firstFieldId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return false;
    }

    setFieldErrors({});
    setFormErrorSummary('');
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id
        ? `${BACKEND_URL}/api/forms/${formData.id}`
        : `${BACKEND_URL}/api/forms`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Form saved successfully!');
        if (!formData.id && result.id) {
          setFormData({ ...formData, id: result.id });
        }
      } else {
        alert(result.detail || 'Failed to save form');
      }
    } catch (error) {
      console.error('Failed to save form:', error);
      alert('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const hasFieldError = (fieldId) => !!fieldErrors[fieldId];

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            data-testid="back-to-forms-btn"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Forms</span>
          </button>
          <div className="h-6 w-px bg-slate-300" />
          <div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-xl font-semibold text-slate-900 border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
              placeholder="Form name"
              data-testid="form-name-input"
            />
            <p className="text-sm text-slate-500 px-2">{formData.fields.length} fields</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              previewMode
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            data-testid="toggle-preview-btn"
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? 'Edit Mode' : 'Preview'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            data-testid="save-form-btn"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Form'}</span>
          </button>
        </div>
      </header>

      {/* Validation summary */}
      {formErrorSummary && !previewMode && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-3 flex items-center space-x-2" data-testid="form-error-summary">
          <AlertTriangle className="w-4 h-4" />
          <p className="text-sm">{formErrorSummary}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {!previewMode && <FieldPalette onAddField={handleAddField} />}

        {/* Form Canvas */}
        <div className="flex-1 overflow-y-auto p-8">
          {previewMode ? (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{formData.name}</h2>
                {formData.description && <p className="text-slate-600 mb-6">{formData.description}</p>}
                <FormRenderer fields={formData.fields} />
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
                {/* Form Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Form Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows="2"
                    placeholder="Optional form description"
                    data-testid="form-description-input"
                  />
                </div>

                {/* Fields */}
                {formData.fields.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-lg">
                    <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No fields yet</h3>
                    <p className="text-slate-500">Add fields from the palette on the left</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.fields.map((field, index) => {
                      const fieldType = getFieldTypeById(field.type);
                      const Icon = fieldType?.icon;
                      const hasError = hasFieldError(field.id);

                      return (
                        <div
                          key={field.id}
                          id={`field-card-${field.id}`}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedField(field)}
                          className={`group p-4 border-2 rounded-lg cursor-move transition-all ${
                            selectedField?.id === field.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          } ${hasError ? 'border-red-500 bg-red-50' : ''}`}
                          data-testid={`field-item-${field.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <GripVertical className="w-5 h-5 text-slate-400 mt-1 cursor-grab active:cursor-grabbing" />
                              {Icon && <Icon className="w-5 h-5 text-slate-600 mt-1" />}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-slate-900">{field.label}</span>
                                  {field.required && <span className="text-red-500 text-sm">*</span>}
                                  {field.conditional_visibility && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                      Conditional
                                    </span>
                                  )}
                                  {hasError && (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded flex items-center space-x-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Fix field</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                  {fieldType?.label} • {field.type}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteField(field.id);
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              data-testid={`delete-field-${field.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Field Editor */}
        {!previewMode && selectedField && (
          <FieldEditor
            field={selectedField}
            allFields={formData.fields}
            onUpdate={handleUpdateField}
            onClose={() => setSelectedField(null)}
          />
        )}
      </div>
    </div>
  );
};

export default FormBuilder;
