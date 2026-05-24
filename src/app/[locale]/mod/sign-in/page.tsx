'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getMyRole } from '@/lib/api';

export default function AdminSignInPage() {
  const router = useRouter();
  const locale = useLocale();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError || !data.user) {
        setError('Invalid email or password.');
        return;
      }

      // Check role — must be moderator or admin
      const role = await getMyRole(data.user.id);
      if (role !== 'moderator' && role !== 'admin') {
        await supabase.auth.signOut();
        setError('Access denied. This login is for moderators only.');
        return;
      }

      router.push(`/${locale}/mod`);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl">

          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-purple/20 border border-purple/30 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-purple" />
            </div>
            <h1 className="text-xl font-bold text-white">Moderator Access</h1>
            <p className="text-muted text-sm mt-1">Authorized personnel only</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:border-purple/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-border text-white text-sm placeholder:text-muted focus:outline-none focus:border-purple/50 transition-colors"
                />
              </div>
            </div>

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
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
