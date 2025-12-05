import React, { useState, useMemo } from 'react';
import { 
  PlayCircle, CheckSquare, GitBranch, ClipboardCheck, 
  FileText, StopCircle, Split, Merge, Plus, Zap,
  Clock, Workflow, Radio, Monitor, PauseCircle, List, Equal,
  Repeat, RefreshCw, Repeat1, PlusCircle, Edit, Trash2, Search,
  Database, FileSearch, Shuffle, Filter, ArrowUpDown, BarChart2,
  Calculator, Cloud, Mail, AlertTriangle, ChevronDown, ChevronRight, SearchIcon
} from 'lucide-react';
import { NODE_TYPES, NODE_CONFIGS } from '../utils/nodeTypes';

const iconMap = {
  'play-circle': PlayCircle,
  'check-square': CheckSquare,
  'git-branch': GitBranch,
  'clipboard-check': ClipboardCheck,
  'file-text': FileText,
  'stop-circle': StopCircle,
  'split': Split,
  'merge': Merge,
  'zap': Zap,
  'clock': Clock,
  'workflow': Workflow,
  'radio': Radio,
  'monitor': Monitor,
  'pause-circle': PauseCircle,
  'list': List,
  'equal': Equal,
  'repeat': Repeat,
  'refresh-cw': RefreshCw,
  'repeat-1': Repeat1,
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
  'cloud': Cloud,
  'mail': Mail,
  'webhook': Mail,
  'alert-triangle': AlertTriangle
};

const NodePalette = ({ onAddNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({
    'Flow Components': true,
    'User Interaction': true,
    'Logic': true,
    'Data': false,
    'Integrations': false
  });

  // Group nodes by category
  const categorizedNodes = useMemo(() => {
    const categories = {};
    Object.values(NODE_TYPES).forEach(type => {
      const config = NODE_CONFIGS[type];
      if (!config) return;
      
      const category = config.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({ type, config });
    });
    return categories;
  }, []);

  // Filter nodes based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categorizedNodes;
    
    const filtered = {};
    const lowerSearch = searchTerm.toLowerCase();
    
    Object.entries(categorizedNodes).forEach(([category, nodes]) => {
      const matchingNodes = nodes.filter(({ config }) => 
        config.label.toLowerCase().includes(lowerSearch) ||
        config.description.toLowerCase().includes(lowerSearch)
      );
      
      if (matchingNodes.length > 0) {
        filtered[category] = matchingNodes;
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

  // Category icons
  const categoryIcons = {
    'Flow Components': Workflow,
    'User Interaction': CheckSquare,
    'Logic': GitBranch,
    'Data': Database,
    'Integrations': Cloud
  };

  const categoryOrder = ['Flow Components', 'User Interaction', 'Logic', 'Data', 'Integrations'];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Node Palette
        </h3>
        
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categorized Nodes */}
      <div className="flex-1 overflow-y-auto p-2">
        {categoryOrder.map(category => {
          const nodes = filteredCategories[category];
          if (!nodes || nodes.length === 0) return null;
          
          const isExpanded = expandedCategories[category] || searchTerm.trim();
          const CategoryIcon = categoryIcons[category] || Workflow;
          
          return (
            <div key={category} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CategoryIcon className="w-4 h-4 text-slate-500" />
                  <span>{category}</span>
                  <span className="text-xs text-slate-400">({nodes.length})</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              
              {/* Category Nodes */}
              {isExpanded && (
                <div className="mt-1 space-y-1 pl-1">
                  {nodes.map(({ type, config }) => {
                    const IconComponent = iconMap[config.icon];
                    
                    return (
                      <button
                        key={type}
                        onClick={() => onAddNode(type)}
                        className={`
                          w-full flex items-center space-x-2 p-2 rounded-lg
                          border-2 transition-all text-left text-xs
                          hover:shadow-md hover:scale-[1.02]
                          ${config.color} ${config.borderColor}
                        `}
                        data-testid={`palette-node-${type}`}
                        title={config.description}
                      >
                        {IconComponent && <IconComponent className="w-4 h-4 text-white flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{config.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No nodes found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-500 text-center">
          {Object.values(filteredCategories).reduce((acc, nodes) => acc + nodes.length, 0)} nodes available
        </p>
      </div>
    </div>
  );
};

export default NodePalette;