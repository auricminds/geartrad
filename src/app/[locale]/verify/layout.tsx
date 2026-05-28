import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get Verified — GearTrad',
  description: 'Become a verified seller on GearTrad. Submit your documents, build trust with buyers, and unlock higher selling limits.',
  openGraph: {
    title: 'Get Verified — GearTrad',
    description: 'Verify your seller account on GearTrad to build trust and unlock higher limits.',
    url: 'https://geartrad.com/en/verify',
  },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
