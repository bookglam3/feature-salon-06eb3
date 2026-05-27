import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Feature",
  description: "How Feature collects, uses, and protects your personal data. UK GDPR compliant.",
  alternates: { canonical: "https://www.featuresalon.co.uk/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", textDecoration: "none", letterSpacing: "-0.5px" }}>
          feature
        </Link>
        <Link href="/signup" style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)", color: "#fff", padding: "9px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>
          Start Free Trial
        </Link>
      </header>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#EEF2FF 0%,#F5F3FF 100%)", borderBottom: "1px solid #E2E8F0", padding: "52px 24px 44px", textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "#0F172A", letterSpacing: "-1px", margin: "0 0 14px" }}>Privacy Policy</h1>
        <p style={{ fontSize: 15, color: "#64748B", maxWidth: 520, margin: "0 auto 16px" }}>
          We take your privacy seriously. This policy explains what data we collect, how we use it, and your rights under UK GDPR.
        </p>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>Last updated: 27 May 2026 · Effective: 27 May 2026</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "52px 24px 80px" }}>

        <Section title="1. Who We Are">
          <p>Feature (&ldquo;Feature&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the booking and business management platform available at <strong>featuresalon.co.uk</strong>. We are the data controller for the personal data of our business subscribers (salon owners, clinic operators, gym managers, and similar). Where our subscribers use Feature to manage their own clients&apos; bookings, the subscriber is the data controller for those end-client records and Feature acts as a data processor.</p>
          <p>For questions about this policy, contact us at: <a href="mailto:privacy@featuresalon.co.uk" style={{ color: "#6366F1" }}>privacy@featuresalon.co.uk</a></p>
        </Section>

        <Section title="2. Data We Collect">
          <SubHeading>2.1 Account holders (business subscribers)</SubHeading>
          <ul>
            <li>Name and business name</li>
            <li>Email address and password (hashed — we never store plaintext passwords)</li>
            <li>Business type, slug, and plan information</li>
            <li>Billing information (processed by Stripe — we do not store card numbers)</li>
          </ul>
          <SubHeading>2.2 Staff members added by the account holder</SubHeading>
          <ul>
            <li>Name, email address, role, and working hours</li>
            <li>Services they are assigned to</li>
          </ul>
          <SubHeading>2.3 End clients (customers who book via a public booking page)</SubHeading>
          <ul>
            <li>Name, email address, and phone number (provided at booking)</li>
            <li>Appointment history and service preferences</li>
            <li>Payment status (we do not store payment card data — processed by Stripe)</li>
          </ul>
          <SubHeading>2.4 Usage and technical data</SubHeading>
          <ul>
            <li>Pages visited, features used, and session duration</li>
            <li>IP address, browser type, and device type</li>
            <li>Error logs used to diagnose technical issues</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <p>We use the data we collect to:</p>
          <ul>
            <li>Provide and maintain the Feature platform</li>
            <li>Process bookings and send confirmation and reminder messages (email, SMS, WhatsApp)</li>
            <li>Process subscription payments via Stripe</li>
            <li>Send product updates and important account notices (you can opt out of marketing emails at any time)</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Improve our platform through aggregated, anonymised usage analytics</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>We do <strong>not</strong> sell your personal data to third parties. We do not use it for advertising purposes.</p>
        </Section>

        <Section title="4. Legal Basis for Processing (UK GDPR)">
          <ul>
            <li><strong>Contract performance</strong> — processing necessary to deliver the Feature service you have signed up for</li>
            <li><strong>Legitimate interests</strong> — fraud prevention, platform security, and service improvement</li>
            <li><strong>Consent</strong> — marketing communications (you may withdraw consent at any time)</li>
            <li><strong>Legal obligation</strong> — where we are required by law to process or retain data</li>
          </ul>
        </Section>

        <Section title="5. Third-Party Services">
          <p>Feature uses the following trusted third-party processors:</p>
          <ul>
            <li><strong>Supabase</strong> — cloud database and authentication (EU/UK data storage)</li>
            <li><strong>Stripe</strong> — payment processing (PCI-DSS compliant)</li>
            <li><strong>Twilio / WhatsApp Business API</strong> — appointment reminder messages</li>
            <li><strong>SendGrid / Resend</strong> — transactional email delivery</li>
            <li><strong>Vercel</strong> — application hosting</li>
          </ul>
          <p>All processors are subject to data processing agreements and are bound to process data only on our instruction.</p>
        </Section>

        <Section title="6. Data Retention">
          <ul>
            <li><strong>Active accounts:</strong> data is retained for as long as your account is active</li>
            <li><strong>Cancelled accounts:</strong> account data is deleted within 90 days of cancellation, unless we are legally required to retain it longer</li>
            <li><strong>Booking records:</strong> may be retained for up to 7 years for financial and legal compliance purposes</li>
            <li><strong>Anonymised analytics:</strong> retained indefinitely in aggregate form only</li>
          </ul>
        </Section>

        <Section title="7. Your Rights Under UK GDPR">
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong>Rectification</strong> — ask us to correct inaccurate or incomplete data</li>
            <li><strong>Erasure</strong> — request deletion of your personal data (&ldquo;right to be forgotten&rdquo;)</li>
            <li><strong>Restriction</strong> — ask us to restrict processing of your data in certain circumstances</li>
            <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
            <li><strong>Object</strong> — object to processing based on legitimate interests or for direct marketing</li>
            <li><strong>Withdraw consent</strong> — where processing is based on consent, withdraw it at any time</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:privacy@featuresalon.co.uk" style={{ color: "#6366F1" }}>privacy@featuresalon.co.uk</a>. We will respond within 30 days. You also have the right to lodge a complaint with the <strong>Information Commissioner&apos;s Office (ICO)</strong> at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: "#6366F1" }}>ico.org.uk</a>.</p>
        </Section>

        <Section title="8. Cookies">
          <p>Feature uses the following types of cookies:</p>
          <ul>
            <li><strong>Essential cookies</strong> — required for authentication and session management. These cannot be disabled.</li>
            <li><strong>Preference cookies</strong> — remember your settings (e.g. active salon, language). You can clear these in your browser settings.</li>
            <li><strong>Analytics cookies</strong> — anonymised usage data to help us improve the platform. You may opt out by adjusting your browser settings.</li>
          </ul>
          <p>We do not use advertising or tracking cookies.</p>
        </Section>

        <Section title="9. Data Security">
          <p>We implement industry-standard security measures including:</p>
          <ul>
            <li>TLS encryption for all data in transit</li>
            <li>Encrypted storage at rest via Supabase</li>
            <li>Row-level security policies so each account can only access its own data</li>
            <li>Bcrypt password hashing (plaintext passwords are never stored)</li>
            <li>Regular security reviews and dependency updates</li>
          </ul>
          <p>In the event of a data breach that is likely to result in risk to individuals, we will notify affected users and the ICO within 72 hours as required by UK GDPR.</p>
        </Section>

        <Section title="10. International Transfers">
          <p>Feature stores data primarily within the UK and European Economic Area. Where data is transferred outside the UK/EEA (for example, via Stripe or Vercel infrastructure), we ensure appropriate safeguards are in place, including Standard Contractual Clauses or equivalent mechanisms recognised under UK law.</p>
        </Section>

        <Section title="11. Children">
          <p>Feature is intended for use by businesses and is not directed at individuals under the age of 18. We do not knowingly collect data from children. If you believe a child has provided us with personal data, please contact us at <a href="mailto:privacy@featuresalon.co.uk" style={{ color: "#6366F1" }}>privacy@featuresalon.co.uk</a> and we will delete it promptly.</p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. When we make material changes, we will notify account holders by email at least 14 days before the changes take effect. Continued use of Feature after the effective date constitutes acceptance of the updated policy. The &ldquo;Last updated&rdquo; date at the top of this page always reflects the current version.</p>
        </Section>

        <Section title="13. Contact">
          <p>For any privacy-related questions or requests:</p>
          <ul>
            <li>Email: <a href="mailto:privacy@featuresalon.co.uk" style={{ color: "#6366F1" }}>privacy@featuresalon.co.uk</a></li>
            <li>Website: <a href="https://www.featuresalon.co.uk" style={{ color: "#6366F1" }}>featuresalon.co.uk</a></li>
          </ul>
        </Section>

        {/* Footer nav */}
        <div style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid #E2E8F0", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/terms" style={{ color: "#6366F1", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Terms of Service →</Link>
          <Link href="/" style={{ color: "#64748B", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Back to Home</Link>
          <Link href="/signup" style={{ color: "#64748B", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Start Free Trial</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.4px", marginBottom: 14, paddingBottom: 10, borderBottom: "2px solid #EEF2FF" }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: "#334155" }}>
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontWeight: 700, color: "#0F172A", marginTop: 18, marginBottom: 6, fontSize: 14 }}>
      {children}
    </p>
  );
}
