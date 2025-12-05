import React from 'react';
import { Activity, Workflow, FileText, BarChart3, CheckSquare, ArrowRight, Shield } from 'lucide-react';

const LandingPage = ({ onGetStarted, currentUser, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Global header - aligned with app shell header styling */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3" data-testid="landing-header-brand">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">LogicCanvas</h1>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Visual workflow OS</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser && (
              <div
                className="hidden items-center space-x-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 sm:flex"
                data-testid="landing-current-user-chip"
              >
                <Shield className="h-3.5 w-3.5 text-primary-500" />
                <span className="font-medium">{currentUser.name || currentUser.email}</span>
                <span className="text-slate-400">· {currentUser.role}</span>
              </div>
            )}

            {currentUser ? (
              <button
                onClick={onLogout}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                data-testid="landing-logout-btn"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="inline-flex items-center space-x-2 rounded-lg bg-primary-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600"
                data-testid="landing-login-btn"
              >
                <span>Log in to workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main marketing content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-12 sm:py-16 lg:py-20 md:flex-row md:items-center">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center justify-center space-x-2 rounded-full border border-emerald-300/70 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>End‑to‑end workflow demo · No signup required</span>
              </div>

              <div>
                <h2
                  className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl"
                  data-testid="landing-hero-title"
                >
                  Orchestrate your business workflows
                  <span className="block text-primary-600">without heavyweight BPM software.</span>
                </h2>
                <p
                  className="mt-4 mx-auto max-w-xl text-sm text-slate-600 md:mx-0"
                  data-testid="landing-hero-subtitle"
                >
                  LogicCanvas lets you design, execute, and monitor approval flows, SLAs, and forms on a
                  single visual canvas. This environment ships with demo data, analytics, and task inbox
                  so you can explore everything in minutes.
                </p>
              </div>

              <div
                className="flex flex-col items-center gap-3 sm:flex-row sm:justify-start sm:gap-4"
                data-testid="landing-hero-cta"
              >
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center space-x-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-500/30 hover:bg-primary-700 w-full sm:w-auto"
                  data-testid="landing-get-started-btn"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>{currentUser ? 'Enter workspace' : 'Start with demo login'}</span>
                </button>
                <p className="text-[11px] text-slate-500">
                  Use admin, builder, or approver roles · Switch roles from inside the app.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-3" data-testid="landing-feature-summary">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Workflow className="h-4 w-4 text-primary-500" />
                    <span>Visual Canvas</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Drag-and-drop nodes, define conditions, and connect forms, tasks, and approvals in a
                    single view.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <FileText className="h-4 w-4 text-primary-500" />
                    <span>Form Engine</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Build rich internal forms with validations and conditional visibility—no code changes
                    required.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <BarChart3 className="h-4 w-4 text-primary-500" />
                    <span>Live Analytics</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">
                    Track throughput, bottlenecks, and SLA breaches with an out‑of‑the‑box analytics
                    dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Hero preview card mimicking the in‑app workspace */}
            <div className="flex-1">
              <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4 text-emerald-500" />
                    <span>What this demo includes</span>
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                    Sample data generator
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-700" data-testid="landing-feature-list">
                  <li>• Prebuilt recruiting workflow with forms, tasks, and approvals.</li>
                  <li>• Task inbox, approval queue, SLA checker, and auto‑escalation rules.</li>
                  <li>• In‑app notifications, audit trail, triggers, and import/export support.</li>
                  <li>• Role‑aware experience for admins, builders, approvers, and viewers.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 lg:py-16">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">How the demo works</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">From login to insights in three steps</h3>
              <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
                Explore LogicCanvas from multiple perspectives: design workflows, action tasks, and review
                SLA performance without any setup.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  1
                </div>
                <h4 className="text-sm font-semibold text-slate-900">Pick a demo role & log in</h4>
                <p className="mt-2 text-xs text-slate-600">
                  Use the login page to quickly sign in as an admin, builder, or approver. Credentials are
                  pre‑seeded in the backend.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  2
                </div>
                <h4 className="text-sm font-semibold text-slate-900">Design and run workflows</h4>
                <p className="mt-2 text-xs text-slate-600">
                  Use the canvas to edit the sample workflow or create your own. Attach forms, tasks, and
                  approvals, then execute it.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  3
                </div>
                <h4 className="text-sm font-semibold text-slate-900">Monitor tasks & SLAs</h4>
                <p className="mt-2 text-xs text-slate-600">
                  Action items from the task inbox and approval queue, then inspect analytics to see how
                  work moves through the system.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Simple footer to complete the layout */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-center text-[11px] text-slate-500 sm:flex-row">
          <p data-testid="landing-footer-text">LogicCanvas demo · Built with React, FastAPI, and MongoDB.</p>
          <p>Use the sample data generator on the login page to instantly populate realistic workflows.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
