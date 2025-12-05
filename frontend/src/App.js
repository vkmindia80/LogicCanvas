import React, { useState, useEffect } from 'react';
import './App.css';
import { Activity, FileText, Workflow, CheckSquare, ClipboardCheck, History, Bell, BarChart3, Search as SearchIcon, Download, Shield } from 'lucide-react';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { RoleProvider, useRole } from './contexts/RoleContext';
import WorkflowList from './components/WorkflowList';
import WorkflowCanvas from './components/WorkflowCanvas';
import FormList from './components/forms/FormList';
import FormBuilder from './components/forms/FormBuilder';
import TaskInbox from './components/TaskInbox';
import ApprovalQueue from './components/ApprovalQueue';
import AuditTrail from './components/AuditTrail';
import NotificationsPanel from './components/NotificationsPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import GlobalSearch from './components/GlobalSearch';
import ImportExport from './components/ImportExport';
import OnboardingTour from './components/OnboardingTour';
import { ToastContainer } from './components/Toast';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';

import { getRecruitingWorkflowTemplate } from './utils/sampleWorkflows';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AppShell = () => {
  const [currentView, setCurrentView] = useState('workflows'); // 'workflows', 'canvas', 'forms', 'form-builder'
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [currentForm, setCurrentForm] = useState(null);
  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(true);
  const [showTaskInbox, setShowTaskInbox] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('lc_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
  const { currentRole, setCurrentRole, can } = useRole();

  // Sync UI role with logged-in user when present
  useEffect(() => {
    if (currentUser?.role) {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser, setCurrentRole]);


    const stored = localStorage.getItem('lc_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [approvalCount, setApprovalCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const { currentRole, setCurrentRole, can } = useRole();

  const handleAuthSuccess = (token, user) => {
    setAuthToken(token);
    setCurrentUser(user);
    localStorage.setItem('lc_token', token);
    localStorage.setItem('lc_user', JSON.stringify(user));
    setCurrentRole(user.role || 'viewer');
    addToast(`Signed in as ${user.name || user.email}`, 'success');
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    localStorage.removeItem('lc_token');
    localStorage.removeItem('lc_user');
    setCurrentRole('viewer');
    addToast('Logged out', 'info');
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        await response.json();
        setLoading(false);
      } catch (error) {
        console.error('Health check failed:', error);
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  // Load badge counts for tasks, approvals, and notifications
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [tasksRes, approvalsRes, notificationsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/tasks?status=pending`),
          fetch(`${BACKEND_URL}/api/approvals?status=pending`),
          fetch(`${BACKEND_URL}/api/notifications?unread_only=true`),
        ]);
        const tasksData = await tasksRes.json();
        const approvalsData = await approvalsRes.json();
        const notificationsData = await notificationsRes.json();
        setTaskCount(tasksData.count || 0);
        setApprovalCount(approvalsData.count || 0);
        setNotificationCount(notificationsData.count || 0);
      } catch (error) {
        console.error('Failed to load counts:', error);
      }
    };

    loadCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleCreateNew = () => {
    if (!can('createWorkflows')) {
      addToast('You do not have permission to create workflows.', 'error');
      return;
    }
    const newWorkflow = {
      id: null,
      name: 'Untitled Workflow',
      description: '',
      nodes: [],
      edges: [],
      status: 'draft',
      version: 1,
      tags: [],
    };
    setCurrentWorkflow(newWorkflow);
    setCurrentView('canvas');
  };

  const handleSelectWorkflow = (workflow) => {
    setCurrentWorkflow(workflow);
    setCurrentView('canvas');
  };

  const handleSaveWorkflow = async (workflowData) => {
    try {
      const method = workflowData.id ? 'PUT' : 'POST';
      const url = workflowData.id
        ? `${BACKEND_URL}/api/workflows/${workflowData.id}`
        : `${BACKEND_URL}/api/workflows`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      const result = await response.json();

      if (response.ok) {
        addToast('Workflow saved successfully!', 'success');
        if (!workflowData.id && result.id) {
          setCurrentWorkflow({ ...workflowData, id: result.id });
        }
      } else {
        addToast(result.detail || 'Failed to save workflow', 'error');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      addToast('Failed to save workflow', 'error');
    }
  };

  const handleBackToList = () => {
    setCurrentView('workflows');
    setCurrentWorkflow(null);
  };

  const handleCreateNewForm = () => {
    const newForm = {
      id: null,
      name: 'Untitled Form',
      description: '',
      fields: [],
      version: 1,
      tags: [],
    };
    setCurrentForm(newForm);
    setCurrentView('form-builder');
  };

  const handleSelectForm = (form) => {
    setCurrentForm(form);
    setCurrentView('form-builder');
  };

  const handleBackToForms = () => {
    setCurrentView('forms');
    setCurrentForm(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-primary-500"></div>
          <p className="text-slate-600">Loading LogicCanvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      {(currentView === 'workflows' || currentView === 'forms') && (
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">LogicCanvas</h1>
                <p className="text-xs text-slate-500">Visual Workflow Builder</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex space-x-1 rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => {
                  setActiveTab('workflows');
                  setCurrentView('workflows');
                }}
                className={`flex items-center space-x-2 rounded-md px-4 py-2 transition-colors ${
                  activeTab === 'workflows'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                data-testid="tab-workflows"
              >
                <Workflow className="h-4 w-4" />
                <span>Workflows</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('forms');
                  setCurrentView('forms');
                }}
                className={`flex items-center space-x-2 rounded-md px-4 py-2 transition-colors ${
                  activeTab === 'forms'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                data-testid="tab-forms"
              >
                <FileText className="h-4 w-4" />
                <span>Forms</span>
              </button>
            </nav>

            {/* Quick Actions + Role & Onboarding */}
            <div className="flex items-center space-x-2">
              {/* Role Switcher */}
              <div className="hidden items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 sm:flex">
                <Shield className="mr-1 h-3.5 w-3.5 text-primary-500" />
                <span className="hidden sm:inline">Role:</span>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  data-testid="role-switcher-select"
                >
                  <option value="admin">Admin</option>
                  <option value="builder">Builder</option>
                  <option value="approver">Approver</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <button
                onClick={() => setShowOnboarding(true)}
                className="hidden items-center space-x-1 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 sm:flex"
                data-testid="open-onboarding-btn"
              >
                <span>Take a tour</span>
              </button>

              <button
                onClick={() => setShowGlobalSearch(true)}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-primary-50 hover:text-primary-600"
                data-testid="open-search-btn"
              >
                <SearchIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Search</span>
              </button>

              {can('accessImportExport') && (
                <button
                  onClick={() => setShowImportExport(true)}
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                  data-testid="open-import-export-btn"
                >
                  <Download className="h-5 w-5" />
                  <span className="hidden sm:inline">Import/Export</span>
                </button>
              )}

              {can('accessTasks') && (
                <button
                  onClick={() => setShowTaskInbox(true)}
                  className="relative flex items-center space-x-2 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  data-testid="open-task-inbox-btn"
                >
                  <CheckSquare className="h-5 w-5" />
                  <span className="hidden sm:inline">Tasks</span>
                  {taskCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                      {taskCount > 9 ? '9+' : taskCount}
                    </span>
                  )}
                </button>
              )}

              {can('accessApprovals') && (
                <button
                  onClick={() => setShowApprovalQueue(true)}
                  className="relative flex items-center space-x-2 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
                  data-testid="open-approval-queue-btn"
                >
                  <ClipboardCheck className="h-5 w-5" />
                  <span className="hidden sm:inline">Approvals</span>
                  {approvalCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-xs text-white">
                      {approvalCount > 9 ? '9+' : approvalCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowNotifications(true)}
                className="relative flex items-center space-x-2 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                data-testid="open-notifications-btn"
              >
                <Bell className="h-5 w-5" />
                <span className="hidden sm:inline">Alerts</span>
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-xs text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {can('accessAnalytics') && (
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
                  data-testid="open-analytics-btn"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="hidden sm:inline">Analytics</span>
                </button>
              )}

              <button
                onClick={() => setShowAuditTrail(true)}
                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                data-testid="open-audit-trail-btn"
              >
                <History className="h-5 w-5" />
                <span className="hidden sm:inline">Audit</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main>
        {currentView === 'workflows' && (
          <WorkflowList
            onSelectWorkflow={handleSelectWorkflow}
            onCreateNew={handleCreateNew}
            onLoadRecruitingSample={() => {
              if (!can('createWorkflows')) {
                addToast('You do not have permission to load templates.', 'error');
                return;
              }
              const template = getRecruitingWorkflowTemplate();
              setCurrentWorkflow(template);
              setCurrentView('canvas');
            }}
            onNotify={addToast}
          />
        )}

        {currentView === 'forms' && (
          <FormList
            onSelectForm={handleSelectForm}
            onCreateNew={handleCreateNewForm}
            onNotify={addToast}
          />
        )}

        {currentView === 'canvas' && (
          <div className="relative">
            {/* Back Button */}
            <button
              onClick={handleBackToList}
              className="absolute left-4 top-4 z-10 flex items-center space-x-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-md transition-colors hover:bg-slate-50"
              data-testid="back-to-list-btn"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Workflows</span>
            </button>

            <WorkflowCanvas workflow={currentWorkflow} onSave={handleSaveWorkflow} />
          </div>
        )}

        {currentView === 'form-builder' && <FormBuilder form={currentForm} onBack={handleBackToForms} />}
      </main>

      {/* Task Inbox Modal */}
      {showTaskInbox && <TaskInbox onClose={() => setShowTaskInbox(false)} onNotify={addToast} />}

      {/* Approval Queue Modal */}
      {showApprovalQueue && <ApprovalQueue onClose={() => setShowApprovalQueue(false)} onNotify={addToast} />}

      {/* Notifications Panel Modal */}
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}

      {/* Audit Trail Modal */}
      {showAuditTrail && <AuditTrail onClose={() => setShowAuditTrail(false)} />}

      {/* Analytics Dashboard Modal */}
      {showAnalytics && <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />}

      {/* Global Search Modal */}
      {showGlobalSearch && (
        <GlobalSearch
          isOpen={showGlobalSearch}
          onClose={() => setShowGlobalSearch(false)}
          onSelectWorkflow={handleSelectWorkflow}
          onSelectForm={handleSelectForm}
        />
      )}

      {/* Import/Export Modal */}
      {showImportExport && (
        <ImportExport
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          onImportComplete={() => {
            addToast('Workflows imported successfully!', 'success');
            if (currentView === 'workflows') {
              window.location.reload();
            }
          }}
          onNotify={addToast}
        />
      )}

      {/* Onboarding Tour */}
      <OnboardingTour isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

function App() {
  return (
    <RoleProvider>
      <WorkflowProvider>
        <AppShell />
      </WorkflowProvider>
    </RoleProvider>
  );
}

export default App;
