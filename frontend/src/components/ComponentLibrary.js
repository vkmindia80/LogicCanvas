import React, { useState, useEffect } from 'react';
import { X, Search, Layers, Package, Download, Eye, Plus, Filter, Grid, List, Star, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ComponentLibrary = ({ isOpen, onClose, onSelectComponent }) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [sortBy, setSortBy] = useState('usage'); // usage, name, date

  useEffect(() => {
    if (isOpen) {
      loadComponents();
    }
  }, [isOpen, searchQuery, selectedCategory]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const response = await fetch(`${BACKEND_URL}/api/workflow-components/search?${params}`);
      const data = await response.json();
      
      setComponents(data.components || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load components:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedComponents = [...components].sort((a, b) => {
    switch (sortBy) {
      case 'usage':
        return (b.usage_count || 0) - (a.usage_count || 0);
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'date':
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      default:
        return 0;
    }
  });

  const handleUseComponent = (component) => {
    if (onSelectComponent) {
      onSelectComponent(component);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Component Library</h2>
                <p className="text-violet-100 text-sm">Reusable workflow components and patterns</p>
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

        {/* Toolbar */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  data-testid="component-search"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                data-testid="category-filter"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              data-testid="sort-by"
            >
              <option value="usage">Most Used</option>
              <option value="name">Name</option>
              <option value="date">Newest</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-violet-100 text-violet-600' : 'text-gray-600 hover:bg-gray-100'}`}
                data-testid="view-grid"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-violet-100 text-violet-600' : 'text-gray-600 hover:bg-gray-100'}`}
                data-testid="view-list"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Components List/Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading components...</p>
              </div>
            </div>
          ) : sortedComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg">No components found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedComponents.map(component => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  onView={() => setSelectedComponent(component)}
                  onUse={() => handleUseComponent(component)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedComponents.map(component => (
                <ComponentListItem
                  key={component.id}
                  component={component}
                  onView={() => setSelectedComponent(component)}
                  onUse={() => handleUseComponent(component)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Component Details Modal */}
        {selectedComponent && (
          <ComponentDetailsModal
            component={selectedComponent}
            onClose={() => setSelectedComponent(null)}
            onUse={() => {
              handleUseComponent(selectedComponent);
              setSelectedComponent(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

const ComponentCard = ({ component, onView, onUse }) => {
  return (
    <div className="border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden bg-white group">
      {/* Thumbnail or Icon */}
      <div className="h-32 bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
        <Layers className="w-16 h-16 text-white opacity-80" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{component.name}</h3>
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
            v{component.version}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{component.description}</p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            {component.usage_count || 0} uses
          </span>
          <span className="bg-gray-100 px-2 py-1 rounded">{component.category}</span>
        </div>

        {/* Tags */}
        {component.tags && component.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {component.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={onView}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
            data-testid={`view-component-${component.id}`}
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          <button
            onClick={onUse}
            className="flex-1 px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
            data-testid={`use-component-${component.id}`}
          >
            <Plus className="w-4 h-4" />
            <span>Use</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ComponentListItem = ({ component, onView, onUse }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white flex items-center space-x-4">
      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
        <Layers className="w-8 h-8 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate">{component.name}</h3>
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
            v{component.version}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {component.category}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-1 mb-2">{component.description}</p>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            {component.usage_count || 0} uses
          </span>
          <span>{component.nodes?.length || 0} nodes</span>
        </div>
      </div>

      <div className="flex-shrink-0 flex space-x-2">
        <button
          onClick={onView}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          View
        </button>
        <button
          onClick={onUse}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
        >
          Use Component
        </button>
      </div>
    </div>
  );
};

const ComponentDetailsModal = ({ component, onClose, onUse }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{component.name}</h3>
            <p className="text-violet-100 text-sm">Version {component.version}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700">{component.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{component.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nodes:</span>
                  <span className="font-medium">{component.nodes?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Usage Count:</span>
                  <span className="font-medium">{component.usage_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(component.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Variables</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Inputs:</span>
                  <div className="mt-1 space-y-1">
                    {component.input_variables?.length > 0 ? (
                      component.input_variables.map((v, idx) => (
                        <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Outputs:</span>
                  <div className="mt-1 space-y-1">
                    {component.output_variables?.length > 0 ? (
                      component.output_variables.map((v, idx) => (
                        <span key={idx} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1">
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {component.tags && component.tags.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {component.tags.map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Structure</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                This component contains {component.nodes?.length || 0} nodes and {component.edges?.length || 0} connections
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onUse}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Use Component</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentLibrary;
