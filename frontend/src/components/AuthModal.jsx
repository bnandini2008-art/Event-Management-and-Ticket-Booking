import React, { useState } from 'react';
import { X, User, Lock, Mail, Shield, CheckCircle2 } from 'lucide-react';

export function AuthModal({ onClose, onLoginSuccess, onQuickRoleSwitch }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          username,
          password,
          email,
          name
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl glass-card border border-purple-500/40 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">
              {mode === 'login' ? 'Sign In to Eventix' : 'Create an Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Role Tester Pills */}
        <div className="mt-4 p-3 bg-purple-950/40 rounded-2xl border border-purple-900/40">
          <p className="text-[11px] font-semibold text-purple-200 mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Instant Role Simulation (1-Click Test):</span>
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => { onQuickRoleSwitch('guest'); onClose(); }}
              className="py-1.5 px-2 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 text-[11px] font-medium text-purple-200"
            >
              Guest
            </button>
            <button
              type="button"
              onClick={() => { onQuickRoleSwitch('user'); onClose(); }}
              className="py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-[11px] font-bold text-white shadow"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={() => { onQuickRoleSwitch('admin'); onClose(); }}
              className="py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-[11px] font-bold text-white shadow"
            >
              Admin Staff
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-2.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] text-purple-200 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] text-purple-200 block mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[11px] text-purple-200 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] text-purple-200 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-purple-900/30 text-center text-xs text-purple-300">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-purple-400 hover:text-white font-semibold underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-purple-400 hover:text-white font-semibold underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
