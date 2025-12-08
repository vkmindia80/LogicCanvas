import React from 'react';
import { 
  Activity, Workflow, FileText, BarChart3, CheckSquare, ArrowRight, Shield, 
  Zap, Users, GitBranch, Clock, Database, Lock, Settings, 
  TrendingUp, Target, Layers, Box, Play, CheckCircle2
} from 'lucide-react';

const LandingPage = ({ onGetStarted, currentUser, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-indigo-200/50 bg-white/90 backdrop-blur-xl shadow-lg shadow-indigo-200/50">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3" data-testid="landing-header-brand">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 shadow-lg shadow-indigo-500/30">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-900 to-indigo-700 bg-clip-text text-transparent">LogicCanvas</h1>
              <p className="text-[10px] uppercase tracking-wider text-indigo-600 font-semibold">Visual Workflow Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser && (
              <div
                className="hidden items-center space-x-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs text-slate-700 shadow-sm sm:flex"
                data-testid="landing-current-user-chip"
              >
                <Shield className="h-4 w-4 text-indigo-500" />
                <span className="font-medium">{currentUser.name || currentUser.email}</span>
                <span className="text-indigo-400">· {currentUser.role}</span>
              </div>
            )}

            {currentUser ? (
              <button
                onClick={onLogout}
                className="rounded-xl border-2 border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-md hover:bg-indigo-50 transition-all"
                data-testid="landing-logout-btn"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-500/40 transition-all hover:shadow-2xl hover:shadow-indigo-500/50"
                data-testid="landing-login-btn"
              >
                <span>Access Demo</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-indigo-200/50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30" />
        <div className="absolute inset-0 bg-grid-indigo-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" style={{ backgroundSize: '30px 30px' }} />
        
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Column */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>Live Demo • No Signup Required • Instant Access</span>
              </div>

              <div className="space-y-6">
                <h1
                  className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
                  data-testid="landing-hero-title"
                >
                  Enterprise Workflow
                  <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    Automation Platform
                  </span>
                </h1>
                <p
                  className="text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto lg:mx-0"
                  data-testid="landing-hero-subtitle"
                >
                  Design, automate, and optimize business processes with a visual workflow builder. 
                  From approval workflows to complex process orchestration—all in one powerful platform.
                </p>
              </div>

              <div
                className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
                data-testid="landing-hero-cta"
              >
                <button
                  onClick={onGetStarted}
                  className="group inline-flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-indigo-500/50 transition-all hover:shadow-3xl hover:shadow-indigo-500/60 hover:-translate-y-1 w-full sm:w-auto"
                  data-testid="landing-get-started-btn"
                >
                  <Play className="h-6 w-6" />
                  <span>{currentUser ? 'Enter Workspace' : 'Start Demo Now'}</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="flex items-center space-x-6 text-sm text-primary-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>3 Demo Accounts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>Sample Data</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-6 border-t border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">9</div>
                  <div className="text-xs text-primary-600 mt-1">Node Types</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">19+</div>
                  <div className="text-xs text-primary-600 mt-1">Form Fields</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">5</div>
                  <div className="text-xs text-primary-600 mt-1">Approval Types</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">4</div>
                  <div className="text-xs text-primary-600 mt-1">User Roles</div>
                </div>
              </div>
            </div>

            {/* Right Column - Feature Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-gold-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-green-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-2xl" data-testid="landing-feature-list">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
                      <CheckSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-primary-900">Platform Capabilities</h3>
                      <p className="text-xs text-primary-600">Explore in this demo</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    Ready to Use
                  </span>
                </div>
                
                <div className="space-y-3">
                  {[
                    { icon: Workflow, text: 'Visual drag-and-drop workflow canvas with 9 node types' },
                    { icon: FileText, text: '19+ form field types with validation and conditional logic' },
                    { icon: CheckSquare, text: 'Multi-level approval flows (Sequential, Parallel, Unanimous)' },
                    { icon: Users, text: 'Task assignment with round-robin & load balancing' },
                    { icon: BarChart3, text: 'Real-time analytics dashboard with performance metrics' },
                    { icon: Clock, text: 'SLA tracking, auto-escalation & notifications' },
                    { icon: Lock, text: 'RBAC with audit trail & compliance tracking' },
                    { icon: Zap, text: 'Workflow execution engine with triggers & webhooks' }
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-3 rounded-lg bg-green-50/80 p-3 border border-green-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all">
                      <feature.icon className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-primary-700 leading-relaxed">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white border-b border-green-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 mb-4">
              <Layers className="h-4 w-4" />
              <span>Core Capabilities</span>
            </div>
            <h2 className="text-3xl font-bold text-primary-900 sm:text-4xl">
              Everything You Need to Automate Workflows
            </h2>
            <p className="mt-4 text-lg text-primary-600 max-w-2xl mx-auto">
              From design to deployment, monitor and optimize every aspect of your business processes
            </p>
          </div>

          <div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            data-testid="landing-feature-summary"
          >
            {/* Feature Card 1 */}
            <div className="group relative rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50/50 p-8 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 mb-5">
                  <Workflow className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Visual Workflow Builder</h3>
                <p className="text-primary-600 leading-relaxed mb-4">
                  Design complex workflows with an intuitive drag-and-drop canvas. Connect tasks, approvals, 
                  forms, and actions into automated business processes.
                </p>
                <ul className="space-y-2 text-sm text-primary-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>9 specialized node types</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Auto-layout & grid snapping</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Real-time validation</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="group relative rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50/50 p-8 shadow-sm hover:shadow-xl hover:border-gold-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold-500/10 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-lg shadow-purple-500/30 mb-5">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Smart Form Builder</h3>
                <p className="text-primary-600 leading-relaxed mb-4">
                  Create dynamic forms with 19+ field types, validation rules, and conditional logic. 
                  Collect structured data seamlessly within workflows.
                </p>
                <ul className="space-y-2 text-sm text-primary-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>19+ field types & validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Conditional field visibility</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Reusable form library</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group relative rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50/50 p-8 shadow-sm hover:shadow-xl hover:border-green-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30 mb-5">
                  <CheckSquare className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Multi-Level Approvals</h3>
                <p className="text-primary-600 leading-relaxed mb-4">
                  Configure sophisticated approval workflows with multiple strategies: sequential, parallel, 
                  unanimous, or majority voting.
                </p>
                <ul className="space-y-2 text-sm text-primary-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>5 approval strategies</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Decision tracking & comments</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Approval queue management</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="group relative rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50/50 p-8 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 mb-5">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Task Management</h3>
                <p className="text-primary-600 leading-relaxed mb-4">
                  Intelligent task assignment with multiple strategies. Track SLAs, escalate overdue tasks, 
                  and balance workload across teams.
                </p>
                <ul className="space-y-2 text-sm text-primary-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Smart assignment strategies</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Reassign, delegate, escalate</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>SLA tracking & alerts</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 5 */}
            <div className="group relative rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50/50 p-8 shadow-sm hover:shadow-xl hover:border-gold-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold-500/10 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-lg shadow-orange-500/30 mb-5">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Analytics & Insights</h3>
                <p className="text-primary-600 leading-relaxed mb-4">
                  Monitor workflow performance, identify bottlenecks, and optimize processes with 
                  comprehensive analytics and real-time dashboards.
                </p>
                <ul className="space-y-2 text-sm text-primary-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Performance metrics & KPIs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Bottleneck identification</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>User productivity tracking</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature Card 6 */}
            <div className="group relative rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50/50 p-8 shadow-sm hover:shadow-xl hover:border-green-200 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-indigo-500/30 mb-5">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Execution Engine</h3>
                <p className="text-primary-600 leading-relaxed mb-4">
                  Powerful workflow execution with triggers, webhooks, and API actions. Schedule workflows 
                  or trigger them via external events.
                </p>
                <ul className="space-y-2 text-sm text-primary-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Manual, scheduled & webhook triggers</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Parallel execution support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Live execution tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-green-50 to-white border-b border-green-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 mb-4">
              <GitBranch className="h-4 w-4" />
              <span>Simple Process</span>
            </div>
            <h2 className="text-3xl font-bold text-primary-900 sm:text-4xl">
              From Design to Deployment in 3 Steps
            </h2>
            <p className="mt-4 text-lg text-primary-600 max-w-2xl mx-auto">
              Build, automate, and optimize your workflows with ease
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-xl shadow-primary-500/40">
                    <Workflow className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-sm font-bold text-white shadow-lg">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Design Workflows</h3>
                <p className="text-primary-600 leading-relaxed">
                  Use the visual canvas to drag and drop nodes, connect steps, and define your business logic. 
                  Add forms, approvals, tasks, and actions.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary-500 to-gold-500" style={{ width: 'calc(100% - 5rem)', left: 'calc(50% + 2.5rem)' }} />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-xl shadow-purple-500/40">
                    <Settings className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-sm font-bold text-white shadow-lg">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Configure & Automate</h3>
                <p className="text-primary-600 leading-relaxed">
                  Set up assignment rules, approval strategies, SLAs, and triggers. Configure webhooks and 
                  API integrations for external systems.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-gold-500 to-emerald-500" style={{ width: 'calc(100% - 5rem)', left: 'calc(50% + 2.5rem)' }} />
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/40">
                    <TrendingUp className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-sm font-bold text-white shadow-lg">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">Monitor & Optimize</h3>
                <p className="text-primary-600 leading-relaxed">
                  Track execution in real-time, analyze performance metrics, identify bottlenecks, and 
                  continuously improve your workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white border-b border-green-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 rounded-full bg-gold-100 px-4 py-2 text-sm font-semibold text-gold-700 mb-4">
              <Target className="h-4 w-4" />
              <span>Real-World Applications</span>
            </div>
            <h2 className="text-3xl font-bold text-primary-900 sm:text-4xl">
              Built for Every Department
            </h2>
            <p className="mt-4 text-lg text-primary-600 max-w-2xl mx-auto">
              From HR to finance, operations to IT—automate any business process
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { 
                icon: Users, 
                title: 'HR & Recruiting', 
                color: 'from-green-500 to-green-600',
                shadowColor: 'shadow-green-500/30',
                examples: ['Onboarding workflows', 'Leave approvals', 'Candidate screening']
              },
              { 
                icon: Database, 
                title: 'Finance & Accounting', 
                color: 'from-emerald-500 to-emerald-600',
                shadowColor: 'shadow-emerald-500/30',
                examples: ['Invoice approvals', 'Expense reimbursement', 'Budget requests']
              },
              { 
                icon: Box, 
                title: 'Operations', 
                color: 'from-gold-500 to-gold-600',
                shadowColor: 'shadow-orange-500/30',
                examples: ['Procurement workflows', 'Vendor management', 'Change requests']
              },
              { 
                icon: Settings, 
                title: 'IT & Support', 
                color: 'from-gold-500 to-gold-600',
                shadowColor: 'shadow-purple-500/30',
                examples: ['Service requests', 'Incident management', 'Access provisioning']
              }
            ].map((useCase, idx) => (
              <div key={idx} className="group rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50/50 p-6 hover:shadow-xl hover:border-green-300 transition-all duration-300">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${useCase.color} shadow-lg ${useCase.shadowColor} mb-4`}>
                  <useCase.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">{useCase.title}</h3>
                <ul className="space-y-2">
                  {useCase.examples.map((example, i) => (
                    <li key={i} className="flex items-center space-x-2 text-sm text-primary-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Access Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary-50 via-gold-50/30 to-green-50 border-b border-green-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 mb-4">
              <Shield className="h-4 w-4" />
              <span>3 Demo Roles Available</span>
            </div>
            <h2 className="text-3xl font-bold text-primary-900 sm:text-4xl mb-4">
              Experience From Every Perspective
            </h2>
            <p className="text-lg text-primary-600 max-w-2xl mx-auto">
              Try different roles to see how each team member interacts with workflows
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                role: 'Admin',
                email: 'admin@example.com',
                password: 'admin123',
                color: 'from-gold-500 to-gold-600',
                shadowColor: 'shadow-gold-500/30',
                capabilities: ['Manage all workflows', 'View analytics', 'Configure system', 'Audit logs access']
              },
              {
                role: 'Builder',
                email: 'builder@example.com',
                password: 'builder123',
                color: 'from-primary-500 to-primary-600',
                shadowColor: 'shadow-primary-500/30',
                capabilities: ['Design workflows', 'Create forms', 'Configure triggers', 'Test executions']
              },
              {
                role: 'Approver',
                email: 'approver@example.com',
                password: 'approver123',
                color: 'from-emerald-500 to-emerald-600',
                shadowColor: 'shadow-emerald-500/30',
                capabilities: ['Review approvals', 'Complete tasks', 'Add comments', 'Track SLAs']
              }
            ].map((demo, idx) => (
              <div key={idx} className="rounded-2xl border border-green-200 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${demo.color} shadow-lg ${demo.shadowColor}`}>
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900">{demo.role}</h3>
                    <p className="text-xs text-green-500">Demo Account</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4 pb-4 border-b border-green-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary-600">Email:</span>
                    <code className="text-xs bg-green-100 px-2 py-1 rounded">{demo.email}</code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary-600">Password:</span>
                    <code className="text-xs bg-green-100 px-2 py-1 rounded">{demo.password}</code>
                  </div>
                </div>

                <div className="space-y-2">
                  {demo.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-center space-x-2 text-sm text-primary-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.3))]" style={{ backgroundSize: '30px 30px' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-gold-500/10" />
        
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl mb-6">
            Ready to Transform Your Workflows?
          </h2>
          <p className="text-xl text-green-300 mb-10 max-w-2xl mx-auto">
            Start exploring LogicCanvas now. No signup required—instant access to full demo with sample data.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center justify-center space-x-3 rounded-xl bg-white px-10 py-5 text-lg font-semibold text-primary-900 shadow-2xl hover:shadow-white/20 transition-all transform hover:-translate-y-1 w-full sm:w-auto"
              data-testid="landing-get-started-btn"
            >
              <Play className="h-6 w-6 text-primary-600" />
              <span>Launch Demo Now</span>
              <ArrowRight className="h-6 w-6 text-primary-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-green-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>No Installation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Full Features</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-900" data-testid="landing-footer-text">LogicCanvas</p>
                <p className="text-xs text-green-500">Enterprise Workflow Automation</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-green-500">
              <span>Built with React, FastAPI, and MongoDB</span>
              <span className="hidden sm:inline">•</span>
              <span>Powered by React Flow & Recharts</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
