import React, { useState, useEffect } from 'react';
import './App.css';
import { Activity, FileText, Workflow, CheckSquare, ClipboardCheck, History, Bell } from 'lucide-react';
import { WorkflowProvider } from './contexts/WorkflowContext';
import WorkflowList from './components/WorkflowList';
import WorkflowCanvas from './components/WorkflowCanvas';
import FormList from './components/forms/FormList';
import FormBuilder from './components/forms/FormBuilder';
import TaskInbox from './components/TaskInbox';
import ApprovalQueue from './components/ApprovalQueue';
import AuditTrail from './components/AuditTrail';
import NotificationsPanel from './components/NotificationsPanel';
import { getRecruitingWorkflowTemplate } from './utils/sampleWorkflows';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [currentView, setCurrentView] = useState('workflows'); // 'workflows', 'canvas', 'forms', 'form-builder', 'tasks', 'approvals', 'audit'
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [currentForm, setCurrentForm] = useState(null);
  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(true);
  const [showTaskInbox, setShowTaskInbox] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [approvalCount, setApprovalCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

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
          fetch(`${BACKEND_URL}/api/notifications?unread_only=true`)
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

  const handleCreateNew = () => {
    const newWorkflow = {
      id: null,
      name: 'Untitled Workflow',
      description: '',
      nodes: [],
      edges: [],
      status: 'draft',
      version: 1,
      tags: []
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflowData)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Workflow saved successfully!');
        if (!workflowData.id && result.id) {
          setCurrentWorkflow({ ...workflowData, id: result.id });
        }
      } else {
        alert('Failed to save workflow');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
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
      tags: []
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading LogicCanvas...</p>
        </div>
      </div>
    );
  }

  return (
    <WorkflowProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        {(currentView === 'workflows' || currentView === 'forms') && (
          <header className="bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">LogicCanvas</h1>
                    <p className="text-xs text-slate-500">Visual Workflow Builder</p>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <nav className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setActiveTab('workflows');
                      setCurrentView('workflows');
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'workflows'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    data-testid="tab-workflows"
                  >
                    <Workflow className="w-4 h-4" />
                    <span>Workflows</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('forms');
                      setCurrentView('forms');
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'forms'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    data-testid="tab-forms"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Forms</span>
                  </button>
                </nav>

                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowTaskInbox(true)}
                    className="relative flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    data-testid="open-task-inbox-btn"
                  >
                    <CheckSquare className="w-5 h-5" />
                    <span className="hidden sm:inline">Tasks</span>
                    {taskCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                        {taskCount > 9 ? '9+' : taskCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowApprovalQueue(true)}
                    className="relative flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    data-testid="open-approval-queue-btn"
                  >
                    <ClipboardCheck className="w-5 h-5" />
                    <span className="hidden sm:inline">Approvals</span>
                    {approvalCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                        {approvalCount > 9 ? '9+' : approvalCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="relative flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    data-testid="open-notifications-btn"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="hidden sm:inline">Alerts</span>
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAuditTrail(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    data-testid="open-audit-trail-btn"
                  >
                    <History className="w-5 h-5" />
                    <span className="hidden sm:inline">Audit</span>
                  </button>
                </div>
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
                const template = getRecruitingWorkflowTemplate();
                setCurrentWorkflow(template);
                setCurrentView('canvas');
              }}
            />
          )}
          
          {currentView === 'forms' && (
            <FormList 
              onSelectForm={handleSelectForm}
              onCreateNew={handleCreateNewForm}
            />
          )}
          
          {currentView === 'canvas' && (
            <div className="relative">
              {/* Back Button */}
              <button
                onClick={handleBackToList}
                className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-white text-slate-700 px-4 py-2 rounded-lg shadow-md hover:bg-slate-50 transition-colors border border-slate-200"
                data-testid="back-to-list-btn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Workflows</span>
              </button>
              
              <WorkflowCanvas 
                workflow={currentWorkflow}
                onSave={handleSaveWorkflow}
              />
            </div>
          )}

          {currentView === 'form-builder' && (
            <FormBuilder 
              form={currentForm}
              onBack={handleBackToForms}
            />
          )}
        </main>

        {/* Task Inbox Modal */}
        {showTaskInbox && (
          <TaskInbox onClose={() => setShowTaskInbox(false)} />
        )}

        {/* Approval Queue Modal */}
        {showApprovalQueue && (
          <ApprovalQueue onClose={() => setShowApprovalQueue(false)} />
        )}

        {/* Notifications Panel Modal */}
        {showNotifications && (
          <NotificationsPanel onClose={() => setShowNotifications(false)} />
        )}

        {/* Audit Trail Modal */}
        {showAuditTrail && (
          <AuditTrail onClose={() => setShowAuditTrail(false)} />
        )}
      </div>
    </WorkflowProvider>
  );
}

export default App;
