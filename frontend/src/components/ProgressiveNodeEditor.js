import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings, Zap, Shield, Database } from 'lucide-react';

const ProgressiveNodeEditor = ({ node, children }) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: false,
    security: false,
    dataMapping: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const sections = [
    {
      id: 'basic',
      title: 'Basic Configuration',
      icon: Zap,
      description: 'Essential settings to get started',
      defaultOpen: true
    },
    {
      id: 'advanced',
      title: 'Advanced Options',
      icon: Settings,
      description: 'Fine-tune behavior and performance',
      defaultOpen: false
    },
    {
      id: 'security',
      title: 'Security & Permissions',
      icon: Shield,
      description: 'Access control and data protection',
      defaultOpen: false,
      showForTypes: ['task', 'approval', 'form', 'api-call', 'action']
    },
    {
      id: 'dataMapping',
      title: 'Data Mapping',
      icon: Database,
      description: 'Map input/output variables',
      defaultOpen: false,
      showForTypes: ['task', 'form', 'action', 'api-call', 'subprocess', 'create-record', 'update-record']
    }
  ];

  const nodeType = node?.data?.type || node?.type;

  // Filter sections based on node type
  const visibleSections = sections.filter(section => {
    if (!section.showForTypes) return true;
    return section.showForTypes.includes(nodeType);
  });

  return (
    <div className="space-y-3" data-testid="progressive-node-editor">
      {visibleSections.map((section) => {
        const isExpanded = expandedSections[section.id];
        const IconComponent = section.icon;

        return (
          <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              data-testid={`section-${section.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-1.5 rounded ${
                  isExpanded ? 'bg-primary-100' : 'bg-gray-200'
                }`}>
                  <IconComponent className={`w-4 h-4 ${
                    isExpanded ? 'text-primary-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm text-gray-900">{section.title}</div>
                  {!isExpanded && (
                    <div className="text-xs text-gray-500">{section.description}</div>
                  )}
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="p-4 bg-white space-y-3" data-testid={`section-content-${section.id}`}>
                {/* This is where child components will be rendered based on section */}
                <div data-section={section.id}>
                  {children}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressiveNodeEditor;
