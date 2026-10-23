import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-[#F6FBF7] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-wellness-100 dark:bg-emerald-950/80 border border-wellness-200 dark:border-emerald-800 text-3xl shadow-soft mb-3">
          🌿
        </div>
        <h2 className="text-3xl font-extrabold text-wellness-900 dark:text-emerald-400 tracking-tight font-sans">
          WELLWITH
        </h2>
        <p className="mt-1 text-xs uppercase tracking-widest font-bold text-wellness-700 dark:text-emerald-500/90">
          Wellness Brand Lead Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-soft-lg rounded-3xl border border-wellness-border dark:border-slate-800">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@wellwith.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-wellness-600 hover:bg-wellness-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wellness-500 transition-all shadow-soft"
            >
              {isLoading ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <>
                  Sign In to CRM <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Login Pills */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick 1-Click Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@wellwith.com')}
                className="p-2.5 rounded-xl border border-wellness-200 dark:border-emerald-800 bg-wellness-50/70 dark:bg-emerald-950/40 hover:bg-wellness-100 text-left transition-colors"
              >
                <div className="font-bold text-wellness-900 dark:text-emerald-300 flex items-center gap-1">
                  <Shield size={12} className="text-wellness-600" /> Super Admin
                </div>
                <div className="text-[10px] text-slate-500">admin@wellwith.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sai@wellwith.com')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-left transition-colors"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Sai (Telecaller)
                </div>
                <div className="text-[10px] text-slate-500">sai@wellwith.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('shashi@wellwith.com')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-left transition-colors"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Shashi (Telecaller)
                </div>
                <div className="text-[10px] text-slate-500">shashi@wellwith.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('client@demo.com')}
                className="p-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/40 hover:bg-teal-100 text-left transition-colors"
              >
                <div className="font-bold text-teal-900 dark:text-teal-300">
                  Client Admin
                </div>
                <div className="text-[10px] text-slate-500">client@demo.com</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              Default password: <span className="font-semibold text-slate-600 dark:text-slate-300">Password123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
