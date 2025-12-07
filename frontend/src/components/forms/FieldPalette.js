import React from 'react';
import { getFieldsByCategory } from '../../utils/fieldTypes';

const FieldPalette = ({ onAddField }) => {
  const categories = getFieldsByCategory();

  const categoryLabels = {
    basic: 'Basic Fields',
    'date-time': 'Date & Time',
    choice: 'Choice Fields',
    media: 'Media',
    advanced: 'Advanced'
  };

  return (
    <div className="w-72 bg-white border-r border-green-200 overflow-y-auto">
      <div className="p-4 border-b border-green-200">
        <h3 className="font-semibold text-primary-900">Field Types</h3>
        <p className="text-xs text-green-500 mt-1">Drag or click to add fields</p>
      </div>

      <div className="p-4 space-y-6">
        {Object.entries(categories).map(([category, fields]) => (
          <div key={category}>
            <h4 className="text-xs font-semibold text-green-500 uppercase mb-3">
              {categoryLabels[category]}
            </h4>
            <div className="space-y-2">
              {fields.map((field) => {
                const Icon = field.icon;
                return (
                  <button
                    key={field.id}
                    onClick={() => onAddField(field)}
                    className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-primary-50 hover:border-primary-300 border-2 border-green-200 rounded-lg transition-all group cursor-pointer"
                    data-testid={`add-field-${field.id}`}
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <Icon className="w-4 h-4 text-primary-600 group-hover:text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-primary-700 group-hover:text-primary-700">
                      {field.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldPalette;
