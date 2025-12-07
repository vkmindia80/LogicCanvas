import React, { useState, useEffect } from 'react';
import { X, Package, Search, Filter, Plus, Download, Trash2, Star, TrendingUp, Tag } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const WorkflowComponentLibrary = ({ isOpen, onClose, onInsertComponent }) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [categories] = useState([
    'all',
    'approval',
    'data_processing',
    'integration',
    'notification',
    'custom'
  ]);

  useEffect(() => {
    if (isOpen) {
      loadComponents();
    }
  }, [isOpen, selectedCategory, searchTerm]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/workflow-components?`;
      if (selectedCategory && selectedCategory !== 'all') {
        url += `category=${selectedCategory}&`;
      }
      if (searchTerm) {
        url += `search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setComponents(data.components || []);
    } catch (error) {
      console.error('Failed to load components:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertComponent = async (component) => {
    try {
      // Increment usage count
      await fetch(`${BACKEND_URL}/api/workflow-components/${component.id}/increment-usage`, {
        method: 'POST'
      });

      // Pass component to parent
      onInsertComponent(component);
      onClose();
    } catch (error) {
      console.error('Failed to insert component:', error);
    }
  };

  const handleDeleteComponent = async (componentId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this component?')) {
      return;
    }

    try {
      await fetch(`${BACKEND_URL}/api/workflow-components/${componentId}`, {
        method: 'DELETE'
      });
      
      // Reload components
      loadComponents();
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      approval: 'bg-green-100 text-green-700',
      data_processing: 'bg-green-100 text-green-700',
      integration: 'bg-gold-100 text-gold-700',
      notification: 'bg-yellow-100 text-yellow-700',
      custom: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.custom;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      approval: '✓',
      data_processing: '⚙',
      integration: '🔗',
      notification: '🔔',
      custom: '📦'
    };
    return icons[category] || icons.custom;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Component Library</h2>
                <p className="text-green-100 text-sm">Browse and insert reusable workflow components</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-component-library"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                data-testid="search-components"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                data-testid="filter-category"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Component Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading components...</p>
              </div>
            </div>
          ) : components.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Components Found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your filters or search term'
                  : 'Create your first component by selecting nodes in the canvas'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {components.map(component => (
                <div
                  key={component.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-green-300 transition-all cursor-pointer bg-white"
                  onClick={() => setSelectedComponent(component)}
                  data-testid={`component-card-${component.id}`}
                >
                  {/* Component Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-2xl">{getCategoryIcon(component.category)}</span>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{component.name}</h3>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(component.category)}`}>
                        {component.category.replace('_', ' ')}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteComponent(component.id, e)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      data-testid={`delete-component-${component.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {component.description || 'No description provided'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center space-x-1">
                      <Package className="w-3 h-3" />
                      <span>{component.nodes?.length || 0} nodes</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{component.usage_count || 0} uses</span>
                    </span>
                  </div>

                  {/* Tags */}
                  {component.tags && component.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {component.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {component.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{component.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Insert Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsertComponent(component);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    data-testid={`insert-component-${component.id}`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Insert Component</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Component Details Modal */}
        {selectedComponent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedComponent(null)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedComponent.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(selectedComponent.category)}`}>
                    {selectedComponent.category.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">{selectedComponent.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Nodes</div>
                  <div className="text-xl font-semibold text-gray-900">{selectedComponent.nodes?.length || 0}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Usage Count</div>
                  <div className="text-xl font-semibold text-gray-900">{selectedComponent.usage_count || 0}</div>
                </div>
              </div>

              {selectedComponent.input_variables && selectedComponent.input_variables.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Input Variables</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedComponent.input_variables.map((varName, idx) => (
                      <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {varName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedComponent.output_variables && selectedComponent.output_variables.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Output Variables</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedComponent.output_variables.map((varName, idx) => (
                      <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {varName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleInsertComponent(selectedComponent);
                    setSelectedComponent(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Insert Component</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {components.length} component{components.length !== 1 ? 's' : ''} available
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowComponentLibrary;
