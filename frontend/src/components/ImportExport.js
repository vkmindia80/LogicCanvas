import React, { useState } from 'react';
import { Download, Upload, X, FileJson, CheckCircle, AlertCircle, Menu } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ImportExport = ({ isOpen, onClose, selectedWorkflows = [], onImportComplete, onNotify, onOpenMobileSidebar, sidebarCollapsed = false }) => {
  const [activeTab, setActiveTab] = useState('export'); // 'export' or 'import'
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch(`${BACKEND_URL}/api/workflows/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_ids: selectedWorkflows.length > 0 ? selectedWorkflows : null })
      });
      
      const data = await response.json();
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logiccanvas-workflows-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onNotify?.(`Successfully exported ${data.count} workflow(s)`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      onNotify?.('Failed to export workflows', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportResult(null);
      
      const fileContent = await file.text();
      const data = JSON.parse(fileContent);
      
      const response = await fetch(`${BACKEND_URL}/api/workflows/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      setImportResult(result);
      
      if (result.success && onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        imported_count: 0,
        errors: [{ error: 'Failed to parse or import file' }]
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'} bg-white z-50 flex flex-col`} data-testid="import-export">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu for Mobile */}
            <button 
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="mobile-menu-btn"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Download className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Import/Export Workflows</h2>
              <p className="text-primary-100 text-sm">Backup and restore your workflows</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            data-testid="close-import-export-btn"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50">
        <div className="max-w-4xl mx-auto p-6">

          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white rounded-t-lg">
          <button
            onClick={() => {
              setActiveTab('export');
              setImportResult(null);
            }}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'export'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid="export-tab"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setImportResult(null);
            }}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'import'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid="import-tab"
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Import
          </button>
        </div>

          {/* Content */}
          <div className="p-6 bg-white rounded-b-lg shadow-lg">
          {activeTab === 'export' && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Export workflows to JSON file:</strong>
                  <br />
                  {selectedWorkflows.length > 0
                    ? `${selectedWorkflows.length} selected workflow(s) will be exported.`
                    : 'All workflows will be exported.'}
                </p>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="export-btn"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Export Workflows</span>
                  </>
                )}
              </button>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <FileJson className="w-4 h-4 mr-2" />
                  Export Format
                </h3>
                <p className="text-sm text-slate-600">
                  Workflows are exported in JSON format with all nodes, edges, and metadata.
                  The exported file can be imported back or shared with others.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Import workflows from JSON file:</strong>
                  <br />
                  Select a previously exported LogicCanvas workflow file to import.
                  Imported workflows will be created as drafts with new IDs.
                </p>
              </div>

              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                  data-testid="import-file-input"
                />
                <div className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50">
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Select File to Import</span>
                    </>
                  )}
                </div>
              </label>

              {/* Import Result */}
              {importResult && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  importResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        importResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {importResult.success
                          ? `Successfully imported ${importResult.imported_count} workflow(s)`
                          : 'Import failed'}
                      </h3>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium text-red-800">Errors:</p>
                          {importResult.errors.map((error, index) => (
                            <p key={index} className="text-sm text-red-700">
                              • {error.workflow || 'Unknown'}: {error.error}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Import Notes</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Imported workflows receive new unique IDs</li>
                  <li>• All workflows are imported with 'draft' status</li>
                  <li>• Original workflow structure is preserved</li>
                  <li>• Import logs are recorded in audit trail</li>
                </ul>
              </div>
            </div>
          )}
        </div>

          </div>
        </div>
      </div>
  );
};

export default ImportExport;
