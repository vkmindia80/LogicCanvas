import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';

const ZOOM_PRESETS = [
  { label: 'Fit', value: 'fit' },
  { label: '50%', value: 0.5 },
  { label: '100%', value: 1 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2 }
];

const ZoomControls = ({ currentZoom, onZoomChange, onFitView }) => {
  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + 0.25, 3);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 0.25, 0.25);
    onZoomChange(newZoom);
  };

  const handlePresetClick = (preset) => {
    if (preset.value === 'fit') {
      onFitView();
    } else {
      onZoomChange(preset.value);
    }
  };

  return (
    <div className="absolute bottom-6 left-6 z-10 flex flex-col space-y-2" data-testid="zoom-controls">
      {/* Zoom In/Out Buttons */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 border-b border-gray-200 transition-colors"
          title="Zoom In"
          data-testid="zoom-in"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>
        <div className="px-2 py-1 text-xs font-medium text-center text-gray-700 border-b border-gray-200 bg-gray-50">
          {Math.round(currentZoom * 100)}%
        </div>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 border-b border-gray-200 transition-colors"
          title="Zoom Out"
          data-testid="zoom-out"
        >
          <ZoomOut className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={onFitView}
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Fit to View"
          data-testid="fit-view"
        >
          <Maximize2 className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Zoom Presets */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="text-xs font-semibold text-gray-500 mb-2 px-1">Quick Zoom</div>
        <div className="space-y-1">
          {ZOOM_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              className={`w-full px-3 py-1.5 text-xs rounded transition-colors text-left ${
                (preset.value === 'fit' && currentZoom === 1) ||
                (preset.value === currentZoom)
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              data-testid={`zoom-preset-${preset.label.toLowerCase()}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Helper */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="text-xs text-gray-600">
          <div className="font-semibold mb-1">Shortcuts</div>
          <div className="space-y-0.5">
            <div>Ctrl + Scroll: Zoom</div>
            <div>Space + Drag: Pan</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomControls;
