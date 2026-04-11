export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-muted text-sm mb-10">Last updated: April 2026</p>

      {[
        {
          title: 'Information We Collect',
          body: 'We collect information you provide when creating an account (email, username), when posting listings (listing details, images), and when making transactions. We also collect usage data such as pages visited and features used.',
        },
        {
          title: 'How We Use Your Information',
          body: 'We use your information to operate the platform, process transactions, send notifications, provide customer support, prevent fraud, and improve our services. We do not sell your personal data to third parties.',
        },
        {
          title: 'Verification Data',
          body: 'If you submit identity verification documents (ID and selfie), this data is stored securely and reviewed only by authorized GearTrad moderators. It is used solely to verify your identity and is not shared with third parties.',
        },
        {
          title: 'Cookies & Analytics',
          body: 'We use cookies to maintain your session and preferences. We may use anonymous analytics to understand how the platform is used. You can disable cookies in your browser settings, though some features may not function properly.',
        },
        {
          title: 'Data Retention',
          body: 'We retain your account data for as long as your account is active. Verification documents are retained for legal compliance purposes. You may request deletion of your account by contacting support.',
        },
        {
          title: 'Security',
          body: 'We use industry-standard security measures including encrypted connections (HTTPS) and Supabase\'s managed authentication infrastructure. No system is 100% secure, and we cannot guarantee absolute security.',
        },
        {
          title: 'Your Rights',
          body: 'You have the right to access, correct, or request deletion of your personal data. Contact us through the Help Center to exercise these rights.',
        },
        {
          title: 'Changes to This Policy',
          body: 'We may update this policy periodically. We will notify users of significant changes via email or an in-app notice.',
        },
      ].map(({ title, body }) => (
        <section key={title} className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
          <p className="text-muted text-sm leading-relaxed">{body}</p>
        </section>
      ))}
    </div>
  );
}
