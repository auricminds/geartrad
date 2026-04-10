import { getLocale } from 'next-intl/server';
import { Trophy } from 'lucide-react';
import { ListingCard } from '@/components/listing/ListingCard';
import { getListings } from '@/lib/api';

export default async function TopAccountsPage() {
  const locale   = await getLocale();
  const listings = await getListings({ sortBy: 'popular', limit: 24 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple/10 border border-purple/20 text-purple text-xs font-medium mb-4">
          <Trophy className="w-3.5 h-3.5" />
          {locale === 'ar' ? 'مرتبة حسب الإعجابات' : 'Ranked by Community Likes'}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {locale === 'ar' ? 'أفضل الحسابات' : 'Top Gaming Accounts'}
        </h1>
        <p className="text-muted">
          {locale === 'ar' ? 'أعلى الحسابات تقييماً من مجتمعنا' : 'Highest rated accounts by our community'}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-white font-semibold text-lg">
            {locale === 'ar' ? 'لا توجد حسابات بعد' : 'No listings yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, i) => (
            <div key={listing.id} className="relative">
              {i < 3 && (
                <div className="absolute -top-2 -start-2 z-10 w-8 h-8 rounded-full bg-gold flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-gold/30">
                  #{i + 1}
                </div>
              )}
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
