import React, { useState, useEffect } from 'react';
import { Search, Copy, Check, Code, BookOpen, Filter, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const TransformationFunctionLibrary = ({ onSelectFunction, compact = false }) => {
  const [functions, setFunctions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedFunction, setCopiedFunction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunctions();
  }, []);

  const fetchFunctions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/transformations/functions`);
      const data = await response.json();
      if (data.success) {
        setFunctions(data.functions);
      }
    } catch (error) {
      console.error('Failed to fetch transformation functions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFunction = (funcName, params) => {
    const paramsList = params.map(p => p.endsWith('?') ? `[${p.replace('?', '')}]` : p).join(', ');
    const functionCall = `${funcName}(${paramsList})`;
    navigator.clipboard.writeText(functionCall);
    setCopiedFunction(funcName);
    setTimeout(() => setCopiedFunction(null), 2000);
  };

  const categories = Object.keys(functions);
  const filteredCategories = selectedCategory === 'all' 
    ? categories 
    : categories.filter(cat => cat === selectedCategory);

  const getFilteredFunctions = (category) => {
    const categoryFunctions = functions[category] || {};
    if (!searchTerm) return Object.entries(categoryFunctions);

    return Object.entries(categoryFunctions).filter(([name, info]) => 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      info.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getTotalFunctionCount = () => {
    return Object.values(functions).reduce((total, cat) => total + Object.keys(cat).length, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search functions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredCategories.map(category => {
            const categoryFunctions = getFilteredFunctions(category);
            if (categoryFunctions.length === 0) return null;

            return (
              <div key={category} className="space-y-1">
                <div className="text-xs font-semibold text-slate-600 px-2">{category}</div>
                {categoryFunctions.map(([funcName, info]) => (
                  <button
                    key={funcName}
                    onClick={() => onSelectFunction && onSelectFunction(funcName, info)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-indigo-600 group-hover:text-indigo-700">{funcName}</span>
                      <Code className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{info.description}</div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            Transformation Functions Library
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {getTotalFunctionCount()} functions across {categories.length} categories
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search functions by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            data-testid="function-search"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
            data-testid="category-filter"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Function Categories */}
      <div className="space-y-6">
        {filteredCategories.map(category => {
          const categoryFunctions = getFilteredFunctions(category);
          if (categoryFunctions.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {category}
                  <span className="ml-auto text-sm font-normal text-indigo-100">
                    {categoryFunctions.length} functions
                  </span>
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {categoryFunctions.map(([funcName, info]) => (
                  <div key={funcName} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-base font-semibold text-indigo-600 font-mono">
                            {funcName}
                          </code>
                          <button
                            onClick={() => handleCopyFunction(funcName, info.params)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-indigo-100 rounded"
                            title="Copy function signature"
                          >
                            {copiedFunction === funcName ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-2">{info.description}</p>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-slate-500">Parameters:</span>
                          {info.params && info.params.length > 0 ? (
                            info.params.map((param, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
                                  param.endsWith('?')
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                {param}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">None</span>
                          )}
                        </div>
                      </div>

                      {onSelectFunction && (
                        <button
                          onClick={() => onSelectFunction(funcName, info)}
                          className="flex-shrink-0 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
                          data-testid={`select-${funcName}`}
                        >
                          Use Function
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredCategories.every(cat => getFilteredFunctions(cat).length === 0) && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <Search className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 font-medium">No functions found</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filter</p>
        </div>
      )}

      {/* Quick Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Code className="w-4 h-4" />
          Quick Reference
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Use optional parameters (marked with ?) when needed</p>
          <p>• Chain multiple transformations for complex operations</p>
          <p>• Test transformations with sample data before applying</p>
          <p>• Click "Copy" to get the function signature</p>
        </div>
      </div>
    </div>
  );
};

export default TransformationFunctionLibrary;
