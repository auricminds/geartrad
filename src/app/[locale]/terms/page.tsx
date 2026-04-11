export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-muted text-sm mb-10">Last updated: April 2026</p>

      {[
        {
          title: '1. Acceptance of Terms',
          body: 'By accessing or using GearTrad, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.',
        },
        {
          title: '2. Eligibility',
          body: 'You must be at least 16 years old to create an account. By registering, you confirm you meet this requirement.',
        },
        {
          title: '3. Account Responsibility',
          body: 'You are responsible for maintaining the confidentiality of your account credentials. You are liable for all activity that occurs under your account.',
        },
        {
          title: '4. Listings & Sales',
          body: 'Sellers confirm that all items listed are legitimately owned and available for sale. Fraudulent listings, false information, or items obtained illegally are strictly prohibited and will result in immediate account termination.',
        },
        {
          title: '5. Escrow & Payments',
          body: 'GearTrad holds buyer payment in escrow until the buyer confirms successful delivery. A 5% platform fee is deducted from all transactions. GearTrad is not responsible for losses resulting from account bans, suspensions, or changes made by game publishers after a sale.',
        },
        {
          title: '6. Prohibited Conduct',
          body: 'Users may not: attempt to conduct transactions outside the platform, harass other users, post spam or misleading content, attempt to defraud buyers or sellers, or use automated tools to manipulate the platform.',
        },
        {
          title: '7. Dispute Resolution',
          body: 'In the event of a dispute, GearTrad moderators will review evidence from both parties. GearTrad\'s decision is final in all disputes. Chargebacks initiated outside the platform will result in account suspension.',
        },
        {
          title: '8. Termination',
          body: 'GearTrad reserves the right to suspend or permanently terminate any account that violates these terms, at our sole discretion and without prior notice.',
        },
        {
          title: '9. Limitation of Liability',
          body: 'GearTrad is a marketplace platform and is not a party to transactions between buyers and sellers. We are not liable for any direct, indirect, incidental, or consequential damages arising from use of the platform.',
        },
        {
          title: '10. Changes to Terms',
          body: 'We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.',
        },
      ].map(({ title, body }) => (
        <section key={title} className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
          <p className="text-muted text-sm leading-relaxed">{body}</p>
        </section>
      ))}

      <p className="text-muted text-sm border-t border-border pt-6 mt-6">
        Questions? Contact us via the Help Center.
      </p>
    </div>
  );
}
