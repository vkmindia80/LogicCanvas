import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

const KeyboardShortcutsGuide = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Canvas Navigation',
      items: [
        { keys: ['Ctrl', '+'], description: 'Zoom in' },
        { keys: ['Ctrl', '-'], description: 'Zoom out' },
        { keys: ['Ctrl', '0'], description: 'Reset zoom to 100%' },
        { keys: ['Space', 'Drag'], description: 'Pan canvas' },
      ]
    },
    {
      category: 'Editing',
      items: [
        { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
        { keys: ['Ctrl', 'Y'], description: 'Redo action' },
        { keys: ['Ctrl', 'S'], description: 'Save workflow' },
        { keys: ['Delete'], description: 'Delete selected node' },
        { keys: ['Esc'], description: 'Deselect node' },
      ]
    },
    {
      category: 'Workflow Actions',
      items: [
        { keys: ['Ctrl', 'Enter'], description: 'Execute workflow' },
        { keys: ['Ctrl', 'V'], description: 'Validate workflow' },
        { keys: ['Ctrl', 'T'], description: 'Open templates' },
      ]
    },
    {
      category: 'General',
      items: [
        { keys: ['?'], description: 'Show this help' },
        { keys: ['Ctrl', '/'], description: 'Open global search' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Keyboard className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
              <p className="text-sm text-slate-300">Work faster with these shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="close-shortcuts-guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-6">
            {shortcuts.map((category, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((shortcut, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm text-slate-700">{shortcut.description}</span>
                      <div className="flex items-center space-x-1">
                        {shortcut.keys.map((key, kIdx) => (
                          <React.Fragment key={kIdx}>
                            {kIdx > 0 && (
                              <span className="text-slate-400 text-xs">+</span>
                            )}
                            <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono text-slate-800 shadow-sm">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mac Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 flex items-center space-x-2">
              <Command className="w-4 h-4" />
              <span>
                <strong>Mac users:</strong> Use <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">⌘ Cmd</kbd> instead of <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl</kbd>
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsGuide;
