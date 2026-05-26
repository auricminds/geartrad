import { TrendingUp, Users, ShieldCheck } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { StatsBarClient } from './StatsBarClient';

async function fetchStats() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [listingsRes, sellersRes, tradesRes] = await Promise.all([
      db.from('listings').select('*', { count: 'exact', head: true }).eq('is_available', true),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true).in('account_type', ['seller', 'both']),
      db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);

    return {
      listings: listingsRes.count ?? 0,
      sellers: sellersRes.count ?? 0,
      trades: tradesRes.count ?? 0,
    };
  } catch {
    return { listings: 0, sellers: 0, trades: 0 };
  }
}

export async function StatsBar() {
  const stats = await fetchStats();

  const items = [
    { icon: TrendingUp,  value: stats.listings, color: 'text-purple',      bg: 'bg-purple/10',       border: 'border-purple/20',       labelKey: 'listings' },
    { icon: Users,       value: stats.sellers,  color: 'text-gold',        bg: 'bg-gold/10',         border: 'border-gold/20',         labelKey: 'sellers'  },
    { icon: ShieldCheck, value: stats.trades,   color: 'text-emerald-400', bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20',  labelKey: 'trades'   },
  ];

  return <StatsBarClient items={items} />;
}
