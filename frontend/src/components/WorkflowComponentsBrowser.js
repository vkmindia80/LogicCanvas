import React, { useState, useEffect } from 'react';
import { X, Package, Search, Plus, Edit, Trash2, Copy, Tag } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const WorkflowComponentsBrowser = ({ isOpen, onClose, onSelectComponent }) => {
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComponents();
      loadCategories();
    }
  }, [isOpen]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflow-components`);
      const data = await response.json();
      setComponents(data.components || []);
    } catch (error) {
      console.error('Failed to load components:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/workflow-components/categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const deleteComponent = async (componentId) => {
    if (!window.confirm('Are you sure you want to delete this component?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/workflow-components/${componentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadComponents();
      }
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = {
      'approval': 'bg-green-100 text-green-800',
      'data_processing': 'bg-green-100 text-green-800',
      'communication': 'bg-gold-100 text-gold-800',
      'logic': 'bg-gold-100 text-gold-800',
      'timing': 'bg-pink-100 text-pink-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['general'];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Workflow Component Library</h2>
                <p className="text-emerald-100 text-sm">Reusable workflow patterns and components</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-components-browser"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              data-testid="create-component-btn"
            >
              <Plus className="w-5 h-5" />
              <span>Create Component</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="mt-3 flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              All ({components.length})
            </button>
            {categories.map(category => {
              const count = components.filter(c => c.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {category.replace('_', ' ')} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading components...</div>
          ) : filteredComponents.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No components found</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Create your first component
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredComponents.map(component => (
                <div
                  key={component.id}
                  className="border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden bg-white"
                  data-testid={`component-${component.id}`}
                >
                  {/* Component Header */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{component.name}</h3>
                        <span className={`inline-block text-xs px-2 py-1 rounded ${getCategoryColor(component.category)} bg-white/20 text-white`}>
                          {component.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Component Body */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {component.description || 'No description'}
                    </p>

                    {/* Tags */}
                    {component.tags && component.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {component.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {component.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{component.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Pattern Info */}
                    <div className="text-xs text-gray-500 mb-3">
                      {component.pattern?.nodes?.length || 0} nodes
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (onSelectComponent) onSelectComponent(component);
                          onClose();
                        }}
                        className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                        data-testid={`use-${component.id}`}
                      >
                        <Copy className="w-4 h-4" />
                        <span>Use</span>
                      </button>
                      <button
                        onClick={() => deleteComponent(component.id)}
                        className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        data-testid={`delete-${component.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 text-center text-sm text-gray-600">
          Showing {filteredComponents.length} of {components.length} components
        </div>
      </div>
    </div>
  );
};

export default WorkflowComponentsBrowser;
