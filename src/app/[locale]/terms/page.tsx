export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-muted text-sm mb-1">Last updated: April 2026</p>
      <p className="text-muted text-sm mb-10">
        By using GearTrad you agree to these terms. Read them carefully — they are a binding legal agreement.
      </p>

      {[
        {
          title: '1. Acceptance of Terms',
          body: 'By accessing, registering on, or using GearTrad ("Platform", "we", "us"), you confirm that you have read, understood, and agree to be legally bound by these Terms of Service and our Privacy Policy. If you do not agree, you must immediately stop using the Platform.',
        },
        {
          title: '2. Eligibility',
          body: 'You must be at least 13 years old to use GearTrad. Users under 18 must have parental or guardian consent. By registering, you represent and warrant that you meet this requirement and that all information you provide is accurate and complete.',
        },
        {
          title: '3. Account Security',
          body: 'You are solely responsible for maintaining the confidentiality of your login credentials. You must immediately notify GearTrad of any unauthorized access to your account. GearTrad will never ask for your password via chat or email. You are liable for all activity conducted under your account.',
        },
        {
          title: '4. Listings & Prohibited Items',
          body: 'Sellers represent and warrant that: (a) they are the legitimate owner of the item listed; (b) the item is accurately described with no material omissions; (c) the item does not violate any game publisher\'s terms of service to a degree that makes transfer impossible. Prohibited listings include: stolen or hacked accounts, boosted-by-third-party accounts misrepresented as earned, items involving real-money gambling, and any content violating Egyptian or international law. Violations result in immediate permanent ban and potential legal action.',
        },
        {
          title: '5. Escrow & Payment',
          body: 'All transactions on GearTrad use a peer-to-peer escrow system. The buyer pays the seller directly via the chosen payment method (Vodafone Cash, InstaPay, crypto, etc.). GearTrad holds the account credentials and only releases them to the buyer after the seller confirms payment received. GearTrad charges no platform fee — 100% of the sale goes to the seller. GearTrad is not liable for account bans, suspensions, or item loss caused by game publishers after a completed and confirmed transaction. Crypto payments are irreversible by nature; buyers should only confirm receipt after verifying delivery.',
        },
        {
          title: '6. Buyer Protection & Refunds',
          body: 'If a seller fails to deliver, the buyer must NOT confirm delivery and must open a support ticket within 72 hours of payment. GearTrad moderators will review evidence from both parties and make a final decision. Because payments are peer-to-peer, refund resolution depends on the payment method and both parties cooperating. GearTrad\'s decision on dispute outcomes is final. Attempting to dispute or chargeback through a payment processor without first going through GearTrad support will result in immediate account suspension.',
        },
        {
          title: '7. Prohibited Conduct',
          body: 'Users must not: (a) conduct transactions outside the platform to circumvent escrow; (b) harass, threaten, or abuse other users; (c) use automated bots, scrapers, or tools to manipulate the platform; (d) create fake accounts or misrepresent identity; (e) post spam, misleading content, or false reviews; (f) attempt to hack, reverse-engineer, or disrupt the platform; (g) use the platform for money laundering or any illegal financial activity.',
        },
        {
          title: '8. Identity Verification',
          body: 'GearTrad offers optional identity verification (Verified badge). By submitting verification documents, you consent to GearTrad storing and reviewing your government-issued ID and selfie for the sole purpose of identity verification. This data is stored securely and never shared with third parties except as required by law.',
        },
        {
          title: '9. Dispute Resolution',
          body: 'In the event of a dispute, both parties must submit evidence to GearTrad support. GearTrad moderators will review the evidence and make a final, binding decision within 5 business days. GearTrad\'s decision is not subject to appeal. Any legal disputes arising from these terms shall be governed by Egyptian law and resolved in Egyptian courts.',
        },
        {
          title: '10. Termination',
          body: 'GearTrad reserves the right to suspend or permanently terminate any account at its sole discretion, with or without notice, for any violation of these terms or for any conduct deemed harmful to the platform or its users. Upon termination, any pending escrow funds will be handled according to the current transaction status and applicable refund policy.',
        },
        {
          title: '11. Limitation of Liability',
          body: 'GearTrad is a marketplace platform and is not a party to transactions between buyers and sellers. To the maximum extent permitted by law, GearTrad is not liable for any direct, indirect, incidental, special, or consequential damages arising from use of the platform, including but not limited to loss of account value, game publisher bans, or fraudulent conduct by third parties.',
        },
        {
          title: '12. Intellectual Property',
          body: 'GearTrad and its logo, branding, and content are the intellectual property of AuricMinds Group. Users retain ownership of content they post (listings, profile info) but grant GearTrad a non-exclusive license to display, reproduce, and promote this content on the platform.',
        },
        {
          title: '13. Changes to Terms',
          body: 'We may update these terms at any time. We will notify users of material changes via email or an in-app notice at least 7 days before the change takes effect. Continued use of the platform after changes constitutes acceptance of the revised terms.',
        },
        {
          title: '14. Contact',
          body: 'For questions about these terms, contact us through the Help Center. For legal notices, include "Legal Notice" in your subject line.',
        },
      ].map(({ title, body }) => (
        <section key={title} className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
          <p className="text-muted text-sm leading-relaxed">{body}</p>
        </section>
      ))}

      <p className="text-muted text-sm border-t border-border pt-6 mt-6">
        © {new Date().getFullYear()} AuricMinds Group — GearTrad. All rights reserved.
      </p>
    </div>
  );
}
