'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Shield, Ticket, CheckCircle, Clock, User, AlertTriangle } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { getAllTickets, getAllVerifications, getMyRole, reviewVerification, updateTicketStatus } from '@/lib/api';
import { cn } from '@/lib/utils';

type Ticket = {
  id: string; type: string; title: string; status: string;
  created_at: string; user: { id: string; username: string } | null;
  chat_id: string | null;
};
type Verification = {
  id: string; status: string; submitted_at: string;
  notes: string | null;
  user: { id: string; username: string; avatar_url: string | null } | null;
};

export default function ModPage() {
  const locale = useLocale();
  const { user, authLoading } = useStore();
  const [role, setRole] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [verifs, setVerifs] = useState<Verification[]>([]);
  const [tab, setTab] = useState<'tickets' | 'verifications'>('tickets');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMyRole(user.id).then(setRole);
  }, [user]);

  useEffect(() => {
    if (!role || (role !== 'moderator' && role !== 'admin')) return;
    Promise.all([getAllTickets(), getAllVerifications()]).then(([t, v]) => {
      setTickets(t as Ticket[]);
      setVerifs(v as Verification[]);
    }).finally(() => setLoading(false));
  }, [role]);

  if (authLoading || role === null) return null;
  if (!user || (role !== 'moderator' && role !== 'admin')) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Shield className="w-10 h-10 text-muted/20 mx-auto mb-4" />
        <p className="text-white font-semibold text-lg">Access Denied</p>
        <p className="text-muted text-sm mt-2">This area is for moderators only.</p>
      </div>
    );
  }

  const STATUS_COLOR: Record<string, string> = {
    open: 'bg-amber-500/20 text-amber-300',
    in_progress: 'bg-purple/20 text-purple',
    resolved: 'bg-emerald-500/20 text-emerald-300',
    closed: 'bg-white/10 text-muted',
    pending: 'bg-amber-500/20 text-amber-300',
    approved: 'bg-emerald-500/20 text-emerald-300',
    rejected: 'bg-red-500/20 text-red-300',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Moderator Dashboard</h1>
          <p className="text-muted text-sm">Manage tickets and verifications</p>
        </div>
        <span className={cn(
          'ms-auto px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider',
          role === 'admin' ? 'bg-gold/20 text-gold' : 'bg-purple/20 text-purple'
        )}>
          {role}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open Tickets', value: tickets.filter((t) => t.status === 'open').length, icon: Ticket, color: 'text-amber-400' },
          { label: 'In Progress', value: tickets.filter((t) => t.status === 'in_progress').length, icon: Clock, color: 'text-purple' },
          { label: 'Pending Verifs', value: verifs.filter((v) => v.status === 'pending').length, icon: User, color: 'text-amber-400' },
          { label: 'Total Resolved', value: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length, icon: CheckCircle, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface/50 p-4 flex items-center gap-3">
            <Icon className={cn('w-5 h-5', color)} />
            <div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['tickets', 'verifications'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-purple text-white' : 'bg-surface border border-border text-muted hover:text-white'
            )}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : tab === 'tickets' ? (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="text-center py-16 text-muted text-sm">No tickets yet</div>
          ) : tickets.map((t) => (
            <Link key={t.id} href={`/${locale}/mod/tickets/${t.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface/50 hover:border-purple/30 transition-all">
              <AlertTriangle className="w-5 h-5 text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{t.title}</p>
                <p className="text-muted text-xs mt-0.5">
                  by {t.user?.username ?? 'Unknown'} · {t.type} · {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium shrink-0', STATUS_COLOR[t.status] ?? 'bg-white/10 text-muted')}>
                {t.status.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {verifs.length === 0 ? (
            <div className="text-center py-16 text-muted text-sm">No verifications yet</div>
          ) : verifs.map((v) => (
            <div key={v.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface/50">
              <div className="w-9 h-9 rounded-xl bg-purple/20 flex items-center justify-center text-sm font-bold text-purple shrink-0">
                {v.user?.username?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{v.user?.username ?? 'Unknown'}</p>
                <p className="text-muted text-xs mt-0.5">Submitted {new Date(v.submitted_at).toLocaleDateString()}</p>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium shrink-0', STATUS_COLOR[v.status] ?? 'bg-white/10 text-muted')}>
                {v.status}
              </span>
              {v.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      reviewVerification(v.id, user.id, 'approved').then(() =>
                        setVerifs((prev) => prev.map((x) => x.id === v.id ? { ...x, status: 'approved' } : x))
                      );
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('Rejection reason (optional):');
                      reviewVerification(v.id, user.id, 'rejected', notes ?? undefined).then(() =>
                        setVerifs((prev) => prev.map((x) => x.id === v.id ? { ...x, status: 'rejected' } : x))
                      );
                    }}
                    className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
