import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support — GearTrad',
  description: 'Get help with your orders, disputes, account issues, and anything else. Open a support ticket and our team will respond promptly.',
  openGraph: {
    title: 'Support — GearTrad',
    description: 'Open a support ticket for order issues, disputes, or account help on GearTrad.',
    url: 'https://geartrad.com/en/support',
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
