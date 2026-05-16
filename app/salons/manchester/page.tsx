import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Salon Management Software for Manchester Salons | Feature Salon",
  description:
    "Feature Salon helps Manchester hair salons, beauty salons, and barbershops manage bookings, staff, and payments online. Free 14-day trial. Better than Fresha.",
  keywords: ["salon software manchester", "manchester salon booking system", "fresha alternative manchester"],
  alternates: { canonical: "https://www.featuresalon.co.uk/salons/manchester" },
  openGraph: {
    title: "Salon Management Software for Manchester Salons | Feature Salon",
    description: "Feature Salon helps Manchester salons manage bookings, staff, and payments. Free 14-day trial.",
    url: "https://www.featuresalon.co.uk/salons/manchester",
    locale: "en_GB",
  },
};

export default function ManchesterPage() {
  return (
    <main className="landing">
      <nav className="nav">
        <Link href="/" className="nav-logo" style={{display:"flex",alignItems:"center",gap:8}}>
          <Image src="/icons/icon-192.png" alt="Feature Salon logo" width={28} height={28} style={{borderRadius:8,display:"block"}} priority />
          feature
        </Link>
        <div className="nav-links">
          <Link href="/#features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup" className="btn-primary">Start free trial</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">🌆 MANCHESTER SALONS</div>
        <h1 className="hero-title">Salon Management Software for Manchester Salons</h1>
        <p className="hero-sub">
          Manchester&apos;s fastest-growing salons trust Feature to handle bookings, staff, automated reminders,
          and online payments — all from one simple dashboard.
        </p>
        <div className="hero-btns">
          <Link href="/signup" className="btn-primary">Start free trial — no card needed</Link>
          <Link href="/pricing" className="btn-secondary">View pricing</Link>
        </div>
      </section>

      <section className="trust-bar">
        {["No commission fees", "Free 14-day trial", "Cancel anytime", "UK-based support"].map((item) => (
          <div key={item} className="trust-item"><div className="trust-dot" />{item}</div>
        ))}
      </section>

      <section className="section section-white">
        <div className="section-label">WHY MANCHESTER SALONS CHOOSE FEATURE</div>
        <h2 className="section-title">Made for Manchester&apos;s salon scene</h2>
        <div className="features-grid">
          {[
            { title: "Online booking 24/7", desc: "Your clients can book haircuts, colour treatments, and beauty appointments at any time from any device." },
            { title: "Automated reminders", desc: "Send WhatsApp, SMS, and email reminders automatically — reduce no-shows by up to 60%." },
            { title: "No marketplace commission", desc: "Unlike Treatwell, Feature charges a flat monthly fee. Keep 100% of your booking revenue." },
            { title: "Staff scheduling", desc: "Manage rotas, breaks, and shifts for your entire Manchester salon team in one place." },
            { title: "Online deposits & payments", desc: "Collect deposits via Stripe at booking time to protect against last-minute cancellations." },
            { title: "Revenue analytics", desc: "See daily, weekly, and monthly revenue trends. Understand which services are most profitable." },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-label">MANCHESTER SALON OWNERS SAY</div>
        <h2 className="section-title">Loved by Manchester salons</h2>
        <div className="reviews-grid">
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">&ldquo;Feature replaced three different apps we were using. Bookings, reminders, payments — all in one place. Our no-show rate dropped by half within a month.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">SB</div>
              <div>
                <div className="review-name">Sarah B.</div>
                <div className="review-salon">Studio Bloom · Manchester City Centre</div>
              </div>
            </div>
          </div>
          <div className="review-card review-card-featured">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">&ldquo;Setting up was incredibly easy. Within an hour our booking page was live and clients started booking that same evening. The WhatsApp reminders alone paid for the subscription.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">PW</div>
              <div>
                <div className="review-name">Priya W.</div>
                <div className="review-salon">Velvet Beauty Studio · Didsbury, Manchester</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-white" style={{ textAlign: "center" }}>
        <h2 className="section-title">Ready to grow your Manchester salon?</h2>
        <p className="hero-sub">Start your 14-day free trial today. No credit card required.</p>
        <div className="hero-btns" style={{ justifyContent: "center" }}>
          <Link href="/signup" className="btn-primary">Start free trial</Link>
          <Link href="/pricing" className="btn-secondary">View plans &amp; pricing</Link>
        </div>
      </section>

      <footer className="footer">
        <Link href="/" className="nav-logo footer-logo" style={{display:"flex",alignItems:"center",gap:8}}>
          <Image src="/icons/icon-192.png" alt="Feature Salon logo" width={24} height={24} style={{borderRadius:6,display:"block",opacity:0.9}} />
          feature
        </Link>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/salons/london">London</Link>
          <Link href="/salons/birmingham">Birmingham</Link>
          <Link href="/signup">Sign up</Link>
        </nav>
        <span className="footer-copy">© 2025 Feature. Built for salons across the UK.</span>
      </footer>
    </main>
  );
}
