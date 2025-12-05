import React from 'react';
import { Activity, Workflow, FileText, BarChart3, CheckSquare, ArrowRight, Shield } from 'lucide-react';

const LandingPage = ({ onGetStarted, currentUser, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3" data-testid="landing-header-brand">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">LogicCanvas</h1>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Visual workflow OS</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser && (
              <div className="hidden items-center space-x-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 sm:flex" data-testid="landing-current-user-chip">
                <Shield className="h-3.5 w-3.5 text-emerald-300" />
                <span className="font-medium">{currentUser.name || currentUser.email}</span>
                <span className="text-slate-400">· {currentUser.role}</span>
              </div>
            )}

            {currentUser ? (
              <button
                onClick={onLogout}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-red-400 hover:bg-red-500/20"
                data-testid="landing-logout-btn"
              >
                Log out
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="inline-flex items-center space-x-2 rounded-lg bg-primary-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600"
                data-testid="landing-login-btn"
              >
                <span>Log in to workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:py-16 lg:py-20 md:flex-row md:items-center">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Enterprise-ready visual workflow builder · Demo environment</span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl" data-testid="landing-hero-title">
                Design, run, and monitor workflows
                <span className="block text-primary-300">without wrestling with BPM suites.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm text-slate-300" data-testid="landing-hero-subtitle">
                This demo of LogicCanvas ships with prebuilt analytics, task inbox, approvals, and a
                full execution engine. Use the login button to jump into an admin or builder account
                and explore the workflow OS.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3" data-testid="landing-hero-cta">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center space-x-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600"
                data-testid="landing-get-started-btn"
              >
                <ArrowRight className="h-4 w-4" />
                <span>{currentUser ? 'Enter workspace' : 'Start with demo login'}</span>
              </button>
              <p className="text-[11px] text-slate-400">
                No signup required · 3 demo roles preconfigured
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 sm:grid-cols-3" data-testid="landing-feature-summary">
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <Workflow className="h-4 w-4 text-primary-300" />
                  <span>Canvas</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  Drag-and-drop nodes, decisions, approvals, and action steps on a React Flow canvas.
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <FileText className="h-4 w-4 text-primary-300" />
                  <span>Forms</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  Build rich forms with 19+ field types, validation, and conditional visibility.
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <BarChart3 className="h-4 w-4 text-primary-300" />
                  <span>Analytics</span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  Monitor throughput, SLA performance, bottlenecks, and team productivity in real time.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex-1 md:mt-0">
            <div className="relative mx-auto max-w-md rounded-2xl border border-white/5 bg-slate-950/60 p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                  <span>What you get out-of-the-box</span>
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                  Phase 1–6 complete
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200" data-testid="landing-feature-list">
                <li>• Visual workflow canvas with 9 node types and auto-layout</li>
                <li>• Task inbox, approval queue, SLA checker and auto-escalation</li>
                <li>• Reusable forms with versioning, conditional logic, and renderer</li>
                <li>• Analytics dashboard across workflows, nodes, SLAs, and users</li>
                <li>• In-app notifications, audit trail, triggers, and import/export</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
