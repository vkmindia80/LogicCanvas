import React, { useState } from 'react';
import { 
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Download, Grid,
  Save, Play, Eye, Zap, Layers, Variable, BookOpen, Sparkles
} from 'lucide-react';
import { modernButtonStyles } from '../utils/modernDesignSystem';

/**
 * Reusable toolbar button groups for WorkflowCanvas
 */

export const UndoRedoGroup = ({ onUndo, onRedo, canUndo, canRedo }) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
        data-testid="undo-btn"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Y)"
        data-testid="redo-btn"
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ZoomControlsGroup = ({ 
  onZoomIn, 
  onZoomOut, 
  onFitView, 
  zoomLevel 
}) => {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200">
      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-white rounded-lg transition-colors"
        title="Zoom Out"
        data-testid="zoom-out-btn"
      >
        <ZoomOut className="w-4 h-4 text-slate-700" />
      </button>
      <div className="min-w-[60px] text-center text-sm font-medium text-slate-700" title="Current zoom level">
        {zoomLevel}%
      </div>
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-white rounded-lg transition-colors"
        title="Zoom In"
        data-testid="zoom-in-btn"
      >
        <ZoomIn className="w-4 h-4 text-slate-700" />
      </button>
      <div className="w-px h-4 bg-slate-300" />
      <button
        onClick={onFitView}
        className="p-2 hover:bg-white rounded-lg transition-colors"
        title="Fit to View"
        data-testid="fit-view-btn"
      >
        <Maximize2 className="w-4 h-4 text-slate-700" />
      </button>
    </div>
  );
};

export const GridSnapToggle = ({ isActive, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
          : 'hover:bg-slate-100 text-slate-500'
      }`}
      title={isActive ? 'Grid Snap: ON' : 'Grid Snap: OFF'}
      data-testid="grid-snap-toggle"
    >
      <Grid className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
    </button>
  );
};

export const ExportMenu = ({ onExportPNG, onExportPDF, isExporting }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        title="Export Workflow"
        data-testid="export-menu-btn"
        disabled={isExporting}
      >
        <Download className="w-4 h-4 text-slate-700" />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[140px] z-50 animate-fade-in">
          <button
            onClick={() => {
              onExportPNG();
              setIsOpen(false);
            }}
            disabled={isExporting}
            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 text-slate-700"
            data-testid="export-png-btn"
          >
            Export as PNG
          </button>
          <button
            onClick={() => {
              onExportPDF();
              setIsOpen(false);
            }}
            disabled={isExporting}
            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 text-slate-700"
            data-testid="export-pdf-btn"
          >
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
};

export const ActionButtonsGroup = ({
  onValidate,
  onTriggers,
  onAutoLayout,
  onSave,
  onExecute,
  onVariables,
  workflowId,
  isSaving
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onVariables}
        className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-cyan-700 hover:shadow-md"
        data-testid="variables-btn"
        title="Manage workflow variables"
      >
        <Variable className="w-4 h-4" />
        <span>Variables</span>
      </button>
      
      <button
        onClick={onValidate}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
        data-testid="validate-workflow-btn"
        title="Validate workflow"
      >
        <Eye className="w-4 h-4" />
        <span>Validate</span>
      </button>
      
      <button
        onClick={onTriggers}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-700 hover:shadow-md disabled:opacity-50"
        data-testid="trigger-config-btn"
        title="Configure triggers"
        disabled={!workflowId}
      >
        <Zap className="w-4 h-4" />
        <span>Triggers</span>
      </button>
      
      <button
        onClick={onAutoLayout}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-violet-700 hover:shadow-md"
        data-testid="auto-layout-btn"
        title="Auto-layout nodes"
      >
        <Layers className="w-4 h-4" />
        <span>Layout</span>
      </button>
      
      <button
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
        data-testid="workflow-save-btn"
      >
        <Save className="w-4 h-4" />
        <span>{isSaving ? 'Saving...' : 'Save'}</span>
      </button>
      
      <button
        onClick={onExecute}
        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow-md"
        data-testid="workflow-run-btn"
      >
        <Play className="w-4 h-4" />
        <span>Execute</span>
      </button>
    </div>
  );
};

export const TemplateAndAIButtons = ({ onShowTemplates, onShowWizard }) => {
  return (
    <div className="flex items-center gap-2">
      {onShowTemplates && (
        <button
          onClick={onShowTemplates}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow-md"
          data-testid="show-templates-btn"
          title="Browse templates"
        >
          <BookOpen className="w-4 h-4" />
          <span>Templates</span>
        </button>
      )}
      {onShowWizard && (
        <button
          onClick={onShowWizard}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-md"
          data-testid="show-wizard-btn"
          title="AI Builder"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Builder</span>
        </button>
      )}
    </div>
  );
};
