import React, { useState, useMemo } from 'react';
import {
  PlayCircle, StopCircle, CheckSquare, FileText, Monitor, PauseCircle,
  GitBranch, List, Equal, Repeat, RefreshCw, Repeat1, ClipboardCheck,
  PlusCircle, Edit, Trash2, Search, Database, FileSearch, Shuffle, Filter,
  ArrowUpDown, BarChart2, Calculator, Split, Merge as MergeIcon, Workflow,
  Zap, Cloud, Send, Mail, Clock, Radio, AlertTriangle, ChevronDown, ChevronRight,
  Search as SearchIcon, Plus, Sparkles
} from 'lucide-react';
import { NODE_TYPES, NODE_CONFIGS } from '../utils/nodeTypes';
import { modernInputStyles, modernSearchBarStyles } from '../utils/modernDesignSystem';

const iconMap = {
  'play-circle': PlayCircle,
  'stop-circle': StopCircle,
  'check-square': CheckSquare,
  'file-text': FileText,
  'monitor': Monitor,
  'pause-circle': PauseCircle,
  'git-branch': GitBranch,
  'list': List,
  'equal': Equal,
  'repeat': Repeat,
  'refresh-cw': RefreshCw,
  'repeat-1': Repeat1,
  'clipboard-check': ClipboardCheck,
  'plus-circle': PlusCircle,
  'edit': Edit,
  'trash-2': Trash2,
  'search': Search,
  'database': Database,
  'file-search': FileSearch,
  'shuffle': Shuffle,
  'filter': Filter,
  'arrow-up-down': ArrowUpDown,
  'bar-chart-2': BarChart2,
  'calculator': Calculator,
  'split': Split,
  'merge': MergeIcon,
  'workflow': Workflow,
  'zap': Zap,
  'cloud': Cloud,
  'webhook': Send,
  'mail': Mail,
  'clock': Clock,
  'radio': Radio,
  'alert-triangle': AlertTriangle
};

const categoryIcons = {
  'User Interaction': Monitor,
  'Logic': GitBranch,
  'Data': Database,
  'Flow Components': Workflow,
  'Integrations': Cloud
};

const categoryColors = {
  'User Interaction': 'indigo',
  'Logic': 'purple',
  'Data': 'cyan',
  'Flow Components': 'blue',
  'Integrations': 'violet'
};

const NodePaletteModern = ({ onAddNode, lastNodeType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({
    'User Interaction': true,
    'Logic': true,
    'Data': true,
    'Flow Components': true,
    'Integrations': true
  });

  // Group nodes by category
  const categorizedNodes = useMemo(() => {
    const categories = {};
    
    Object.entries(NODE_CONFIGS).forEach(([type, config]) => {
      const category = config.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({ type, config });
    });

    // Sort categories in preferred order
    const orderedCategories = [
      'Flow Components',
      'User Interaction',
      'Logic',
      'Data',
      'Integrations'
    ];

    const sorted = {};
    orderedCategories.forEach(cat => {
      if (categories[cat]) {
        sorted[cat] = categories[cat];
      }
    });
    
    // Add any remaining categories
    Object.keys(categories).forEach(cat => {
      if (!sorted[cat]) {
        sorted[cat] = categories[cat];
      }
    });

    return sorted;
  }, []);

  // Filter nodes based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categorizedNodes;
    }

    const filtered = {};
    const term = searchTerm.toLowerCase();

    Object.entries(categorizedNodes).forEach(([category, nodes]) => {
      const matchedNodes = nodes.filter(({ config }) =>
        config.label.toLowerCase().includes(term) ||
        config.description.toLowerCase().includes(term)
      );
      
      if (matchedNodes.length > 0) {
        filtered[category] = matchedNodes;
      }
    });

    return filtered;
  }, [categorizedNodes, searchTerm]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const collapseAll = () => {
    const collapsed = {};
    Object.keys(expandedCategories).forEach(key => {
      collapsed[key] = false;
    });
    setExpandedCategories(collapsed);
  };

  const expandAll = () => {
    const expanded = {};
    Object.keys(expandedCategories).forEach(key => {
      expanded[key] = true;
    });
    setExpandedCategories(expanded);
  };

  const handleAddNode = (type) => {
    onAddNode(type);
  };

  const allExpanded = Object.values(expandedCategories).every(v => v);
  const allCollapsed = Object.values(expandedCategories).every(v => !v);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mr-2 shadow-sm">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Node Palette
          </h3>
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            title={allExpanded ? 'Collapse All' : 'Expand All'}
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 bg-white text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            data-testid="node-palette-search"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {Object.entries(filteredCategories).map(([category, nodes]) => {
          const isExpanded = expandedCategories[category];
          const CategoryIcon = categoryIcons[category] || Workflow;
          const categoryColor = categoryColors[category] || 'indigo';

          return (
            <div key={category} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                data-testid={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-lg bg-${categoryColor}-100 flex items-center justify-center`}>
                    <CategoryIcon className={`w-4 h-4 text-${categoryColor}-600`} />
                  </div>
                  <span className="text-slate-900">{category}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {nodes.length}
                </span>
              </button>

              {/* Category Nodes */}
              {isExpanded && (
                <div className="ml-2 mt-2 space-y-1.5">
                  {nodes.map(({ type, config }) => {
                    const IconComponent = iconMap[config.icon];
                    const isRecent = type === lastNodeType;

                    return (
                      <button
                        key={type}
                        onClick={() => handleAddNode(type)}
                        className={`
                          w-full flex items-center space-x-3 p-2.5 rounded-lg
                          border border-slate-200 bg-white transition-all text-left group
                          hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50/50
                          active:scale-[0.98]
                          ${isRecent ? 'ring-2 ring-indigo-400 ring-opacity-50 border-indigo-300' : ''}
                        `}
                        title={config.description}
                        data-testid={`palette-node-${type}`}
                      >
                        {IconComponent && (
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.color} flex items-center justify-center shadow-sm`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-slate-900 truncate group-hover:text-indigo-900">
                            {config.label}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {config.description}
                          </div>
                        </div>
                        {isRecent && (
                          <Sparkles className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* No Results */}
        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <SearchIcon className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700">No nodes found</p>
            <p className="text-xs mt-1">Try adjusting your search term</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="text-xs text-slate-600 text-center">
          <p className="font-semibold text-slate-900">{Object.values(NODE_TYPES).length} Node Types</p>
          <p className="text-slate-500 mt-1">Click to add • Drag to position</p>
        </div>
      </div>
    </div>
  );
};

export default NodePaletteModern;
