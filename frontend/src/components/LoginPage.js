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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-xs text-slate-300 hover:text-white flex items-center space-x-1"
          data-testid="login-back-btn"
        >
          <span className="inline-block rotate-180">➜</span>
          <span>Back to landing</span>
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sign in to LogicCanvas</h1>
            <p className="text-xs text-slate-300 mt-1">Use one of the pre-configured demo accounts to explore.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start space-x-2 rounded-lg border border-red-400 bg-red-50/90 px-3 py-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="you@example.com"
                autoComplete="username"
                required
                data-testid="login-email-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
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
            className="mt-2 inline-flex w-full items-center justify-center space-x-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed"
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
        </form>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-2 flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>Quick demo logins</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => quickFill(u)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-slate-100 hover:border-primary-400 hover:bg-primary-500/20 flex flex-col items-start"
                data-testid={`demo-login-btn-${u.role}`}
              >
                <span className="font-medium">{u.label}</span>
                <span className="text-[10px] text-slate-400">{u.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-400">
            Credentials are pre-seeded in the backend for easy evaluation: passwords match the role name (e.g. <code>admin123</code>).
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
