import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Shield, Users, Zap, Globe } from 'lucide-react';

export default function AboutPage() {
  // This is a server component — we read locale from params via layout
  return <AboutContent />;
}

function AboutContent() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-4">About GearTrad</h1>
      <p className="text-muted text-base leading-relaxed mb-10">
        GearTrad is the #1 gaming marketplace built for the MENA region — connecting gamers who want
        to buy and sell gaming accounts, skins, weapons, and more in a safe, fast, and transparent way.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {[
          {
            icon: Shield,
            title: 'Safe Trading',
            desc: 'Every transaction is protected by escrow. Funds are only released after the buyer confirms delivery.',
          },
          {
            icon: Users,
            title: 'Real Community',
            desc: 'Thousands of verified traders across Egypt and MENA. Rated sellers you can trust.',
          },
          {
            icon: Zap,
            title: 'Fast & Easy',
            desc: 'List an item in minutes. Browse thousands of listings with powerful filters.',
          },
          {
            icon: Globe,
            title: 'Built for MENA',
            desc: 'Full Arabic support, local payment methods including Vodafone Cash and InstaPay.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border bg-surface/50 p-5">
            <Icon className="w-6 h-6 text-purple mb-3" />
            <h3 className="text-white font-semibold mb-1">{title}</h3>
            <p className="text-muted text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-3">Our Mission</h2>
      <p className="text-muted text-sm leading-relaxed mb-6">
        We believe gaming items have real value, and every gamer deserves a fair and secure platform
        to trade them. GearTrad was created to eliminate scams, enable trust, and give the MENA gaming
        community a home-grown marketplace they can rely on.
      </p>

      <h2 className="text-xl font-bold text-white mb-3">Built by AuricMinds Group</h2>
      <p className="text-muted text-sm leading-relaxed">
        GearTrad is developed and operated by AuricMinds Group — a team passionate about gaming and
        technology in the Arab world.
      </p>
    </div>
  );
}
