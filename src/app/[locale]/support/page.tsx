'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { MessageCircle, Plus, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/components/providers/StoreProvider';
import { getMyTickets, createSupportTicket } from '@/lib/api';
import { useRouter } from 'next/navigation';

const inputCls = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all';

type Ticket = { id: string; type: string; title: string; status: string; created_at: string };

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-amber-500/20 text-amber-300',
  in_progress: 'bg-purple/20 text-purple',
  resolved: 'bg-emerald-500/20 text-emerald-300',
  closed: 'bg-white/10 text-muted',
};

export default function SupportPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user, authLoading } = useStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<'general' | 'dispute' | 'scam'>('general');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getMyTickets(user.id).then((data) => setTickets(data as Ticket[])).finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-white font-semibold text-lg mb-4">Sign in to access support</p>
        <Link href={`/${locale}/auth/sign-in`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a title.'); return; }
    setSubmitting(true);
    setError('');
    const id = await createSupportTicket({ user_id: user.id, type, title: title.trim() });
    if (id) {
      router.push(`/${locale}/mod/tickets/${id}`);
    } else {
      setError('Failed to create ticket. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm mb-8">
        <ArrowLeft className="w-4 h-4" />
        Home
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-muted text-sm mt-0.5">Open a ticket and our moderators will help you</p>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-surface/50 p-5 mb-6 space-y-4">
          <h2 className="text-white font-semibold">New Support Ticket</h2>

          <div>
            <label className="text-xs text-muted mb-1.5 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {(['general', 'dispute', 'scam'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-sm font-medium transition-all capitalize',
                    type === t ? 'border-purple bg-purple/10 text-purple' : 'border-border text-muted hover:text-white'
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted mb-1.5 block">Title / Short description</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Seller didn't deliver after payment"
              className={inputCls} maxLength={120} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="px-4 py-2 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-medium disabled:opacity-50 transition-all">
              {submitting ? 'Creating…' : 'Create & Open Ticket'}
            </button>
            <button type="button" onClick={() => setCreating(false)}
              className="px-4 py-2 rounded-xl border border-border text-muted hover:text-white text-sm transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-surface animate-pulse" />)
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-10 h-10 text-muted/20 mx-auto mb-3" />
            <p className="text-muted text-sm">No support tickets yet</p>
          </div>
        ) : tickets.map((t) => (
          <Link key={t.id} href={`/${locale}/mod/tickets/${t.id}`}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface/50 hover:border-purple/30 transition-all">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{t.title}</p>
              <p className="text-muted text-xs mt-0.5">{t.type} · {new Date(t.created_at).toLocaleDateString()}</p>
            </div>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium shrink-0', STATUS_COLOR[t.status] ?? 'bg-white/10 text-muted')}>
              {t.status.replace('_', ' ')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
