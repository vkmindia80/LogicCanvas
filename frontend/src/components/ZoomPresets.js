import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Monitor } from 'lucide-react';

const ZoomPresets = ({ currentZoom, onZoomChange, onFit, className = '' }) => {
  const presets = [
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: '100%' },
    { value: 150, label: '150%' },
    { value: 200, label: '200%' }
  ];

  const handlePresetClick = (preset) => {
    onZoomChange(preset / 100);
  };

  return (
    <div className={`flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2 ${className}`}>
      {/* Zoom Out */}
      <button
        onClick={() => onZoomChange(Math.max(0.1, currentZoom - 0.1))}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Zoom Out (Ctrl + -)" 
      >
        <ZoomOut className="w-4 h-4 text-slate-700 dark:text-slate-300" />
      </button>

      {/* Presets */}
      <div className="flex items-center space-x-1 px-2 border-x border-slate-200 dark:border-slate-600">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              Math.abs(currentZoom * 100 - preset.value) < 5
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={`Set zoom to ${preset.label}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Zoom In */}
      <button
        onClick={() => onZoomChange(Math.min(4, currentZoom + 0.1))}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Zoom In (Ctrl + +)"
      >
        <ZoomIn className="w-4 h-4 text-slate-700 dark:text-slate-300" />
      </button>

      {/* Fit View */}
      <button
        onClick={onFit}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-l border-slate-200 dark:border-slate-600 ml-1 pl-3"
        title="Fit to View (Ctrl + 0)"
      >
        <Maximize2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
      </button>

      {/* Current Zoom Display */}
      <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-md border-l border-slate-200 dark:border-slate-600 ml-1 pl-3">
        <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
          {Math.round(currentZoom * 100)}%
        </span>
      </div>
    </div>
  );
};

export default ZoomPresets;
