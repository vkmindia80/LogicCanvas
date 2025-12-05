import React from 'react';
import { Activity, Workflow, FileText, BarChart3, CheckSquare, ArrowRight, Shield } from 'lucide-react';

const LandingPage = ({ onGetStarted, currentUser, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Global header - shared look with app shell */}
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
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:py-16 lg:py-20 md:flex-row md:items-center">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="inline-flex items-center justify-center space-x-2 rounded-full border border-emerald-300/70 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Interactive workflow demo · No signup · 3 roles preconfigured</span>
              </div>

              <div>
                <h2
                  className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl"
                  data-testid="landing-hero-title"
                >
                  A modern workspace for approvals,
                  <span className="block text-primary-600">tasks, and internal processes.</span>
                </h2>
                <p
                  className="mt-4 mx-auto max-w-xl text-sm text-slate-600 md:mx-0"
                  data-testid="landing-hero-subtitle"
                >
                  LogicCanvas combines a visual canvas, form builder, task inbox, approval engine, and
                  analytics into one focused UI. This demo ships with realistic data so you can explore each
                  function end‑to‑end.
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
                  Use admin, builder, or approver accounts · Switch roles from inside the app.
                </p>
              </div>
            </div>

            {/* Hero visual – concise summary of modules */}
            <div className="flex-1">
              <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4 text-emerald-500" />
                    <span>What you can explore in this demo</span>
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                    Sample data ready
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-700" data-testid="landing-feature-list">
                  <li>• Visual workflow canvas with start, task, approval, form, and end nodes.</li>
                  <li>• Task inbox and approval queue with reassignment, delegation, and escalation.</li>
                  <li>• Form builder and renderer for collecting structured data in workflows.</li>
                  <li>• SLA checks, notifications, and analytics across workflows and users.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Core capabilities */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 lg:py-16">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Core capabilities</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                Everything you need to map, run, and monitor internal workflows
              </h3>
              <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
                Each module in the product is available in this environment, wired together just like a
                production setup.
              </p>
            </div>

            <div
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
              data-testid="landing-feature-summary"
            >
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Workflow className="h-4 w-4 text-primary-500" />
                  <span>Design workflows</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Use the canvas to connect forms, tasks, approvals, actions, and end states into
                  repeatable flows.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <FileText className="h-4 w-4 text-primary-500" />
                  <span>Collect data</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Build internal forms with validations and conditional fields, then reuse them across
                  multiple workflows.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CheckSquare className="h-4 w-4 text-primary-500" />
                  <span>Drive execution</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Route work through task inboxes and approval queues with assignment strategies,
                  delegation, and escalation.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <BarChart3 className="h-4 w-4 text-primary-500" />
                  <span>Measure performance</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Track throughput, SLAs, and bottlenecks with the analytics dashboard, notifications, and
                  audit logs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Roles & typical flows */}
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 lg:py-16">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Built for your team</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                  See how each role uses the workspace
                </h3>
              </div>
              <p className="text-xs text-slate-600 max-w-md">
                Log in as different demo users to experience the product from the perspective of admins,
                builders, and approvers.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 text-xs text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Admin</p>
                <p className="mt-2">
                  Seeds sample data, manages roles, and inspects audit logs and global analytics to keep
                  everything healthy.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Builder</p>
                <p className="mt-2">
                  Designs workflows, configures forms, and connects triggers to automate internal
                  processes.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Approver & doer</p>
                <p className="mt-2">
                  Works from the task inbox and approval queue, keeping work moving while the system
                  handles routing and SLAs.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
