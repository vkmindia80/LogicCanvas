import React, { useState } from 'react';
import { HelpCircle, BookOpen, Video, Keyboard, MessageCircle, FileText, X } from 'lucide-react';

const HelpMenu = ({ 
  isOpen, 
  onClose, 
  onShowTour,
  onShowVideos,
  onShowShortcuts,
  onShowTemplates,
  onShowPatterns
}) => {
  if (!isOpen) return null;

  const helpOptions = [
    {
      icon: BookOpen,
      title: 'Take Product Tour',
      description: 'Interactive walkthrough of all features',
      action: onShowTour,
      color: 'bg-green-500',
      testId: 'help-tour-btn'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      action: onShowVideos,
      color: 'bg-gold-500',
      testId: 'help-videos-btn'
    },
    {
      icon: Keyboard,
      title: 'Keyboard Shortcuts',
      description: 'Work faster with shortcuts',
      action: onShowShortcuts,
      color: 'bg-green-500',
      testId: 'help-shortcuts-btn'
    },
    {
      icon: FileText,
      title: 'Template Library',
      description: '20+ pre-built workflow templates',
      action: onShowTemplates,
      color: 'bg-green-500',
      testId: 'help-templates-btn'
    },
    {
      icon: MessageCircle,
      title: 'Pattern Library',
      description: 'Reusable workflow patterns',
      action: onShowPatterns,
      color: 'bg-pink-500',
      testId: 'help-patterns-btn'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Help & Resources</h2>
              <p className="text-sm text-primary-100">Everything you need to build workflows</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="close-help-menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Help Options */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helpOptions.map((option, idx) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    option.action();
                    onClose();
                  }}
                  className="flex items-start space-x-4 p-4 rounded-lg border-2 border-green-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
                  data-testid={option.testId}
                >
                  <div className={`p-3 ${option.color} rounded-lg group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-900 mb-1">{option.title}</h3>
                    <p className="text-sm text-primary-600">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Additional Help */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-sm font-semibold text-primary-900 mb-2">Need More Help?</h3>
            <p className="text-xs text-primary-600 mb-3">
              Check out our comprehensive documentation and community resources
            </p>
            <div className="flex space-x-2">
              <a
                href="https://docs.logiccanvas.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                📚 Documentation
              </a>
              <a
                href="https://community.logiccanvas.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                💬 Community
              </a>
              <a
                href="mailto:support@logiccanvas.com"
                className="text-xs px-3 py-1.5 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                ✉️ Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpMenu;
