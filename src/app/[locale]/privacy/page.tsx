export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-muted text-sm mb-1">Last updated: April 2026</p>
      <p className="text-muted text-sm mb-10">
        GearTrad (operated by AuricMinds Group) is committed to protecting your privacy. This policy explains what data we collect, why, and how we keep it safe.
      </p>

      {[
        {
          title: '1. Data We Collect',
          body: 'Account data: email address, username, password hash (stored encrypted — we never see your plain password), account type (buyer/seller), and profile information you choose to provide. Transaction data: listing details, order history, payment method type (not card numbers — those go directly to Paymob), and escrow status. Verification data (optional): government-issued ID image and selfie, collected only when you apply for a Verified badge. Usage data: pages visited, features used, listings clicked — collected anonymously to improve the platform. Device/session data: IP address, browser type, and session tokens for security and fraud detection.',
        },
        {
          title: '2. What We Do NOT Collect',
          body: 'We do not collect or store card numbers, CVVs, or full banking credentials. Payments are peer-to-peer — buyers send money directly to sellers via their chosen method (Vodafone Cash, InstaPay, crypto, etc.). We do not handle or intermediate any funds. We do not collect your physical location beyond country level. We do not sell, rent, or trade your personal data to any third party for marketing purposes, ever.',
        },
        {
          title: '3. How We Use Your Data',
          body: 'To operate the platform: process transactions, manage escrow, deliver notifications, and enable chat. To verify identity: review submitted ID documents for Verified badge applications. To prevent fraud: detect suspicious activity, enforce bans, and protect users from scams. To improve the platform: analyze anonymous usage patterns. To communicate: send transactional emails (purchase confirmations, dispute updates) and important account notices. We do not send marketing emails without your explicit opt-in.',
        },
        {
          title: '4. Data Sharing',
          body: 'We share data with: (a) Supabase — our database and authentication provider, hosted on secure infrastructure; (b) Resend — transactional email delivery (recipient email address and email content only); (c) Law enforcement — only when legally required by a valid court order or Egyptian law. We do not share data with advertisers, data brokers, or any other third parties.',
        },
        {
          title: '5. Identity Verification Data',
          body: 'Government ID images and selfies submitted for verification are stored in encrypted Supabase Storage. They are accessible only to authorized GearTrad moderators. They are used solely to verify your identity, are never shared externally, and are retained for as long as your account is active or as required by applicable law.',
        },
        {
          title: '6. Cookies & Local Storage',
          body: 'We use session cookies to keep you logged in and preference cookies (locale, theme). We use browser localStorage to store anonymous activity data for personalized recommendations — this data never leaves your device and is not transmitted to our servers. You can clear localStorage at any time via your browser settings. We do not use third-party tracking cookies or advertising pixels.',
        },
        {
          title: '7. Data Security',
          body: 'All data is transmitted over HTTPS (TLS 1.2+). Passwords are hashed with bcrypt via Supabase Auth. Database access is protected by Row Level Security (RLS) — users can only access their own data. Our infrastructure uses Supabase\'s managed security, which includes encryption at rest and regular security audits. We apply security headers (CSP, HSTS, X-Frame-Options) to protect against common web attacks.',
        },
        {
          title: '8. Data Retention',
          body: 'Active account data is retained for as long as your account exists. After account deletion, personal data is removed within 30 days, except data we are legally required to retain (transaction records for financial compliance — typically 5 years). Verification documents are deleted within 90 days of account deletion.',
        },
        {
          title: '9. Your Rights',
          body: 'You have the right to: (a) access a copy of your personal data; (b) correct inaccurate data; (c) request deletion of your account and data; (d) object to processing of your data; (e) data portability (receive your data in a machine-readable format). To exercise any of these rights, contact us via the Help Center. We will respond within 14 days.',
        },
        {
          title: '10. Children\'s Privacy',
          body: 'GearTrad is not directed at users under 16. We do not knowingly collect personal data from children under 16. If we discover such data has been collected, we will delete it immediately. If you believe a minor has created an account, contact us immediately.',
        },
        {
          title: '11. Changes to This Policy',
          body: 'We will notify users of significant changes to this policy via email or an in-app notice at least 7 days before changes take effect. The "Last updated" date at the top of this page reflects the most recent revision.',
        },
        {
          title: '12. Contact',
          body: 'For privacy-related questions or to exercise your data rights, contact us through the Help Center. For data deletion requests, include "Data Deletion Request" in your message.',
        },
      ].map(({ title, body }) => (
        <section key={title} className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
          <p className="text-muted text-sm leading-relaxed">{body}</p>
        </section>
      ))}

      <p className="text-muted text-sm border-t border-border pt-6 mt-6">
        © {new Date().getFullYear()} AuricMinds Group — GearTrad.
      </p>
    </div>
  );
}
