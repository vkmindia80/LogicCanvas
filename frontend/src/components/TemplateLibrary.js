import React, { useState, useEffect } from 'react';
import {
  X, Search, Filter, Package, Users, DollarSign, ShoppingCart,
  FileText, Headphones, Clock, Layers, CheckCircle, Star
} from 'lucide-react';

const iconMap = {
  'users': Users,
  'dollar-sign': DollarSign,
  'shopping-cart': ShoppingCart,
  'file-text': FileText,
  'headphones': Headphones
};

const complexityColors = {
  'low': 'bg-green-100 text-green-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'high': 'bg-orange-100 text-orange-800'
};

const TemplateLibrary = ({ isOpen, onClose, onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Load template index
      const response = await fetch('/templates/index.json');
      const data = await response.json();
      setTemplates(data.templates || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
                           template.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template) => {
    try {
      // Load template workflow definition
      const response = await fetch(`/templates/${template.file}`);
      const workflowData = await response.json();
      
      // Pass to parent
      onSelectTemplate(workflowData);
      onClose();
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  if (!isOpen) {
    return null;
  }


      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Template Library</h2>
              <p className="text-indigo-100 text-sm">Start with production-ready workflow templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            data-testid="close-template-library"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                data-testid="template-search"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                data-testid="category-filter"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No templates found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => {
                const IconComponent = iconMap[template.icon] || Package;
                return (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden bg-white group"
                    data-testid={`template-${template.id}`}
                  >
                    {/* Template Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <p className="text-xs text-indigo-100">{template.category}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Template Body */}
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Layers className="w-4 h-4" />
                          <span>{template.nodeCount} nodes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{template.estimatedSetupTime}</span>
                        </div>
                      </div>

                      {/* Complexity Badge */}
                      <div className="mb-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${complexityColors[template.complexity]}`}>
                          {template.complexity.charAt(0).toUpperCase() + template.complexity.slice(1)} Complexity
                        </span>
                      </div>

                      {/* Features */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Key Features:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {template.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          data-testid={`preview-${template.id}`}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                          data-testid={`use-${template.id}`}
                        >
                          <Star className="w-4 h-4" />
                          <span>Use Template</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Template Details Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scale-in">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedTemplate.name}</h3>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <p className="text-gray-700 mb-4">{selectedTemplate.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Features:</h4>
                  <ul className="space-y-2">
                    {selectedTemplate.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Use Cases:</h4>
                  <ul className="space-y-1">
                    {selectedTemplate.useCases.map((useCase, idx) => (
                      <li key={idx} className="text-gray-700 ml-4">• {useCase}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleUseTemplate(selectedTemplate)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                  >
                    <Star className="w-4 h-4" />
                    <span>Use This Template</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;