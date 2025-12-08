import React, { useState } from 'react';
import { Lock, Mail, LogIn, User, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const DEMO_USERS = [
  { email: 'admin@example.com', password: 'admin123', label: 'Admin', role: 'admin' },
  { email: 'builder@example.com', password: 'builder123', label: 'Builder', role: 'builder' },
  { email: 'approver@example.com', password: 'approver123', label: 'Approver', role: 'approver' },
];

const LoginPage = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append('username', email);
      body.append('password', password);

      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Invalid credentials');
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.access_token, data.user);
      }
    } catch (err) {
      console.error('Login failed', err);
      setError('Unable to reach authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.3))]" style={{ backgroundSize: '30px 30px' }}></div>
      <div className="max-w-md w-full bg-white/5 border-2 border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl shadow-indigo-500/10 relative">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-xs text-indigo-300 hover:text-white flex items-center space-x-1"
          data-testid="login-back-btn"
        >
          <span className="inline-block rotate-180">➜</span>
          <span>Back to landing</span>
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sign in to LogicCanvas</h1>
            <p className="text-xs text-indigo-300 mt-1">Use one of the pre-configured demo accounts to explore.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start space-x-2 rounded-lg border border-gold-400 bg-gold-50/90 px-3 py-2">
            <AlertCircle className="h-4 w-4 text-gold-600 mt-0.5" />
            <p className="text-xs text-gold-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
          <div>
            <label className="block text-xs font-medium text-green-200 mb-1" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-primary-900/60 py-2 pl-10 pr-3 text-sm text-white placeholder:text-green-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="you@example.com"
                autoComplete="username"
                required
                data-testid="login-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-green-200 mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-primary-900/60 py-2 pl-10 pr-3 text-sm text-white placeholder:text-green-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                data-testid="login-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-primary-500/40 transition-all hover:shadow-2xl hover:shadow-primary-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
            data-testid="login-submit-btn"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={async () => {
              setError('');
              try {
                const res = await fetch(`${BACKEND_URL}/api/admin/generate-sample-data`, {
                  method: 'POST',
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setError(data.detail || 'Failed to generate sample data');
                  return;
                }
                // Show detailed summary if available
                const summary = data.summary || {};
                const message = data.message || 'Sample data generated successfully';
                const details = Object.keys(summary).length > 0 
                  ? `\n\nGenerated:\n${Object.entries(summary).map(([k, v]) => `• ${k}: ${v}`).join('\n')}`
                  : '';
                alert(message + details);
              } catch (e) {
                console.error('Sample data generation failed', e);
                setError('Sample data generation failed.');
              }
            }}
            className="mt-3 inline-flex w-full items-center justify-center space-x-2 rounded-lg border border-dashed border-emerald-400 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 transition-all"
            data-testid="generate-sample-data-btn"
          >
            <span>🎲 Generate Sample Data (All Modules)</span>
          </button>
          <p className="mt-2 text-[10px] text-green-400 text-center">
            Creates workflows, forms, tasks, approvals, users, roles, audit logs & more
          </p>

        </form>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-[11px] uppercase tracking-wide text-green-400 mb-2 flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>Quick demo logins</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => quickFill(u)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-green-100 hover:border-primary-400 hover:bg-primary-500/20 flex flex-col items-start"
                data-testid={`demo-login-btn-${u.role}`}
              >
                <span className="font-medium">{u.label}</span>
                <span className="text-[10px] text-green-400">{u.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-green-400">
            Credentials are pre-seeded in the backend for easy evaluation: passwords match the role name (e.g. <code>admin123</code>).
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
