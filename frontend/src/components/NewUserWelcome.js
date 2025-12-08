import React from 'react';
import { Sparkles, BookOpen, Zap, X, Play } from 'lucide-react';

const NewUserWelcome = ({ onStartTour, onQuickStart, onTemplates, onDismiss }) => {
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-xl shadow-2xl p-6 mb-6 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Close Button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        title="Dismiss"
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Content */}
      <div className="relative">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome to LogicCanvas! 🎉</h2>
            <p className="text-sm text-white/90">Let's get you started with building your first workflow</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Take Tour */}
          <button
            onClick={onStartTour}
            className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Take a Tour</h3>
                <p className="text-xs text-white/80">Interactive walkthrough of all features</p>
              </div>
            </div>
          </button>

          {/* Quick Start Wizard */}
          <button
            onClick={onQuickStart}
            className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Quick Start</h3>
                <p className="text-xs text-white/80">Build your first workflow in 2 minutes</p>
              </div>
            </div>
          </button>

          {/* Browse Templates */}
          <button
            onClick={onTemplates}
            className="group relative bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Use Template</h3>
                <p className="text-xs text-white/80">Start from 20+ pre-built workflows</p>
              </div>
            </div>
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-white/70">
          You can access these options anytime from the sidebar
        </p>
      </div>
    </div>
  );
};

export default NewUserWelcome;
