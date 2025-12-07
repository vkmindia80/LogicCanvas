import React, { useState, useEffect } from 'react';
import { X, Sparkles, Search, Filter, Download, Star, Zap, Grid, List } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const CompositionPatternCatalog = ({ isOpen, onClose, onInsertPattern }) => {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const categories = [
    { value: '', label: 'All Patterns' },
    { value: 'approval_chain', label: 'Approval Chain', icon: '✓' },
    { value: 'data_pipeline', label: 'Data Pipeline', icon: '⚙' },
    { value: 'notification_flow', label: 'Notification Flow', icon: '🔔' },
    { value: 'error_handling', label: 'Error Handling', icon: '⚠' },
    { value: 'parallel_processing', label: 'Parallel Processing', icon: '⚡' },
    { value: 'sequential_approval', label: 'Sequential Approval', icon: '→' },
    { value: 'conditional_routing', label: 'Conditional Routing', icon: '🔀' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadPatterns();
    }
  }, [isOpen, selectedCategory, showFeaturedOnly]);

  const loadPatterns = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/composition-patterns?`;
      if (selectedCategory) {
        url += `category=${selectedCategory}&`;
      }
      if (showFeaturedOnly) {
        url += `featured=true`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setPatterns(data.patterns || []);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultPatterns = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/composition-patterns/initialize-defaults`, {
        method: 'POST'
      });
      loadPatterns();
    } catch (error) {
      console.error('Failed to initialize patterns:', error);
    }
  };

  const handleInsertPattern = async (pattern) => {
    try {
      // For now, pass the pattern directly to parent
      // In a full implementation, we'd show a configuration dialog first
      const response = await fetch(`${BACKEND_URL}/api/composition-patterns/${pattern.id}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_configs: {} })
      });

      const data = await response.json();
      
      // Pass instantiated nodes and edges to parent
      onInsertPattern(data);
      onClose();
    } catch (error) {
      console.error('Failed to insert pattern:', error);
    }
  };

  const getCategoryInfo = (categoryValue) => {
    const cat = categories.find(c => c.value === categoryValue);
    return cat || { label: categoryValue, icon: '📦' };
  };

  const getCategoryColor = (category) => {
    const colors = {
      approval_chain: 'bg-green-100 text-green-700 border-green-200',
      data_pipeline: 'bg-green-100 text-green-700 border-green-200',
      notification_flow: 'bg-gold-100 text-gold-700 border-gold-200',
      error_handling: 'bg-red-100 text-red-700 border-red-200',
      parallel_processing: 'bg-gold-100 text-gold-700 border-gold-200',
      sequential_approval: 'bg-green-100 text-green-700 border-green-200',
      conditional_routing: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-gold-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Composition Pattern Catalog</h2>
                <p className="text-gold-100 text-sm">Pre-built workflow patterns for common use cases</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-pattern-catalog"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 items-center flex-1">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  data-testid="filter-pattern-category"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon && `${cat.icon} `}{cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured Filter */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeaturedOnly}
                  onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                  className="w-4 h-4 text-gold-600 border-gray-300 rounded focus:ring-gold-500"
                  data-testid="filter-featured"
                />
                <Star className="w-4 h-4 text-gold-500" />
                <span className="text-sm text-gray-700">Featured Only</span>
              </label>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gold-100 text-gold-700' : 'text-gray-600'}`}
                data-testid="view-grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gold-100 text-gold-700' : 'text-gray-600'}`}
                data-testid="view-list"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Pattern Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading patterns...</p>
              </div>
            </div>
          ) : patterns.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Patterns Found</h3>
              <p className="text-gray-500 mb-4">
                Initialize default patterns to get started
              </p>
              <button
                onClick={initializeDefaultPatterns}
                className="px-6 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors"
                data-testid="initialize-patterns"
              >
                Initialize Default Patterns
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'space-y-4'
            }>
              {patterns.map(pattern => {
                const categoryInfo = getCategoryInfo(pattern.category);
                
                return (
                  <div
                    key={pattern.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-gold-300 transition-all cursor-pointer bg-white ${
                      viewMode === 'list' ? 'flex items-start space-x-4' : ''
                    }`}
                    onClick={() => setSelectedPattern(pattern)}
                    data-testid={`pattern-card-${pattern.id}`}
                  >
                    {/* Pattern Icon */}
                    <div className={`${viewMode === 'list' ? 'flex-shrink-0' : 'mb-3'}`}>
                      <div className={`w-12 h-12 rounded-lg border-2 ${getCategoryColor(pattern.category)} flex items-center justify-center text-2xl`}>
                        {categoryInfo.icon}
                      </div>
                    </div>

                    {/* Pattern Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{pattern.name}</h3>
                            {pattern.is_featured && (
                              <Star className="w-4 h-4 text-gold-500 fill-yellow-500" />
                            )}
                          </div>
                          <span className={`inline-block text-xs px-2 py-1 rounded-full border ${getCategoryColor(pattern.category)}`}>
                            {categoryInfo.label}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {pattern.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <span>{pattern.template_nodes?.length || 0} nodes</span>
                        <span>{pattern.template_edges?.length || 0} connections</span>
                      </div>

                      {/* Tags */}
                      {pattern.tags && pattern.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {pattern.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                          {pattern.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{pattern.tags.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Insert Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertPattern(pattern);
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors text-sm font-medium"
                        data-testid={`insert-pattern-${pattern.id}`}
                      >
                        <Download className="w-4 h-4" />
                        <span>Use This Pattern</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pattern Details Modal */}
        {selectedPattern && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
            onClick={() => setSelectedPattern(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg border-2 ${getCategoryColor(selectedPattern.category)} flex items-center justify-center text-2xl`}>
                    {getCategoryInfo(selectedPattern.category).icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-bold text-gray-900">{selectedPattern.name}</h3>
                      {selectedPattern.is_featured && (
                        <Star className="w-5 h-5 text-gold-500 fill-yellow-500" />
                      )}
                    </div>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full border mt-1 ${getCategoryColor(selectedPattern.category)}`}>
                      {getCategoryInfo(selectedPattern.category).label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPattern(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">{selectedPattern.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gold-50 p-4 rounded-lg border border-gold-100">
                  <div className="text-sm text-gold-700 mb-1 font-medium">Nodes</div>
                  <div className="text-2xl font-bold text-gold-900">{selectedPattern.template_nodes?.length || 0}</div>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                  <div className="text-sm text-pink-700 mb-1 font-medium">Connections</div>
                  <div className="text-2xl font-bold text-pink-900">{selectedPattern.template_edges?.length || 0}</div>
                </div>
              </div>

              {selectedPattern.tags && selectedPattern.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPattern.tags.map((tag, idx) => (
                      <span key={idx} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview nodes list */}
              {selectedPattern.template_nodes && selectedPattern.template_nodes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Included Nodes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPattern.template_nodes.map((node, idx) => (
                      <div key={idx} className="text-sm bg-gray-50 text-gray-700 px-3 py-2 rounded border border-gray-200">
                        <span className="font-medium">{node.data?.label || node.type}</span>
                        <span className="text-xs text-gray-500 ml-2">({node.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedPattern(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleInsertPattern(selectedPattern);
                    setSelectedPattern(null);
                  }}
                  className="px-6 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Use This Pattern</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {patterns.length} pattern{patterns.length !== 1 ? 's' : ''} available
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

export default CompositionPatternCatalog;
