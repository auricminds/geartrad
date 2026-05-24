'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Shield, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMyRole } from '@/lib/api';
import { cn } from '@/lib/utils';

type Mode = 'sign-in' | 'sign-up';

export default function AdminSignInPage() {
  const router = useRouter();
  const locale = useLocale();

  const [mode,        setMode]        = useState<Mode>('sign-in');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  const reset = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirm('');
  };

  const handleSignUp = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    const res = await fetch('/api/mod/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }

    setSuccess('Account created. You can now sign in.');
    setMode('sign-in');
    setPassword('');
    setConfirm('');
  };

  const handleSignIn = async () => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.user) {
      setError('Invalid email or password.');
      return;
    }

    const role = await getMyRole(data.user.id);
    if (role !== 'moderator' && role !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied. This login is for moderators only.');
      return;
    }

    router.push(`/${locale}/mod`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'sign-up') {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">

          {/* Top stripe */}
          <div className="h-1 bg-gradient-to-r from-purple via-purple-light to-purple" />

          <div className="p-6 sm:p-8">
            {/* Icon + title */}
            <div className="flex flex-col items-center mb-7">
              <div className="w-14 h-14 rounded-2xl bg-purple/20 border border-purple/30 flex items-center justify-center mb-4 shadow-lg shadow-purple/10">
                <Shield className="w-7 h-7 text-purple" />
              </div>
              <h1 className="text-xl font-bold text-white">
                {mode === 'sign-in' ? 'Moderator Sign In' : 'Create Admin Account'}
              </h1>
              <p className="text-muted text-sm mt-1 text-center">
                {mode === 'sign-in' ? 'Authorized personnel only' : 'Whitelisted emails only'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl border border-border bg-white/5 p-1 mb-6">
              {(['sign-in', 'sign-up'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => reset(m)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                    mode === m
                      ? 'bg-purple text-white shadow-md shadow-purple/20'
                      : 'text-muted hover:text-white'
                  )}
                >
                  {m === 'sign-in' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 mb-5 px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-start gap-2.5 mb-5 px-3.5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@email.com"
                    required
                    autoComplete="email"
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:border-purple/50 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'sign-up' ? 'Min. 8 characters' : '••••••••'}
                    required
                    autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                    className="w-full pl-9 pr-10 py-3 rounded-xl bg-white/5 border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:border-purple/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password — sign-up only */}
              {mode === 'sign-up' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      className="w-full pl-9 pr-10 py-3 rounded-xl bg-white/5 border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:border-purple/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold text-sm shadow-lg shadow-purple/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {loading
                  ? (mode === 'sign-up' ? 'Creating account...' : 'Signing in...')
                  : (mode === 'sign-up' ? 'Create Admin Account' : 'Sign In')
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
