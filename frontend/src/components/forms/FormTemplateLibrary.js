import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Search, Filter, FileText, Users, DollarSign, Headphones,
  Package, Scale, TrendingUp, CheckCircle, Eye
} from 'lucide-react';
import { modalHeaderStyles, modalOverlayStyles } from '../../utils/designSystem';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const iconMap = {
  'Users': Users,
  'DollarSign': DollarSign,
  'Headphones': Headphones,
  'Scale': Scale,
  'Package': Package,
  'TrendingUp': TrendingUp,
  'FileText': FileText
};

const FormTemplateLibrary = ({ isOpen, onClose, onSelectTemplate, onNotify }) => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/form-templates`);
      const data = await response.json();
      setTemplates(data.templates || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading form templates:', error);
      onNotify?.('Failed to load form templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template) => {
    try {
      // Load full template data from backend
      const response = await fetch(`${BACKEND_URL}/api/form-templates/${template.category}/${template.id}`);
      const formData = await response.json();
      
      // Create a new form from template
      const newForm = {
        name: formData.name,
        description: formData.description,
        fields: formData.fields,
        tags: formData.tags || [],
        version: 1
      };
      
      onSelectTemplate(newForm);
      onNotify?.(`Template "${template.name}" loaded successfully!`, 'success');
      onClose();
    } catch (error) {
      console.error('Error loading template:', error);
      onNotify?.('Failed to load template. Please try again.', 'error');
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={modalOverlayStyles.base}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className={modalHeaderStyles.base}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h2 className={modalHeaderStyles.title}>Form Template Library</h2>
                <p className={modalHeaderStyles.subtitle}>
                  {templates.length} ready-to-use form templates
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={modalHeaderStyles.closeButton}
              data-testid="close-form-template-library"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="border-b border-green-200 p-4 bg-green-50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
              <input
                type="text"
                placeholder="Search form templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="form-template-search"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-green-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="form-category-filter"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.template_count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates found</h3>
              <p className="text-gray-500">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const IconComponent = iconMap[template.icon] || FileText;
                return (
                  <div
                    key={template.id}
                    className="border-2 border-green-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-xl transition-all bg-white group"
                    data-testid={`form-template-card-${template.id}`}
                  >
                    {/* Icon and Category */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary-600" />
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-primary-600 rounded-full font-medium">
                        {template.category_display}
                      </span>
                    </div>

                    {/* Template Info */}
                    <h3 className="font-bold text-primary-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-primary-600 mb-4 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-green-600 mb-4 pb-4 border-b border-green-100">
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {template.field_count} fields
                      </span>
                      <span className="text-xs text-green-400">v{template.version}</span>
                    </div>

                    {/* Tags */}
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePreview(template)}
                        className="flex-1 px-3 py-2 border-2 border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                        data-testid={`preview-template-${template.id}`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-semibold flex items-center justify-center space-x-1"
                        data-testid={`use-template-${template.id}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Use</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {selectedTemplate && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              {/* Preview Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{selectedTemplate.name}</h3>
                    <p className="text-primary-100">{selectedTemplate.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <span className="text-sm text-gray-500">Category:</span>
                      <span className="ml-2 font-medium text-primary-900">
                        {selectedTemplate.category_display}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Fields:</span>
                      <span className="ml-2 font-medium text-primary-900">
                        {selectedTemplate.field_count}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-100 text-primary-600 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>What you'll get:</strong> A pre-configured form with {selectedTemplate.field_count} fields 
                      including proper validation, field types, and best practices for {selectedTemplate.category_display.toLowerCase()}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Footer */}
              <div className="border-t p-6 flex space-x-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleUseTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormTemplateLibrary;
