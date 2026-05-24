'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  Shield, Ticket, CheckCircle, Clock, AlertTriangle, Package,
  Users, List, Ban, ExternalLink, Trash2, RefreshCw, XCircle,
  Search, ChevronDown, CheckCheck, Timer, Eye,
} from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import {
  getAllTickets, getAllVerifications, reviewVerification,
  updateTicketStatus, getAllOrders, getAllUsers, getAllListingsAdmin,
  setUserRole, setBanStatus, setUserTimeout, cancelOrderAsMod, deleteListingAsMod,
} from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type Tab = 'orders' | 'users' | 'listings' | 'verifications' | 'tickets';

type OrderRow = {
  id: string; status: string; payment_status: string; total: number;
  created_at: string;
  listing: { id: string; title: string; game: string; cover_image: string } | null;
  buyer: { id: string; username: string } | null;
  seller: { id: string; username: string } | null;
};
type UserRow = {
  id: string; username: string; account_type: string; role: string;
  rating: number; total_sales: number; is_verified: boolean; created_at: string;
  is_banned: boolean; banned_until: string | null;
};
type ListingRow = {
  id: string; title: string; game: string; price: number; is_available: boolean;
  created_at: string; type: string;
  seller: { id: string; username: string } | null;
};
type TicketRow = {
  id: string; type: string; title: string; status: string;
  created_at: string; user: { id: string; username: string } | null;
  chat_id: string | null;
};
type VerifRow = {
  id: string; status: string; submitted_at: string; notes: string | null;
  user: { id: string; username: string; avatar_url: string | null } | null;
};

const S: Record<string, string> = {
  open:            'bg-amber-500/15 text-amber-300 border-amber-500/20',
  in_progress:     'bg-purple/15 text-purple border-purple/20',
  resolved:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  closed:          'bg-white/10 text-muted border-white/10',
  pending:         'bg-amber-500/15 text-amber-300 border-amber-500/20',
  proof_submitted: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  paid:            'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  completed:       'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  disputed:        'bg-red-500/15 text-red-300 border-red-500/20',
  refunded:        'bg-orange-500/15 text-orange-300 border-orange-500/20',
  cancelled:       'bg-white/10 text-muted border-white/10',
  failed:          'bg-red-500/15 text-red-300 border-red-500/20',
  approved:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  rejected:        'bg-red-500/15 text-red-300 border-red-500/20',
};

