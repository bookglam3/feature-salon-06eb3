import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Feature",
  description: "Terms and conditions for using the Feature salon and appointment booking platform.",
  alternates: { canonical: "https://www.featuresalon.co.uk/terms" },
};

export default function TermsOfServicePage() {
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
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "#0F172A", letterSpacing: "-1px", margin: "0 0 14px" }}>Terms of Service</h1>
        <p style={{ fontSize: 15, color: "#64748B", maxWidth: 520, margin: "0 auto 16px" }}>
          Please read these terms carefully before using the Feature platform. By signing up, you agree to be bound by them.
        </p>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>Last updated: 27 May 2026 · Effective: 27 May 2026</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "52px 24px 80px" }}>

        <Section title="1. About Feature">
          <p>Feature (&ldquo;Feature&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a business management and online booking platform operated by Feature Ltd. Our platform is available at <strong>featuresalon.co.uk</strong> and is designed for salons, clinics, gyms, and similar appointment-based businesses (&ldquo;Subscribers&rdquo;).</p>
          <p>By creating an account or using any part of Feature, you agree to these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the platform.</p>
        </Section>

        <Section title="2. Eligibility">
          <ul>
            <li>You must be at least 18 years old to create a Feature account.</li>
            <li>You must be using Feature for a legitimate business purpose.</li>
            <li>You confirm that all information you provide during sign-up is accurate and up to date.</li>
            <li>If you are signing up on behalf of a company or organisation, you represent that you have authority to bind that entity to these Terms.</li>
          </ul>
        </Section>

        <Section title="3. Your Account">
          <ul>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must notify us immediately at <a href="mailto:support@featuresalon.co.uk" style={{ color: "#6366F1" }}>support@featuresalon.co.uk</a> if you suspect unauthorised access to your account.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You may not share your login credentials with third parties or create accounts on behalf of others without their consent.</li>
          </ul>
        </Section>

        <Section title="4. Subscription and Payment">
          <SubHeading>4.1 Free trial</SubHeading>
          <p>Feature offers a free trial period. No payment is required during the trial. At the end of your trial, you must subscribe to a paid plan to continue using the platform.</p>
          <SubHeading>4.2 Paid plans</SubHeading>
          <p>Subscription fees are billed in advance on a monthly or annual basis, depending on the plan you select. All prices are stated in GBP and are inclusive of VAT where applicable.</p>
          <SubHeading>4.3 Payment processing</SubHeading>
          <p>Payments are processed securely by Stripe. We do not store your card details. By providing payment information, you authorise us to charge the applicable fees to your chosen payment method.</p>
          <SubHeading>4.4 Refunds</SubHeading>
          <p>Subscription fees are non-refundable except where required by law. If you cancel your subscription, you will continue to have access to Feature until the end of your current billing period.</p>
          <SubHeading>4.5 Price changes</SubHeading>
          <p>We may change our subscription prices. We will give you at least 30 days&apos; notice of any price increase, which will take effect at your next renewal date.</p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to use Feature to:</p>
          <ul>
            <li>Violate any applicable law or regulation</li>
            <li>Upload or transmit malware, viruses, or any harmful code</li>
            <li>Attempt to gain unauthorised access to any part of Feature or its infrastructure</li>
            <li>Scrape, crawl, or harvest data from the platform without our written consent</li>
            <li>Use Feature to send unsolicited marketing communications (spam)</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
            <li>Engage in any activity that disrupts, damages, or interferes with the platform or other users</li>
          </ul>
          <p>We reserve the right to suspend or terminate your account if we reasonably believe you have violated these rules.</p>
        </Section>

        <Section title="6. Your Content">
          <p>You retain ownership of all data and content you upload to Feature (your business information, client records, service details, etc.). By using Feature, you grant us a limited licence to store and process that content solely to provide the service to you.</p>
          <p>You are responsible for ensuring that any client data you upload to Feature has been collected lawfully and that you have the right to share it with us for processing purposes. See our <Link href="/privacy" style={{ color: "#6366F1" }}>Privacy Policy</Link> for details of how we handle this data.</p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>All intellectual property rights in the Feature platform, including its design, code, trademarks, and content (excluding your uploaded data), are owned by Feature Ltd or our licensors. Nothing in these Terms grants you any right to use our intellectual property other than to use the platform as permitted by these Terms.</p>
        </Section>

        <Section title="8. Third-Party Integrations">
          <p>Feature integrates with third-party services including Stripe (payments), Twilio/WhatsApp (reminders), SendGrid/Resend (email), and Supabase (database). Your use of these integrations is subject to the relevant third-party terms of service. We are not responsible for the availability or actions of third-party services.</p>
        </Section>

        <Section title="9. Availability and Uptime">
          <p>We aim to maintain high availability of the Feature platform but do not guarantee uninterrupted service. We may perform scheduled or emergency maintenance that temporarily affects availability. We will endeavour to give advance notice of planned downtime where possible.</p>
          <p>Feature is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including warranties of merchantability and fitness for a particular purpose.</p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>To the fullest extent permitted by applicable law, Feature Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, loss of data, or business interruption, arising from your use of or inability to use the platform.</p>
          <p>Our total aggregate liability to you for any claims arising under or in connection with these Terms shall not exceed the total subscription fees you paid to us in the 12 months preceding the claim.</p>
          <p>Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded or limited by English law.</p>
        </Section>

        <Section title="11. Termination">
          <SubHeading>11.1 By you</SubHeading>
          <p>You may cancel your subscription at any time from your account settings or by emailing <a href="mailto:support@featuresalon.co.uk" style={{ color: "#6366F1" }}>support@featuresalon.co.uk</a>. Cancellation takes effect at the end of your current billing period.</p>
          <SubHeading>11.2 By us</SubHeading>
          <p>We may suspend or terminate your account immediately if you breach these Terms, fail to pay subscription fees, or if we are required to do so by law. We will notify you by email where possible.</p>
          <SubHeading>11.3 Effect of termination</SubHeading>
          <p>On termination, your access to the platform will cease. We will retain your data for up to 90 days following termination, during which you may request an export. After that period, data will be deleted in accordance with our <Link href="/privacy" style={{ color: "#6366F1" }}>Privacy Policy</Link>.</p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>We may update these Terms from time to time. When we make material changes, we will notify you by email at least 14 days before the changes take effect. Continued use of Feature after the effective date constitutes acceptance of the updated Terms. The &ldquo;Last updated&rdquo; date at the top of this page always reflects the current version.</p>
        </Section>

        <Section title="13. Governing Law and Disputes">
          <p>These Terms are governed by and construed in accordance with the laws of England and Wales. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          <p>Before commencing legal proceedings, we encourage you to contact us at <a href="mailto:support@featuresalon.co.uk" style={{ color: "#6366F1" }}>support@featuresalon.co.uk</a> so we can attempt to resolve the matter informally.</p>
        </Section>

        <Section title="14. Contact">
          <p>For any questions about these Terms:</p>
          <ul>
            <li>Email: <a href="mailto:support@featuresalon.co.uk" style={{ color: "#6366F1" }}>support@featuresalon.co.uk</a></li>
            <li>Website: <a href="https://www.featuresalon.co.uk" style={{ color: "#6366F1" }}>featuresalon.co.uk</a></li>
          </ul>
        </Section>

        {/* Footer nav */}
        <div style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid #E2E8F0", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ color: "#6366F1", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Privacy Policy →</Link>
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
