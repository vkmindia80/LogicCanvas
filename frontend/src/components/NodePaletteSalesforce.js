import React, { useState, useMemo } from 'react';
import {
  PlayCircle, StopCircle, CheckSquare, FileText, Monitor, PauseCircle,
  GitBranch, List, Equal, Repeat, RefreshCw, Repeat1, ClipboardCheck,
  PlusCircle, Edit, Trash2, Search, Database, FileSearch, Shuffle, Filter,
  ArrowUpDown, BarChart2, Calculator, Split, Merge as MergeIcon, Workflow,
  Zap, Cloud, Send, Mail, Clock, Radio, AlertTriangle, ChevronDown, ChevronRight,
  Search as SearchIcon, Plus
} from 'lucide-react';
import { NODE_TYPES, NODE_CONFIGS } from '../utils/nodeTypes';

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

const NodePaletteSalesforce = ({ onAddNode, lastNodeType }) => {
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
      'User Interaction',
      'Logic',
      'Data',
      'Flow Components',
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

  const handleAddNode = (type) => {
    onAddNode(type);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Toolbox
        </h3>
        
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search elements..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-600 bg-slate-800 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            data-testid="node-palette-search"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {Object.entries(filteredCategories).map(([category, nodes]) => {
          const isExpanded = expandedCategories[category];
          const CategoryIcon = categoryIcons[category] || Workflow;

          return (
            <div key={category} className="mb-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                data-testid={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                  <CategoryIcon className="w-4 h-4 text-slate-600" />
                  <span>{category}</span>
                </div>
                <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  {nodes.length}
                </span>
              </button>

              {/* Category Nodes */}
              {isExpanded && (
                <div className="ml-2 mt-1 space-y-1">
                  {nodes.map(({ type, config }) => {
                    const IconComponent = iconMap[config.icon];
                    const isRecent = type === lastNodeType;

                    return (
                      <button
                        key={type}
                        onClick={() => handleAddNode(type)}
                        className={`
                          w-full flex items-center space-x-2 p-2 rounded-lg
                          border transition-all text-left group
                          hover:shadow-md hover:scale-[1.02] hover:border-primary-300
                          ${isRecent ? 'ring-2 ring-primary-400 ring-opacity-50' : ''}
                          ${config.color} ${config.borderColor}
                        `}
                        title={config.description}
                        data-testid={`palette-node-${type}`}
                      >
                        {IconComponent && (
                          <div className="flex-shrink-0">
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-white truncate">
                            {config.label}
                          </div>
                          <div className="text-[10px] text-white opacity-80 truncate">
                            {config.description}
                          </div>
                        </div>
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
          <div className="text-center py-8 text-slate-500 text-sm">
            <SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No elements found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="text-xs text-slate-600 text-center">
          <p className="font-semibold">{Object.values(NODE_TYPES).length} Elements</p>
          <p className="text-slate-500 mt-1">Drag or click to add to canvas</p>
        </div>
      </div>
    </div>
  );
};

export default NodePaletteSalesforce;
