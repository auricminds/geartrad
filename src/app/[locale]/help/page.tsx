import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { MessageCircle, ShoppingBag, Shield, User, CreditCard, AlertTriangle } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I buy a listing?',
    a: 'Browse listings, click on one you like, then click "Buy Now" or "Add to Cart". Follow the checkout steps and complete payment. The seller will then transfer the account/item to you.',
  },
  {
    q: 'How does escrow work?',
    a: 'When you pay, GearTrad holds the funds. After the seller delivers the item and you confirm receipt, the funds are released to the seller. This protects both parties.',
  },
  {
    q: 'How do I sell on GearTrad?',
    a: 'Create a Seller account, go to "Start Selling", fill in your listing details and price, then publish. Buyers can find and purchase your listing.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept Credit/Debit cards, Vodafone Cash, InstaPay, Bitcoin (BTC), USDT (TRC20), and Ethereum (ETH).',
  },
  {
    q: 'How do I get verified?',
    a: 'Go to your Profile page and click "Get Verified". You\'ll need to upload a photo of your government ID and a selfie holding it. Moderators review within 24–48 hours.',
  },
  {
    q: 'What if I get scammed?',
    a: 'Open a support ticket immediately. GearTrad holds funds in escrow so buyers are protected before confirming delivery. Never confirm delivery until you have the item.',
  },
  {
    q: 'Can I cancel a transaction?',
    a: 'Transactions can be disputed before the buyer confirms delivery. Once confirmed, the sale is final. Contact support if you have an issue.',
  },
  {
    q: 'How do I contact a moderator?',
    a: 'In any active chat, you can click the "Ping Moderator" button to request moderator assistance. You can also open a Support Ticket from the Help Center.',
  },
];

export default async function HelpPage() {
  const locale = await getLocale();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Help Center</h1>
      <p className="text-muted text-sm mb-10">Find answers to common questions below.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: ShoppingBag, label: 'Buying' },
          { icon: User, label: 'Selling' },
          { icon: CreditCard, label: 'Payments' },
          { icon: Shield, label: 'Safety' },
          { icon: MessageCircle, label: 'Chat & Support' },
          { icon: AlertTriangle, label: 'Disputes' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-surface/50 hover:border-purple/40 transition-all cursor-default">
            <Icon className="w-5 h-5 text-purple" />
            <span className="text-sm text-white font-medium">{label}</span>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
      <div className="space-y-5">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="rounded-2xl border border-border bg-surface/30 p-5">
            <h3 className="text-white font-semibold mb-2">{q}</h3>
            <p className="text-muted text-sm leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-purple/30 bg-purple/5 p-6 text-center">
        <p className="text-white font-semibold mb-2">Still need help?</p>
        <p className="text-muted text-sm mb-4">Open a support ticket and our team will get back to you.</p>
        <Link
          href={`/${locale}/support`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-medium transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          Open Support Ticket
        </Link>
      </div>
    </div>
  );
}
