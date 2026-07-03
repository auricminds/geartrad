import { createClient } from '@supabase/supabase-js';
import { StatsBarClient } from './StatsBarClient';

async function fetchStats() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await db.rpc('get_platform_stats');
    if (!data) return { listings: 0, sellers: 0, trades: 0 };

    return {
      listings: data.activeListings   ?? 0,
      sellers:  data.totalUsers       ?? 0,
      trades:   data.successfulTrades ?? 0,
    };
  } catch {
    return { listings: 0, sellers: 0, trades: 0 };
  }
}

export async function StatsBar() {
  const stats = await fetchStats();
  return <StatsBarClient listings={stats.listings} sellers={stats.sellers} trades={stats.trades} />;
}
