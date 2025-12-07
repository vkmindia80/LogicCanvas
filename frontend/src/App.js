import React, { useState, useEffect } from 'react';
import './App.css';
import { Activity, FileText, Workflow, CheckSquare, ClipboardCheck, History, Bell, BarChart3, Search as SearchIcon, Download, Shield, Menu, X, Home, Settings, LogOut, Globe, Bug, Sparkles, Zap } from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
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
import TemplateLibrary from './components/TemplateLibrary';
import QuickStartWizard from './components/QuickStartWizard';
import GettingStartedChecklist from './components/GettingStartedChecklist';
import { ToastContainer } from './components/Toast';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import ConnectorLibrary from './components/ConnectorLibrary';
import IntegrationHub from './components/IntegrationHub';
import DebugPanel from './components/DebugPanel';
import VideoTutorials from './components/VideoTutorials';
import SubworkflowPatternLibrary from './components/SubworkflowPatternLibrary';
import TransformationPlayground from './components/TransformationPlayground';
import ComponentLibrary from './components/ComponentLibrary';
import SubprocessConfig from './components/SubprocessConfig';

import { getRecruitingWorkflowTemplate } from './utils/sampleWorkflows';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AppShell = () => {
  const [currentView, setCurrentView] = useState('workflows');
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [currentForm, setCurrentForm] = useState(null);
  const [activeTab, setActiveTab] = useState('workflows');
  const [activeMenuItem, setActiveMenuItem] = useState('workflows');
  const [loading, setLoading] = useState(true);
  const [showTaskInbox, setShowTaskInbox] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showQuickStartWizard, setShowQuickStartWizard] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    // Show checklist for first-time users
    return localStorage.getItem('lc_checklist_dismissed') !== 'true';
  });
  const [showConnectorLibrary, setShowConnectorLibrary] = useState(false);
  const [showIntegrationHub, setShowIntegrationHub] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugInstanceId, setDebugInstanceId] = useState(null);
  const [showVideoTutorials, setShowVideoTutorials] = useState(false);
  const [showPatternLibrary, setShowPatternLibrary] = useState(false);
  const [showTransformationPlayground, setShowTransformationPlayground] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('lc_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('lc_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [approvalCount, setApprovalCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [showLogin, setShowLogin] = useState(false);

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
    if (currentUser?.role) {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser, setCurrentRole]);

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

  // Centralized navigation handler to close all modals and set active menu
  const handleNavigate = (menuItem, viewOrModalAction) => {
    // Close all modals
    setShowTaskInbox(false);
    setShowApprovalQueue(false);
    setShowNotifications(false);
    setShowAuditTrail(false);
    setShowAnalytics(false);
    setShowGlobalSearch(false);
    setShowImportExport(false);
    setShowConnectorLibrary(false);
    setShowIntegrationHub(false);
    setShowDebugPanel(false);
    setShowTransformationPlayground(false);
    setShowOnboarding(false);
    setShowTemplateLibrary(false);
    setShowQuickStartWizard(false);
    setShowVideoTutorials(false);
    setShowPatternLibrary(false);
    setShowComponentLibrary(false);
    setMobileSidebarOpen(false);
    
    // Set active menu item
    setActiveMenuItem(menuItem);
    
    // Execute the specific view or modal action
    if (viewOrModalAction) {
      viewOrModalAction();
    }
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center text-slate-100">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-primary-400"></div>
          <p className="text-sm text-slate-300">Warming up LogicCanvas services…</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !authToken) {
    if (showLogin) {
      return (
        <>
          <LoginPage
            onLoginSuccess={(token, user) => {
              handleAuthSuccess(token, user);
              setShowLogin(false);
            }}
            onBack={() => setShowLogin(false)}
          />
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
      );
    }

    return (
      <>
        <LandingPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onGetStarted={() => setShowLogin(true)}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left Sidebar */}
      <aside
        className="fixed left-0 top-0 z-40 h-screen w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transition-all duration-300 flex flex-col hidden lg:block"
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">LogicCanvas</h1>
              <p className="text-xs text-slate-400">Workflow Builder</p>
            </div>
          </div>
        </div>

        {/* Navigation - Enhanced scrolling */}
        <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden px-3 py-4" style={{ minHeight: 0, maxHeight: 'calc(100vh - 16rem)' }}>
          <div className="space-y-1">
          <button
            onClick={() => {
              handleNavigate('workflows', () => {
                setActiveTab('workflows');
                setCurrentView('workflows');
              });
            }}
            className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              activeMenuItem === 'workflows'
                ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            data-testid="sidebar-workflows"
          >
            <Workflow className="h-5 w-5 flex-shrink-0" />
            {<span>Workflows</span>}
          </button>

          <button
            onClick={() => {
              handleNavigate('forms', () => {
                setActiveTab('forms');
                setCurrentView('forms');
              });
            }}
            className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              activeMenuItem === 'forms'
                ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            data-testid="sidebar-forms"
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            {<span>Forms</span>}
          </button>

          <div className="my-3 border-t border-slate-700"></div>

          {can('accessTasks') && (
            <button
              onClick={() => {
                handleNavigate('tasks', () => setShowTaskInbox(true));
              }}
              className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                activeMenuItem === 'tasks'
                  ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              data-testid="sidebar-tasks"
            >
              <CheckSquare className="h-5 w-5 flex-shrink-0" />
              {<span>Tasks</span>}
              {taskCount > 0 && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  {taskCount > 9 ? '9+' : taskCount}
                </span>
              )}
            </button>
          )}

          {can('accessApprovals') && (
            <button
              onClick={() => {
                handleNavigate('approvals', () => setShowApprovalQueue(true));
              }}
              className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                activeMenuItem === 'approvals'
                  ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              data-testid="sidebar-approvals"
            >
              <ClipboardCheck className="h-5 w-5 flex-shrink-0" />
              {<span>Approvals</span>}
              {approvalCount > 0 && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-xs text-white">
                  {approvalCount > 9 ? '9+' : approvalCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => {
              handleNavigate('notifications', () => setShowNotifications(true));
            }}
            className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              activeMenuItem === 'notifications'
                ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            data-testid="sidebar-notifications"
          >
            <Bell className="h-5 w-5 flex-shrink-0" />
            {<span>Notifications</span>}
            {notificationCount > 0 && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-xs text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {can('accessAnalytics') && (
            <button
              onClick={() => {
                handleNavigate('analytics', () => setShowAnalytics(true));
              }}
              className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                activeMenuItem === 'analytics'
                  ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              data-testid="sidebar-analytics"
            >
              <BarChart3 className="h-5 w-5 flex-shrink-0" />
              {<span>Analytics</span>}
            </button>
          )}

          <button
            onClick={() => {
              handleNavigate('audit', () => setShowAuditTrail(true));
            }}
            className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              activeMenuItem === 'audit'
                ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            data-testid="sidebar-audit"
          >
            <History className="h-5 w-5 flex-shrink-0" />
            {<span>Audit Trail</span>}
          </button>

          <div className="my-3 border-t border-slate-700"></div>

          <button
            onClick={() => {
              handleNavigate('search', () => setShowGlobalSearch(true));
            }}
            className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              activeMenuItem === 'search'
                ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            data-testid="sidebar-search"
          >
            <SearchIcon className="h-5 w-5 flex-shrink-0" />
            {<span>Search</span>}
          </button>

          {can('accessImportExport') && (
            <button
              onClick={() => {
                handleNavigate('import-export', () => setShowImportExport(true));
              }}
              className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                activeMenuItem === 'import-export'
                  ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              data-testid="sidebar-import-export"
            >
              <Download className="h-5 w-5 flex-shrink-0" />
              {<span>Import/Export</span>}
            </button>
          )}

          <div className="my-3 border-t border-slate-700"></div>

          <button
            onClick={() => {
              handleNavigate('integration-hub', () => setShowIntegrationHub(true));
            }}
            className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              activeMenuItem === 'integration-hub'
                ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            data-testid="sidebar-integration-hub"
          >
            <Globe className="h-5 w-5 flex-shrink-0" />
            {<span>Integration Hub</span>}
          </button>

          <button
            onClick={() => {
              handleNavigate('connectors', () => setShowConnectorLibrary(true));
            }}
            className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              activeMenuItem === 'connectors'
                ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            data-testid="sidebar-connectors"
          >
            <Zap className="h-5 w-5 flex-shrink-0" />
            {<span>API Connectors</span>}
          </button>

          {can('accessAnalytics') && (
            <button
              onClick={() => {
                handleNavigate('debug', () => setShowDebugPanel(true));
              }}
              className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                activeMenuItem === 'debug'
                  ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
              data-testid="sidebar-debug"
            >
              <Bug className="h-5 w-5 flex-shrink-0" />
              {<span>Debug Console</span>}
            </button>
          )}

          <button
            onClick={() => {
              handleNavigate('transformations', () => setShowTransformationPlayground(true));
            }}
            className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              activeMenuItem === 'transformations'
                ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            data-testid="sidebar-transformations"
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            {<span>Transformations</span>}
          </button>

          <div className="my-3 border-t border-slate-700"></div>

          <button
            onClick={() => {
              handleNavigate('tour', () => setShowOnboarding(true));
            }}
            className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
              activeMenuItem === 'tour'
                ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            data-testid="sidebar-tour"
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {<span>Take a Tour</span>}
          </button>
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-700 p-4 flex-shrink-0">
          {/* Role Switcher */}
          <div className="mb-3 rounded-lg bg-slate-800/50 p-3">
            <div className="mb-2 flex items-center space-x-2 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5" />
              <span>Current Role</span>
            </div>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              data-testid="sidebar-role-switcher"
            >
              <option value="admin">Admin</option>
              <option value="builder">Builder</option>
              <option value="approver">Approver</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* User Info */}
          {currentUser && (
            <div className="mb-3 rounded-lg bg-slate-800/50 p-3">
              <div className="mb-1 text-sm font-medium text-white">{currentUser.name || currentUser.email}</div>
              <div className="text-xs text-slate-400">{currentUser.role}</div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
            data-testid="sidebar-logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>
          <aside className="absolute left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">LogicCanvas</h1>
                  <p className="text-xs text-slate-400">Workflow Builder</p>
                </div>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden px-3 py-4" style={{ minHeight: 0 }}>
              <div className="space-y-1">
              <button
                onClick={() => {
                  handleNavigate('workflows', () => {
                    setActiveTab('workflows');
                    setCurrentView('workflows');
                    setMobileSidebarOpen(false);
                  });
                }}
                className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  activeMenuItem === 'workflows'
                    ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Workflow className="h-5 w-5 flex-shrink-0" />
                <span>Workflows</span>
              </button>

              <button
                onClick={() => {
                  handleNavigate('forms', () => {
                    setActiveTab('forms');
                    setCurrentView('forms');
                    setMobileSidebarOpen(false);
                  });
                }}
                className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  activeMenuItem === 'forms'
                    ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                <span>Forms</span>
              </button>

              <div className="my-3 border-t border-slate-700"></div>

              {can('accessTasks') && (
                <button
                  onClick={() => {
                    handleNavigate('tasks', () => {
                      setShowTaskInbox(true);
                      setMobileSidebarOpen(false);
                    });
                  }}
                  className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                    activeMenuItem === 'tasks'
                      ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <CheckSquare className="h-5 w-5 flex-shrink-0" />
                  <span>Tasks</span>
                  {taskCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                      {taskCount > 9 ? '9+' : taskCount}
                    </span>
                  )}
                </button>
              )}

              {can('accessApprovals') && (
                <button
                  onClick={() => {
                    handleNavigate('approvals', () => {
                      setShowApprovalQueue(true);
                      setMobileSidebarOpen(false);
                    });
                  }}
                  className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                    activeMenuItem === 'approvals'
                      ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <ClipboardCheck className="h-5 w-5 flex-shrink-0" />
                  <span>Approvals</span>
                  {approvalCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-xs text-white">
                      {approvalCount > 9 ? '9+' : approvalCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  handleNavigate('notifications', () => {
                    setShowNotifications(true);
                    setMobileSidebarOpen(false);
                  });
                }}
                className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  activeMenuItem === 'notifications'
                    ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Bell className="h-5 w-5 flex-shrink-0" />
                <span>Notifications</span>
                {notificationCount > 0 && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-xs text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {can('accessAnalytics') && (
                <button
                  onClick={() => {
                    handleNavigate('analytics', () => {
                      setShowAnalytics(true);
                      setMobileSidebarOpen(false);
                    });
                  }}
                  className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                    activeMenuItem === 'analytics'
                      ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-5 w-5 flex-shrink-0" />
                  <span>Analytics</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleNavigate('audit', () => {
                    setShowAuditTrail(true);
                    setMobileSidebarOpen(false);
                  });
                }}
                className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  activeMenuItem === 'audit'
                    ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <History className="h-5 w-5 flex-shrink-0" />
                <span>Audit Trail</span>
              </button>

              <div className="my-3 border-t border-slate-700"></div>

              <button
                onClick={() => {
                  handleNavigate('search', () => {
                    setShowGlobalSearch(true);
                    setMobileSidebarOpen(false);
                  });
                }}
                className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  activeMenuItem === 'search'
                    ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <SearchIcon className="h-5 w-5 flex-shrink-0" />
                <span>Search</span>
              </button>

              {can('accessImportExport') && (
                <button
                  onClick={() => {
                    handleNavigate('import-export', () => {
                      setShowImportExport(true);
                      setMobileSidebarOpen(false);
                    });
                  }}
                  className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                    activeMenuItem === 'import-export'
                      ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Download className="h-5 w-5 flex-shrink-0" />
                  <span>Import/Export</span>
                </button>
              )}

              <div className="my-3 border-t border-slate-700"></div>

              <button
                onClick={() => {
                  handleNavigate('integration-hub', () => {
                    setShowIntegrationHub(true);
                    setMobileSidebarOpen(false);
                  });
                }}
                className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  activeMenuItem === 'integration-hub'
                    ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Globe className="h-5 w-5 flex-shrink-0" />
                <span>Integration Hub</span>
              </button>

              <button
                onClick={() => {
                  handleNavigate('connectors', () => {
                    setShowConnectorLibrary(true);
                    setMobileSidebarOpen(false);
                  });
                }}
                className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  activeMenuItem === 'connectors'
                    ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Zap className="h-5 w-5 flex-shrink-0" />
                <span>API Connectors</span>
              </button>

              {can('accessAnalytics') && (
                <button
                  onClick={() => {
                    handleNavigate('debug', () => {
                      setShowDebugPanel(true);
                      setMobileSidebarOpen(false);
                    });
                  }}
                  className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                    activeMenuItem === 'debug'
                      ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Bug className="h-5 w-5 flex-shrink-0" />
                  <span>Debug Console</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleNavigate('transformations', () => {
                    setShowTransformationPlayground(true);
                    setMobileSidebarOpen(false);
                  });
                }}
                className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  activeMenuItem === 'transformations'
                    ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Sparkles className="h-5 w-5 flex-shrink-0" />
                <span>Transformations</span>
              </button>

              <div className="my-3 border-t border-slate-700"></div>

              <button
                onClick={() => {
                  handleNavigate('tour', () => {
                    setShowOnboarding(true);
                    setMobileSidebarOpen(false);
                  });
                }}
                className={`relative flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                  activeMenuItem === 'tour'
                    ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/20 menu-item-hamburger'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                <span>Take a Tour</span>
              </button>
              </div>
            </nav>

            {/* User Section */}
            <div className="border-t border-slate-700 p-4 flex-shrink-0">
              {/* Role Switcher */}
              <div className="mb-3 rounded-lg bg-slate-800/50 p-3">
                <div className="mb-2 flex items-center space-x-2 text-xs text-slate-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Current Role</span>
                </div>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="w-full rounded-md border border-slate-600 bg-slate-700 px-2 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="admin">Admin</option>
                  <option value="builder">Builder</option>
                  <option value="approver">Approver</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              {/* User Info */}
              {currentUser && (
                <div className="mb-3 rounded-lg bg-slate-800/50 p-3">
                  <div className="mb-1 text-sm font-medium text-white">{currentUser.name || currentUser.email}</div>
                  <div className="text-xs text-slate-400">{currentUser.role}</div>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileSidebarOpen(false);
                }}
                className="flex w-full items-center justify-center space-x-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 transition-all duration-300 lg:ml-72">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <button onClick={() => setMobileSidebarOpen(true)} className="text-slate-600 hover:text-slate-900">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">LogicCanvas</h1>
            </div>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Content Area */}
        <div className="min-h-screen">
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
            <FormList onSelectForm={handleSelectForm} onCreateNew={handleCreateNewForm} onNotify={addToast} />
          )}

          {currentView === 'canvas' && (
            <ReactFlowProvider>
              <div className="relative">
                <button
                  onClick={handleBackToList}
                  className="absolute left-4 top-4 z-10 flex items-center space-x-2 rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-slate-700 shadow-lg hover:shadow-xl transition-all hover:bg-slate-50 font-medium"
                  data-testid="back-to-list-btn"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Workflows</span>
                </button>
                <WorkflowCanvas 
                  workflow={currentWorkflow} 
                  onSave={handleSaveWorkflow}
                  showTemplates={() => setShowTemplateLibrary(true)}
                  showWizard={() => setShowQuickStartWizard(true)}
                />
              </div>
            </ReactFlowProvider>
          )}

          {currentView === 'form-builder' && <FormBuilder form={currentForm} onBack={handleBackToForms} />}
        </div>
      </main>

      {/* Modals */}
      {showTaskInbox && <TaskInbox onClose={() => { setShowTaskInbox(false); setActiveMenuItem(activeTab); }} onNotify={addToast} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />}
      {showApprovalQueue && <ApprovalQueue onClose={() => { setShowApprovalQueue(false); setActiveMenuItem(activeTab); }} onNotify={addToast} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />}
      {showNotifications && <NotificationsPanel onClose={() => { setShowNotifications(false); setActiveMenuItem(activeTab); }} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />}
      {showAuditTrail && <AuditTrail onClose={() => { setShowAuditTrail(false); setActiveMenuItem(activeTab); }} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />}
      {showAnalytics && <AnalyticsDashboard onClose={() => { setShowAnalytics(false); setActiveMenuItem(activeTab); }} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />}
      {showGlobalSearch && (
        <GlobalSearch
          isOpen={showGlobalSearch}
          onClose={() => { setShowGlobalSearch(false); setActiveMenuItem(activeTab); }}
          onSelectWorkflow={handleSelectWorkflow}
          onSelectForm={handleSelectForm}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
      )}
      {showImportExport && (
        <ImportExport
          isOpen={showImportExport}
          onClose={() => { setShowImportExport(false); setActiveMenuItem(activeTab); }}
          onImportComplete={() => {
            addToast('Workflows imported successfully!', 'success');
            if (currentView === 'workflows') {
              window.location.reload();
            }
          }}
          onNotify={addToast}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
      )}
      <OnboardingTour isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <TemplateLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelectTemplate={(workflow) => {
          setCurrentWorkflow(workflow);
          setCurrentView('canvas');
          addToast('Template loaded successfully!', 'success');
        }}
      />
      <QuickStartWizard
        isOpen={showQuickStartWizard}
        onClose={() => setShowQuickStartWizard(false)}
        onCreate={(workflow) => {
          setCurrentWorkflow(workflow);
          setCurrentView('canvas');
          addToast('Workflow created with AI guidance!', 'success');
        }}
      />
      {showIntegrationHub && (
        <IntegrationHub
          onClose={() => { setShowIntegrationHub(false); setActiveMenuItem(activeTab); }}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
      )}
      {showConnectorLibrary && (
        <ConnectorLibrary
          onClose={() => { setShowConnectorLibrary(false); setActiveMenuItem(activeTab); }}
          onSelect={(connector) => {
            addToast(`Connector "${connector.name}" selected!`, 'success');
            setShowConnectorLibrary(false);
            setActiveMenuItem(activeTab);
          }}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
      )}
      {showDebugPanel && debugInstanceId && (
        <DebugPanel
          instanceId={debugInstanceId}
          onClose={() => {
            setShowDebugPanel(false);
            setDebugInstanceId(null);
            setActiveMenuItem(activeTab);
          }}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
      )}
      <GettingStartedChecklist
        isOpen={showGettingStarted}
        onClose={() => setShowGettingStarted(false)}
        onAction={(action) => {
          switch (action) {
            case 'tour':
              setShowOnboarding(true);
              break;
            case 'wizard':
              setShowQuickStartWizard(true);
              break;
            case 'template':
              setShowTemplateLibrary(true);
              break;
            case 'videos':
              setShowVideoTutorials(true);
              break;
            default:
              break;
          }
        }}
      />
      <VideoTutorials
        isOpen={showVideoTutorials}
        onClose={() => setShowVideoTutorials(false)}
      />
      <SubworkflowPatternLibrary
        isOpen={showPatternLibrary}
        onClose={() => setShowPatternLibrary(false)}
        onUsePattern={(pattern) => {
          addToast(`Pattern "${pattern.name}" guide copied! You can now implement it in your workflow.`, 'success', 5000);
        }}
      />
      {showTransformationPlayground && (
        <TransformationPlayground
          onClose={() => { setShowTransformationPlayground(false); setActiveMenuItem(activeTab); }}
         
        />
      )}
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