function Badge({ status }: { status: string }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', S[status] ?? 'bg-white/10 text-muted border-white/10')}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function ModPage() {
  const locale = useLocale();
  const { user, userRole, authLoading } = useStore();
  const [tab, setTab]       = useState<Tab>('orders');
  const [loading, setLoading] = useState(true);

  const [orders,    setOrders]    = useState<OrderRow[]>([]);
  const [users,     setUsers]     = useState<UserRow[]>([]);
  const [emailMap,  setEmailMap]  = useState<Record<string, string>>({});
  const [listings,  setListings]  = useState<ListingRow[]>([]);
  const [tickets,   setTickets]   = useState<TicketRow[]>([]);
  const [verifs,    setVerifs]    = useState<VerifRow[]>([]);

  // Filters / search
  const [orderFilter,   setOrderFilter]   = useState('all');
  const [userSearch,    setUserSearch]    = useState('');
  const [userFilter,    setUserFilter]    = useState('all');
  const [listingSearch, setListingSearch] = useState('');
  const [listingFilter, setListingFilter] = useState('all');
  const [ticketFilter,  setTicketFilter]  = useState('all');

  // Expanded user cards (mobile)
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const isMod = userRole === 'moderator' || userRole === 'admin';

  useEffect(() => {
    if (!isMod) return;
    Promise.all([
      getAllOrders(),
      getAllUsers(),
      getAllListingsAdmin(),
      getAllTickets(),
      getAllVerifications(),
      fetch('/api/mod/users').then((r) => r.json()).catch(() => ({})),
    ]).then(([o, u, l, t, v, emails]) => {
      setOrders(o as OrderRow[]);
      setUsers(u as UserRow[]);
      setListings(l as ListingRow[]);
      setTickets(t as TicketRow[]);
      setVerifs(v as VerifRow[]);
      setEmailMap(emails as Record<string, string>);
    }).finally(() => setLoading(false));
  }, [isMod]);

  const filteredOrders = useMemo(() => orders.filter((o) => {
    if (orderFilter === 'disputed')        return o.status === 'disputed';
    if (orderFilter === 'proof_submitted') return o.payment_status === 'proof_submitted';
    if (orderFilter === 'pending')         return o.status === 'pending';
    if (orderFilter === 'completed')       return o.status === 'completed';
    if (orderFilter === 'cancelled')       return o.status === 'cancelled';
    return true;
  }), [orders, orderFilter]);

  const filteredUsers = useMemo(() => users.filter((u) => {
    const matchSearch = !userSearch || u.username.toLowerCase().includes(userSearch.toLowerCase());
    const matchFilter =
      userFilter === 'sellers' ? u.account_type === 'seller' :
      userFilter === 'buyers'  ? u.account_type === 'buyer'  :
      userFilter === 'banned'  ? u.is_banned :
      userFilter === 'mods'    ? (u.role === 'moderator' || u.role === 'admin') :
      true;
    return matchSearch && matchFilter;
  }), [users, userSearch, userFilter]);

  const filteredListings = useMemo(() => listings.filter((l) => {
    const matchSearch = !listingSearch ||
      l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
      l.game.toLowerCase().includes(listingSearch.toLowerCase()) ||
      (l.seller?.username ?? '').toLowerCase().includes(listingSearch.toLowerCase());
    const matchFilter =
      listingFilter === 'active'   ? l.is_available :
      listingFilter === 'inactive' ? !l.is_available :
      true;
    return matchSearch && matchFilter;
  }), [listings, listingSearch, listingFilter]);

  const filteredTickets = useMemo(() => tickets.filter((t) => {
    if (ticketFilter === 'open')        return t.status === 'open';
    if (ticketFilter === 'in_progress') return t.status === 'in_progress';
    if (ticketFilter === 'resolved')    return t.status === 'resolved' || t.status === 'closed';
    return true;
  }), [tickets, ticketFilter]);

  if (authLoading) return null;
  if (!user || !isMod) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="w-10 h-10 text-muted/20 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg mb-2">Access Denied</p>
          <p className="text-muted text-sm mb-6">This area is for moderators only.</p>
          <Link
            href={`/${locale}/mod/sign-in`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-semibold transition-all shadow-lg shadow-purple/25"
          >
            <Shield className="w-4 h-4" />
            Moderator Sign In
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'orders',        label: 'Deals',         icon: Package,    badge: orders.filter((o) => o.status === 'disputed' || o.payment_status === 'proof_submitted').length || undefined },
    { id: 'users',         label: 'Users',          icon: Users },
    { id: 'listings',      label: 'Listings',       icon: List },
    { id: 'verifications', label: 'Verifications',  icon: CheckCheck, badge: verifs.filter((v) => v.status === 'pending').length || undefined },
    { id: 'tickets',       label: 'Tickets',        icon: Ticket,     badge: tickets.filter((t) => t.status === 'open').length || undefined },
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple/20 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-white">Moderator Panel</h1>
          <p className="text-muted text-xs sm:text-sm hidden sm:block">Platform oversight and control</p>
        </div>
        <span className={cn(
          'ms-auto px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0',
          userRole === 'admin' ? 'bg-gold/20 text-gold' : 'bg-purple/20 text-purple'
        )}>
          {userRole}
        </span>
      </div>

      {/* Tabs — horizontal scroll on mobile */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
        {TABS.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0',
              tab === id ? 'bg-purple text-white shadow-lg shadow-purple/20' : 'bg-surface border border-border text-muted hover:text-white'
            )}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {label}
            {badge ? (
              <span className="min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <>

          {/* ── DEALS / ORDERS ─────────────────────────────────────── */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'disputed', label: 'Disputed' },
                  { id: 'proof_submitted', label: 'Awaiting Review' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'cancelled', label: 'Cancelled' },
                ].map(({ id, label }) => (
                  <button key={id} onClick={() => setOrderFilter(id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0',
                      orderFilter === id ? 'bg-purple text-white' : 'bg-surface border border-border text-muted hover:text-white'
                    )}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-muted text-xs">{filteredOrders.length} deals</p>

              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16 text-muted text-sm">No deals found</div>
                ) : filteredOrders.map((order) => (
                  <div key={order.id} className={cn(
                    'rounded-2xl border bg-surface/50 overflow-hidden',
                    order.status === 'disputed'                     ? 'border-red-500/40'  :
                    order.payment_status === 'proof_submitted'      ? 'border-blue-500/40' :
                    'border-border'
                  )}>
                    <div className="p-3 sm:p-4">
                      <div className="flex gap-3">
                        {order.listing?.cover_image && (
                          <img src={order.listing.cover_image} alt="" className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{order.listing?.title ?? '—'}</p>
                          <p className="text-muted text-xs">{order.listing?.game}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            <span className="text-xs text-muted">Buyer: <span className="text-white/80">{order.buyer?.username ?? '—'}</span></span>
                            <span className="text-xs text-muted">Seller: <span className="text-white/80">{order.seller?.username ?? '—'}</span></span>
                            <span className="text-xs text-muted">{formatPrice(order.total, locale)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge status={order.status} />
                          <Badge status={order.payment_status} />
                          <span className="text-[10px] text-muted">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                          <button
                            onClick={async () => {
                              if (!confirm('Cancel this trade and re-list the item?')) return;
                              await cancelOrderAsMod(order.id, order.listing?.id ?? '');
                              setOrders((prev) => prev.map((o) => o.id === order.id
                                ? { ...o, status: 'cancelled', payment_status: 'cancelled' } : o));
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/25 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            Cancel Trade
                          </button>

                          {order.status === 'disputed' && (
                            <>
                              <button
                                onClick={async () => {
                                  if (!confirm('Mark as completed — releases to seller?')) return;
                                  await supabase.from('orders').update({ status: 'completed', payment_status: 'paid' }).eq('id', order.id);
                                  setOrders((prev) => prev.map((o) => o.id === order.id
                                    ? { ...o, status: 'completed', payment_status: 'paid' } : o));
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                Resolve → Complete
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('Mark as refunded?')) return;
                                  await supabase.from('orders').update({ status: 'refunded', payment_status: 'refunded' }).eq('id', order.id);
                                  setOrders((prev) => prev.map((o) => o.id === order.id
                                    ? { ...o, status: 'refunded', payment_status: 'refunded' } : o));
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/20 text-orange-300 text-xs font-medium hover:bg-orange-500/25 transition-all"
                              >
                                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                Resolve → Refund
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS ────────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4">
              {/* Search + filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by username..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-purple/50"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                  {['all', 'sellers', 'buyers', 'mods', 'banned'].map((f) => (
                    <button key={f} onClick={() => setUserFilter(f)}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0',
                        userFilter === f ? 'bg-purple text-white' : 'bg-surface border border-border text-muted hover:text-white'
                      )}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-muted text-xs">{filteredUsers.length} users</p>

              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-16 text-muted text-sm">No users found</div>
                ) : filteredUsers.map((u) => (
                  <div key={u.id} className={cn(
                    'rounded-2xl border bg-surface/50 overflow-hidden transition-all',
                    u.is_banned ? 'border-red-500/30' : 'border-border'
                  )}>
                    {/* User row — always visible */}
                    <button
                      type="button"
                      onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                      className="w-full flex items-center gap-3 p-3 sm:p-4 text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple/20 flex items-center justify-center text-sm font-bold text-purple shrink-0">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-white text-sm font-medium">{u.username}</span>
                          {u.is_verified && <span className="text-[10px] text-emerald-400 font-medium">✓</span>}
                          {u.is_banned && (
                            <span className="text-[10px] text-red-400 font-medium border border-red-500/30 px-1.5 py-0.5 rounded-full">
                              {u.banned_until ? `timeout until ${new Date(u.banned_until).toLocaleDateString()}` : 'banned'}
                            </span>
                          )}
                        </div>
                        <p className="text-muted text-xs mt-0.5">
                          {u.account_type} · {u.role} · {u.total_sales} sales · ★{u.rating.toFixed(1)}
                        </p>
                      </div>
                      <ChevronDown className={cn(
                        'w-4 h-4 text-muted shrink-0 transition-transform',
                        expandedUser === u.id ? 'rotate-180' : ''
                      )} />
                    </button>

                    {/* Expanded — account info + actions */}
                    {expandedUser === u.id && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-border/50 pt-3 space-y-3">
                        {/* Account info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: 'Email',        value: emailMap[u.id] || '—' },
                            { label: 'Account Type', value: u.account_type },
                            { label: 'Role',         value: u.role },
                            { label: 'Total Sales',  value: u.total_sales },
                            { label: 'Rating',       value: `★ ${u.rating.toFixed(1)}` },
                            { label: 'Verified',     value: u.is_verified ? 'Yes' : 'No' },
                            { label: 'Joined',       value: new Date(u.created_at).toLocaleDateString() },
                          ].map(({ label, value }) => (
                            <div key={label} className={cn(
                              'bg-white/5 rounded-xl p-2.5',
                              label === 'Email' ? 'col-span-2 sm:col-span-4' : ''
                            )}>
                              <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
                              <p className="text-xs text-white font-medium mt-0.5 break-all">{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {/* Role change — admin only */}
                          {userRole === 'admin' && (
                            <div className="relative">
                              <select
                                defaultValue={u.role}
                                onChange={async (e) => {
                                  const r = e.target.value as 'user' | 'moderator' | 'admin';
                                  await setUserRole(u.id, r);
                                  setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: r } : x));
                                }}
                                className="appearance-none pl-3 pr-7 py-2 rounded-lg bg-white/5 border border-border text-white text-xs font-medium cursor-pointer focus:outline-none focus:border-purple/50"
                              >
                                <option value="user">user</option>
                                <option value="moderator">moderator</option>
                                <option value="admin">admin</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
                            </div>
                          )}

                          {/* Timeout */}
                          {!u.is_banned && (
                            <div className="relative group">
                              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/25 transition-all">
                                <Timer className="w-3.5 h-3.5" />
                                Timeout
                              </button>
                              <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:flex group-focus-within:flex flex-col min-w-[130px] bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
                                {[
                                  { label: '1 hour',  hours: 1 },
                                  { label: '24 hours', hours: 24 },
                                  { label: '3 days',  hours: 72 },
                                  { label: '7 days',  hours: 168 },
                                ].map(({ label, hours }) => (
                                  <button key={hours}
                                    onClick={async () => {
                                      await setUserTimeout(u.id, hours);
                                      const bannedUntil = new Date(Date.now() + hours * 3600000).toISOString();
                                      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_banned: true, banned_until: bannedUntil } : x));
                                    }}
                                    className="px-3 py-2 text-xs text-left text-muted hover:text-white hover:bg-white/5 transition-all">
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ban / Unban */}
                          <button
                            onClick={async () => {
                              const action = u.is_banned ? 'Unban' : 'Ban';
                              if (!confirm(`${action} ${u.username}?`)) return;
                              await setBanStatus(u.id, !u.is_banned);
                              setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_banned: !u.is_banned, banned_until: null } : x));
                            }}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                              u.is_banned
                                ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/25'
                                : 'bg-red-500/15 border-red-500/20 text-red-300 hover:bg-red-500/25'
                            )}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {u.is_banned ? 'Unban' : 'Ban'}
                          </button>

                          {/* View orders */}
                          <button
                            onClick={() => { setTab('orders'); setOrderFilter('all'); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-border text-muted text-xs font-medium hover:text-white transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Deals
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LISTINGS ─────────────────────────────────────────────── */}
          {tab === 'listings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    placeholder="Search by title, game or seller..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-white placeholder:text-muted focus:outline-none focus:border-purple/50"
                  />
                </div>
                <div className="flex gap-1.5">
                  {['all', 'active', 'inactive'].map((f) => (
                    <button key={f} onClick={() => setListingFilter(f)}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize whitespace-nowrap',
                        listingFilter === f ? 'bg-purple text-white' : 'bg-surface border border-border text-muted hover:text-white'
                      )}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-muted text-xs">{filteredListings.length} listings</p>

              <div className="space-y-2">
                {filteredListings.length === 0 ? (
                  <div className="text-center py-16 text-muted text-sm">No listings found</div>
                ) : filteredListings.map((listing) => (
                  <div key={listing.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl border border-border bg-surface/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{listing.title}</p>
                      <p className="text-muted text-xs mt-0.5">
                        {listing.game} · {listing.type} · {formatPrice(listing.price, locale)} · <span className="text-white/60">{listing.seller?.username ?? '—'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge status={listing.is_available ? 'approved' : 'cancelled'} />
                      <Link href={`/${locale}/listing/${listing.id}`} target="_blank"
                        className="p-1.5 rounded-lg bg-white/5 border border-border text-muted hover:text-white transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      {listing.is_available && (
                        <button
                          onClick={async () => {
                            if (!confirm('Take down this listing?')) return;
                            await deleteListingAsMod(listing.id);
                            setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, is_available: false } : l));
                          }}
                          className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-300 hover:bg-red-500/25 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── VERIFICATIONS ────────────────────────────────────────── */}
          {tab === 'verifications' && (
            <div className="space-y-3">
              {verifs.length === 0 ? (
                <div className="text-center py-16 text-muted text-sm">No verifications yet</div>
              ) : verifs.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl border border-border bg-surface/50">
                  <div className="w-9 h-9 rounded-xl bg-purple/20 flex items-center justify-center text-sm font-bold text-purple shrink-0">
                    {v.user?.username?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{v.user?.username ?? 'Unknown'}</p>
                    <p className="text-muted text-xs mt-0.5">Submitted {new Date(v.submitted_at).toLocaleDateString()}</p>
                    {v.notes && <p className="text-xs text-amber-300 mt-0.5">{v.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge status={v.status} />
                    {v.status === 'pending' && (
                      <>
                        <button
                          onClick={() => reviewVerification(v.id, user.id, 'approved').then(() =>
                            setVerifs((prev) => prev.map((x) => x.id === v.id ? { ...x, status: 'approved' } : x))
                          )}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition-all"
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
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/25 transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TICKETS ──────────────────────────────────────────────── */}
          {tab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {['all', 'open', 'in_progress', 'resolved'].map((f) => (
                  <button key={f} onClick={() => setTicketFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 capitalize',
                      ticketFilter === f ? 'bg-purple text-white' : 'bg-surface border border-border text-muted hover:text-white'
                    )}>
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <p className="text-muted text-xs">{filteredTickets.length} tickets</p>

              <div className="space-y-2">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-16 text-muted text-sm">No tickets found</div>
                ) : filteredTickets.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 p-3 sm:p-4 rounded-2xl border border-border bg-surface/50">
                    <AlertTriangle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/${locale}/mod/tickets/${t.id}`}
                        className="text-white text-sm font-medium hover:text-purple transition-colors line-clamp-1">
                        {t.title}
                      </Link>
                      <p className="text-muted text-xs mt-0.5">
                        {t.user?.username ?? 'Unknown'} · {t.type} · {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge status={t.status} />
                      {t.status !== 'resolved' && t.status !== 'closed' && (
                        <div className="relative group">
                          <button className="p-1.5 rounded-lg bg-white/5 border border-border text-muted hover:text-white transition-all">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover:flex group-focus-within:flex flex-col min-w-[140px] bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
                            {(['in_progress', 'resolved', 'closed'] as const).map((s) => (
                              <button key={s} onClick={() => {
                                updateTicketStatus(t.id, s).then(() =>
                                  setTickets((prev) => prev.map((x) => x.id === t.id ? { ...x, status: s } : x))
                                );
                              }}
                                className="px-3 py-2 text-xs text-left text-muted hover:text-white hover:bg-white/5 transition-all capitalize">
                                → {s.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <Link href={`/${locale}/mod/tickets/${t.id}`}
                        className="p-1.5 rounded-lg bg-white/5 border border-border text-muted hover:text-white transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
