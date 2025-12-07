import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Package, Download, Upload, Star, Clock, Users, Tag, Edit, Trash2, Copy, BookOpen } from 'lucide-react';

const WorkflowComponentsLibrary = ({ isOpen, onClose, onUseComponent }) => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const categories = [
    { value: 'all', label: 'All Components' },
    { value: 'approval', label: 'Approval Flows' },
    { value: 'data_processing', label: 'Data Processing' },
    { value: 'notification', label: 'Notifications' },
    { value: 'integration', label: 'Integrations' },
    { value: 'error_handling', label: 'Error Handling' },
    { value: 'custom', label: 'Custom' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadComponents();
    }
  }, [isOpen]);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/workflow-components`);
      const data = await response.json();
      setComponents(data.components || []);
    } catch (error) {
      console.error('Failed to load components:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComponent = async (componentId) => {
    if (!window.confirm('Are you sure you want to delete this component?')) return;
    
    try {
      await fetch(`${BACKEND_URL}/api/workflow-components/${componentId}`, {
        method: 'DELETE'
      });
      loadComponents();
    } catch (error) {
      console.error('Failed to delete component:', error);
    }
  };

  const filteredComponents = components.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-gold-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Workflow Components Library</h2>
                <p className="text-green-100 text-sm">Reusable building blocks for your workflows</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-components-library"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search components..."
                className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Component
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="border-b border-green-200 p-4 bg-green-50">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {categories.map(category => {
              const count = category.value === 'all' 
                ? components.length 
                : components.filter(c => c.category === category.value).length;
              
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    selectedCategory === category.value
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-primary-700 border border-green-300 hover:bg-green-100'
                  }`}
                >
                  {category.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Components Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-primary-600 text-lg font-medium">No components found</p>
              <p className="text-green-500 text-sm mt-2">Try adjusting your search or create a new component</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComponents.map(component => (
                <div
                  key={component.id}
                  className="border border-green-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden bg-white"
                  data-testid={`component-${component.id}`}
                >
                  {/* Component Header */}
                  <div className="bg-gradient-to-r from-green-500 to-gold-500 p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{component.name}</h3>
                        <p className="text-xs text-green-100">v{component.version}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {component.is_public && (
                          <div className="px-2 py-1 bg-white/20 rounded text-xs">Public</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Component Body */}
                  <div className="p-4">
                    <p className="text-sm text-primary-600 mb-4 line-clamp-2">{component.description || 'No description'}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <Users className="w-4 h-4 mx-auto mb-1 text-primary-600" />
                        <div className="font-semibold text-primary-900">{component.usage_count || 0}</div>
                        <div className="text-green-500">Uses</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <Package className="w-4 h-4 mx-auto mb-1 text-primary-600" />
                        <div className="font-semibold text-primary-900">{component.nodes?.length || 0}</div>
                        <div className="text-green-500">Nodes</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-primary-600" />
                        <div className="font-semibold text-primary-900">{new Date(component.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="text-green-500">Created</div>
                      </div>
                    </div>

                    {/* Tags */}
                    {component.tags && component.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {component.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-green-100 text-primary-700 px-2 py-1 rounded flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                          {component.tags.length > 3 && (
                            <span className="text-xs text-green-500">+{component.tags.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedComponent(component)}
                        className="flex-1 px-3 py-2 bg-green-100 text-primary-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                        data-testid={`view-${component.id}`}
                      >
                        <BookOpen className="w-4 h-4 inline mr-1" />
                        Details
                      </button>
                      <button
                        onClick={() => {
                          if (onUseComponent) onUseComponent(component);
                          onClose();
                        }}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        data-testid={`use-${component.id}`}
                      >
                        <Download className="w-4 h-4 inline mr-1" />
                        Use
                      </button>
                      <button
                        onClick={() => handleDeleteComponent(component.id)}
                        className="px-3 py-2 border border-gold-300 text-gold-600 rounded-lg hover:bg-gold-50 transition-colors"
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

        {/* Component Details Modal */}
        {selectedComponent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-gold-600 text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedComponent.name}</h3>
                  <p className="text-green-100 text-sm">Version {selectedComponent.version}</p>
                </div>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="mb-6">
                  <h4 className="font-semibold text-primary-900 mb-2">Description</h4>
                  <p className="text-primary-700">{selectedComponent.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-primary-900 mb-3">Input Variables</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      {selectedComponent.input_variables?.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedComponent.input_variables.map((variable, idx) => (
                            <li key={idx} className="text-sm">
                              <span className="font-medium text-primary-900">{variable.name}</span>
                              <span className="text-green-500"> ({variable.type})</span>
                              {variable.required && <span className="text-gold-500 ml-1">*</span>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-500">No input variables</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-primary-900 mb-3">Output Variables</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      {selectedComponent.output_variables?.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedComponent.output_variables.map((variable, idx) => (
                            <li key={idx} className="text-sm">
                              <span className="font-medium text-primary-900">{variable.name}</span>
                              <span className="text-green-500"> ({variable.type})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-green-500">No output variables</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-primary-900 mb-3">Component Structure</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-primary-600">Nodes:</span>
                        <span className="ml-2 font-medium text-primary-900">{selectedComponent.nodes?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-primary-600">Connections:</span>
                        <span className="ml-2 font-medium text-primary-900">{selectedComponent.edges?.length || 0}</span>
                      </div>
                      <div>
                        <span className="text-primary-600">Category:</span>
                        <span className="ml-2 font-medium text-primary-900">{selectedComponent.category}</span>
                      </div>
                      <div>
                        <span className="text-primary-600">Usage Count:</span>
                        <span className="ml-2 font-medium text-primary-900">{selectedComponent.usage_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedComponent(null)}
                    className="px-4 py-2 border border-green-300 text-primary-700 rounded-lg hover:bg-green-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (onUseComponent) onUseComponent(selectedComponent);
                      setSelectedComponent(null);
                      onClose();
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Use This Component</span>
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

export default WorkflowComponentsLibrary;
