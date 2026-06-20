import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy & Sell Gaming Accounts — Browse All Listings',
  description: 'Browse thousands of gaming accounts, skins, weapons and bundles for sale. Buy Valorant, Fortnite, CS2, FIFA, PUBG, League of Legends accounts. Verified sellers, escrow protection, instant delivery across Egypt, Saudi Arabia, UAE and MENA.',
  keywords: [
    'buy gaming accounts', 'sell gaming accounts', 'gaming accounts for sale', 'game accounts marketplace',
    'Valorant account for sale', 'buy Valorant account', 'Fortnite account for sale', 'CS2 account for sale',
    'FIFA account for sale', 'PUBG account for sale', 'League of Legends account', 'Call of Duty account',
    'gaming skins for sale', 'buy game skins', 'gaming bundles', 'in-game items',
    'gaming accounts Egypt', 'gaming accounts Saudi Arabia', 'gaming accounts UAE', 'gaming accounts MENA',
    'شراء حسابات العاب', 'بيع حسابات فالورانت', 'حسابات فورتنايت للبيع',
  ],
  openGraph: {
    title: 'Buy & Sell Gaming Accounts — Browse All Listings | GearTrad',
    description: 'Find the best gaming accounts, skins and items at the best prices. Verified sellers, escrow protection, no fees. Egypt, Saudi Arabia, UAE and all MENA.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy & Sell Gaming Accounts | GearTrad',
    description: 'Browse Valorant, Fortnite, CS2, FIFA accounts and more. Escrow protection. No fees.',
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
