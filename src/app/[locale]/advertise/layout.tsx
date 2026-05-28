import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advertise — GearTrad',
  description: 'Promote your gaming products and services to thousands of gamers on GearTrad. Get in touch to discuss advertising opportunities.',
  openGraph: {
    title: 'Advertise on GearTrad',
    description: 'Reach thousands of gamers by advertising on GearTrad.',
    url: 'https://geartrad.com/en/advertise',
  },
};

export default function AdvertiseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
