import React, { useState } from 'react';
import {
  PlayCircle, CheckSquare, GitBranch, ClipboardCheck,
  FileText, StopCircle, Split, Merge, Plus, Zap,
  Search, Lightbulb, Sparkles
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
  'zap': Zap
};

const NODE_CATEGORIES = {
  'Flow Control': [NODE_TYPES.START, NODE_TYPES.DECISION, NODE_TYPES.PARALLEL, NODE_TYPES.MERGE, NODE_TYPES.END],
  'User Actions': [NODE_TYPES.TASK, NODE_TYPES.APPROVAL, NODE_TYPES.FORM],
  'Integrations': [NODE_TYPES.ACTION]
};

const AI_SUGGESTIONS = [
  {
    context: 'after-start',
    suggestion: 'Add a Form node to collect user input',
    nodeType: NODE_TYPES.FORM,
    reason: 'Most workflows start by collecting information'
  },
  {
    context: 'after-form',
    suggestion: 'Add a Decision node to route based on input',
    nodeType: NODE_TYPES.DECISION,
    reason: 'Forms often lead to conditional logic'
  },
  {
    context: 'after-task',
    suggestion: 'Add an Approval node for review',
    nodeType: NODE_TYPES.APPROVAL,
    reason: 'Tasks commonly require approval'
  }
];

const NodePaletteEnhanced = ({ onAddNode, lastNodeType, onShowAISuggestion }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({
    'Flow Control': true,
    'User Actions': true,
    'Integrations': true
  });
  const [hoveredNode, setHoveredNode] = useState(null);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Filter nodes based on search
  const getFilteredNodes = (categoryNodes) => {
    if (!searchTerm) return categoryNodes;
    return categoryNodes.filter(type => {
      const config = NODE_CONFIGS[type];
      return config.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
             config.description.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  // Get AI suggestion based on last node
  const aiSuggestion = AI_SUGGESTIONS.find(s => s.context === `after-${lastNodeType}`);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-primary-600" />
          Node Palette
        </h3>
        <p className="text-xs text-slate-600">Drag or click to add nodes</p>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            data-testid="node-search"
          />
        </div>
      </div>

      {/* AI Suggestion */}
      {aiSuggestion && !searchTerm && (
        <div className="mx-3 mt-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-purple-900 mb-1">AI Suggestion</div>
              <div className="text-xs text-purple-700 mb-2">{aiSuggestion.suggestion}</div>
              <button
                onClick={() => onAddNode(aiSuggestion.nodeType)}
                className="text-xs bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors font-medium"
                data-testid="ai-suggestion-btn"
              >
                Add {NODE_CONFIGS[aiSuggestion.nodeType].label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Object.entries(NODE_CATEGORIES).map(([category, categoryNodes]) => {
          const filteredNodes = getFilteredNodes(categoryNodes);
          if (filteredNodes.length === 0 && searchTerm) return null;

          return (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between text-left px-2 py-1 hover:bg-slate-50 rounded-md transition-colors group"
              >
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                  {category}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {filteredNodes.length}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedCategories[category] ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Category Nodes */}
              {expandedCategories[category] && (
                <div className="space-y-2">
                  {filteredNodes.map(type => {
                    const config = NODE_CONFIGS[type];
                    const IconComponent = iconMap[config.icon];

                    return (
                      <div
                        key={type}
                        className="relative"
                        onMouseEnter={() => setHoveredNode(type)}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        <button
                          onClick={() => onAddNode(type)}
                          className={`
                            w-full flex items-center space-x-3 p-3 rounded-lg
                            border-2 transition-all text-left group
                            hover:shadow-lg hover:scale-[1.02]
                            ${config.color} ${config.borderColor}
                          `}
                          data-testid={`palette-node-${type}`}
                        >
                          {IconComponent && <IconComponent className="w-5 h-5 text-white flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-white">{config.label}</div>
                            <div className="text-xs text-white/90 truncate">{config.description}</div>
                          </div>
                          <Plus className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {/* Hover Tooltip */}
                        {hoveredNode === type && (
                          <div className="absolute left-full top-0 ml-2 z-50 w-64 bg-slate-900 text-white text-xs rounded-lg shadow-xl p-3 pointer-events-none">
                            <div className="font-semibold mb-1">{config.label} Node</div>
                            <div className="text-slate-300 mb-2">{config.description}</div>
                            <div className="flex items-start space-x-1 text-slate-400">
                              <Lightbulb className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span>Click to add to canvas</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Tips */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-start space-x-2">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <span className="font-semibold">Tip:</span> Click nodes to add them to the canvas. Connect nodes by dragging from output handles.
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodePaletteEnhanced;
