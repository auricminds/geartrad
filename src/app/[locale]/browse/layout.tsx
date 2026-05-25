import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Gaming Listings',
  description: 'Browse thousands of gaming accounts, skins, weapons and bundles. Filter by game, type, price and rank. Valorant, Fortnite, CS2, League of Legends, PUBG and more.',
  openGraph: {
    title: 'Browse Gaming Listings — GearTrad',
    description: 'Find the best gaming accounts and items at the best prices. Verified sellers, escrow protection.',
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
