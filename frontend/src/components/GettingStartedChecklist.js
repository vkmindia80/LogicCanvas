import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, X, Sparkles, Video, BookOpen, Zap } from 'lucide-react';

const CHECKLIST_ITEMS = [
  {
    id: 'take-tour',
    title: 'Take the Product Tour',
    description: 'Learn the basics of LogicCanvas in 5 minutes',
    icon: Sparkles,
    action: 'tour',
    estimatedTime: '5 min'
  },
  {
    id: 'create-first-workflow',
    title: 'Create Your First Workflow',
    description: 'Use the Quick Start Wizard or start from scratch',
    icon: Zap,
    action: 'wizard',
    estimatedTime: '10 min'
  },
  {
    id: 'try-template',
    title: 'Try a Template',
    description: 'Explore pre-built workflows for common processes',
    icon: BookOpen,
    action: 'template',
    estimatedTime: '5 min'
  },
  {
    id: 'watch-video',
    title: 'Watch Tutorial Videos',
    description: 'See LogicCanvas in action with step-by-step guides',
    icon: Video,
    action: 'videos',
    estimatedTime: '15 min'
  }
];

const GettingStartedChecklist = ({ isOpen, onClose, onAction }) => {
  const [completedItems, setCompletedItems] = useState(() => {
    const stored = localStorage.getItem('lc_checklist_completed');
    return stored ? JSON.parse(stored) : [];
  });

  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('lc_checklist_dismissed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lc_checklist_completed', JSON.stringify(completedItems));
  }, [completedItems]);

  const handleToggleComplete = (itemId) => {
    setCompletedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      }
      return [...prev, itemId];
    });
  };

  const handleItemClick = (item) => {
    if (onAction) {
      onAction(item.action);
    }
    if (!completedItems.includes(item.id)) {
      handleToggleComplete(item.id);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('lc_checklist_dismissed', 'true');
    setDismissed(true);
    onClose();
  };

  const progress = (completedItems.length / CHECKLIST_ITEMS.length) * 100;
  const allComplete = completedItems.length === CHECKLIST_ITEMS.length;

  if (!isOpen || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-indigo-200 z-40 animate-slide-up" data-testid="getting-started-checklist">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold">Getting Started</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss checklist"
            data-testid="dismiss-checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-indigo-100">
            <span>{completedItems.length} of {CHECKLIST_ITEMS.length} completed</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-indigo-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {allComplete ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-primary-900 mb-1">All Done! 🎉</h4>
            <p className="text-sm text-primary-600 mb-4">
              You've completed the getting started checklist.
            </p>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Dismiss Checklist
            </button>
          </div>
        ) : (
          CHECKLIST_ITEMS.map((item) => {
            const isCompleted = completedItems.includes(item.id);
            const IconComponent = item.icon;

            return (
              <div
                key={item.id}
                className={`group border rounded-lg p-3 transition-all cursor-pointer ${
                  isCompleted
                    ? 'border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border-green-200 hover:border-primary-300 hover:shadow-md'
                }`}
                onClick={() => handleItemClick(item)}
                data-testid={`checklist-item-${item.id}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(item.id);
                    }}
                    className="flex-shrink-0 mt-0.5"
                    data-testid={`toggle-${item.id}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-green-400 group-hover:text-primary-500" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <IconComponent className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <h4 className={`font-medium text-sm ${
                        isCompleted ? 'text-primary-600 line-through' : 'text-primary-900'
                      }`}>
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-primary-600 mb-1">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-500">
                        ⏱️ {item.estimatedTime}
                      </span>
                      {!isCompleted && (
                        <span className="text-xs text-primary-600 font-medium group-hover:underline">
                          Start →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!allComplete && (
        <div className="border-t border-green-200 p-3 bg-green-50 rounded-b-xl">
          <p className="text-xs text-primary-600 text-center">
            Complete these steps to get the most out of LogicCanvas
          </p>
        </div>
      )}
    </div>
  );
};

export default GettingStartedChecklist;
