import { Shield, AlertTriangle, CheckCircle, XCircle, Lock } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Safety Tips</h1>
      <p className="text-muted text-sm mb-10">
        Trading gaming items is safe when you follow the right steps. Here's how to protect yourself.
      </p>

      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Always Use GearTrad's Escrow</h2>
        </div>
        <p className="text-muted text-sm leading-relaxed">
          Never pay or transfer items outside of GearTrad. Our escrow system holds your money until
          you confirm safe delivery. Trading outside the platform removes all protections.
        </p>
      </div>

      <h2 className="text-xl font-bold text-white mb-5">Buyer Safety Checklist</h2>
      <div className="space-y-3 mb-10">
        {[
          { ok: true,  text: 'Check the seller\'s rating and number of completed sales.' },
          { ok: true,  text: 'Look for the verified badge (✓) on the seller\'s profile.' },
          { ok: true,  text: 'Read the listing description carefully before purchasing.' },
          { ok: true,  text: 'Chat with the seller and ask questions before buying.' },
          { ok: true,  text: 'Only confirm delivery AFTER you have successfully received the item.' },
          { ok: false, text: 'Do NOT pay via bank transfer, WhatsApp, or any method outside GearTrad.' },
          { ok: false, text: 'Do NOT confirm delivery before testing the account/item.' },
          { ok: false, text: 'Do NOT share your personal financial information in chat.' },
        ].map(({ ok, text }) => (
          <div key={text} className="flex items-start gap-3">
            {ok
              ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            }
            <p className="text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-white mb-5">Seller Safety Checklist</h2>
      <div className="space-y-3 mb-10">
        {[
          { ok: true,  text: 'Only transfer the item after GearTrad confirms payment received.' },
          { ok: true,  text: 'Be honest in your listing description — accurate listings build trust.' },
          { ok: true,  text: 'Get verified to increase buyer confidence.' },
          { ok: false, text: 'Do NOT ask buyers to pay outside the platform.' },
          { ok: false, text: 'Do NOT transfer items before payment is confirmed by GearTrad.' },
        ].map(({ ok, text }) => (
          <div key={text} className="flex items-start gap-3">
            {ok
              ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            }
            <p className="text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-white font-semibold">Spot a Scammer?</h3>
        </div>
        <p className="text-muted text-sm leading-relaxed">
          If someone asks you to trade outside the platform, threatens you, or behaves suspiciously —
          report them immediately. Use the "Ping Moderator" button in chat or open a Support Ticket.
          We take all reports seriously.
        </p>
      </div>
    </div>
  );
}
