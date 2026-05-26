import { createClient } from '@supabase/supabase-js';
import { StatsBarClient } from './StatsBarClient';

async function fetchStats() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [listingsRes, usersRes, tradesRes] = await Promise.all([
      db.from('listings').select('*', { count: 'exact', head: true }).eq('is_available', true),
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);

    return {
      listings: listingsRes.count ?? 0,
      sellers: usersRes.count ?? 0,
      trades: tradesRes.count ?? 0,
    };
  } catch {
    return { listings: 0, sellers: 0, trades: 0 };
  }
}

export async function StatsBar() {
  const stats = await fetchStats();
  return <StatsBarClient listings={stats.listings} sellers={stats.sellers} trades={stats.trades} />;
}
