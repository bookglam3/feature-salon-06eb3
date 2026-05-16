import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Salon Management Software for London Salons | Feature Salon",
  description:
    "Feature Salon helps London hair salons, beauty salons, and barbershops manage bookings, staff, and payments online. Free 14-day trial. Better than Fresha.",
  keywords: ["salon software london", "london salon booking system", "fresha alternative london"],
  alternates: { canonical: "https://www.featuresalon.co.uk/salons/london" },
  openGraph: {
    title: "Salon Management Software for London Salons | Feature Salon",
    description: "Feature Salon helps London salons manage bookings, staff, and payments. Free 14-day trial.",
    url: "https://www.featuresalon.co.uk/salons/london",
    locale: "en_GB",
  },
};

export default function LondonPage() {
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
        <div className="hero-badge">🏙️ LONDON SALONS</div>
        <h1 className="hero-title">Salon Management Software for London Salons</h1>
        <p className="hero-sub">
          Hundreds of London hair salons, beauty salons, and barbershops use Feature to manage bookings,
          staff, and payments — without Fresha&apos;s hidden commission fees.
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
        <div className="section-label">WHY LONDON SALONS CHOOSE FEATURE</div>
        <h2 className="section-title">Built for the pace of London</h2>
        <div className="features-grid">
          {[
            { title: "Online booking 24/7", desc: "London clients expect to book at any time. Feature gives every salon a beautiful, mobile-first booking page." },
            { title: "WhatsApp & SMS reminders", desc: "Reduce no-shows with automated reminders via WhatsApp, SMS, and email — before every appointment." },
            { title: "No Fresha commission", desc: "Feature charges a flat monthly fee. No per-booking commissions, no payment processing markups." },
            { title: "Multi-staff scheduling", desc: "Manage your entire team's calendars, breaks, and holidays from one clean dashboard." },
            { title: "Stripe online payments", desc: "Take deposits or full payments online via Stripe. Perfect for London salons with high no-show risk." },
            { title: "UK-based support", desc: "Our support team is based in the UK and responds within the hour." },
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
        <div className="section-label">LONDON SALON OWNERS SAY</div>
        <h2 className="section-title">Trusted by London salons</h2>
        <div className="reviews-grid">
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">&ldquo;The automated WhatsApp reminders are a game changer. Setup took less than 20 minutes and our booking page looks incredibly professional.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">RA</div>
              <div>
                <div className="review-name">Rania A.</div>
                <div className="review-salon">Aura Hair &amp; Beauty · Shoreditch, London</div>
              </div>
            </div>
          </div>
          <div className="review-card review-card-featured">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">&ldquo;We switched from Fresha 6 months ago and haven&apos;t looked back. Feature is simpler, faster, and we&apos;re saving over £80/month in fees.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">MC</div>
              <div>
                <div className="review-name">Marcus C.</div>
                <div className="review-salon">The Cut Room · Brixton, London</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-white" style={{ textAlign: "center" }}>
        <h2 className="section-title">Ready to grow your London salon?</h2>
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
          <Link href="/salons/manchester">Manchester</Link>
          <Link href="/salons/birmingham">Birmingham</Link>
          <Link href="/signup">Sign up</Link>
        </nav>
        <span className="footer-copy">© 2025 Feature. Built for salons across the UK.</span>
      </footer>
    </main>
  );
}
