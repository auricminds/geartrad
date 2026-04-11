import { Briefcase, MapPin, Globe } from 'lucide-react';

export default function CareersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-4">Careers at GearTrad</h1>
      <p className="text-muted text-base leading-relaxed mb-10">
        We're building the future of gaming commerce in the Arab world. Join a passionate, fast-moving
        team that loves games as much as you do.
      </p>

      <div className="flex flex-wrap gap-4 mb-12">
        {[
          { icon: Globe, label: 'Remote-First' },
          { icon: MapPin, label: 'Egypt & MENA' },
          { icon: Briefcase, label: 'Startup Culture' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-surface/50 text-sm text-muted">
            <Icon className="w-4 h-4 text-purple" />
            {label}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface/30 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple/20 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-7 h-7 text-purple" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">No Open Roles Right Now</h2>
        <p className="text-muted text-sm max-w-sm mx-auto mb-6">
          We don't have any open positions at the moment, but we're always looking for talented people.
          Send us your CV and we'll keep you in mind for future opportunities.
        </p>
        <a
          href="mailto:careers@geartrad.com"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-medium transition-all"
        >
          Send Your CV
        </a>
      </div>
    </div>
  );
}
