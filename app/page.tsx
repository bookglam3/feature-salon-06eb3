import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Feature Salon | UK's #1 Salon Management Software",
  description:
    "Free salon booking software for UK salons. Online bookings, payments, reminders. Better than Fresha. Start free trial.",
  alternates: {
    canonical: "https://www.featuresalon.co.uk",
  },
};

const faqItems = [
  {
    question: "Is Feature Salon free to start?",
    answer:
      "Yes — every plan includes a 14-day free trial with no credit card required. You get full access to all features from day one.",
  },
  {
    question: "Does Feature Salon work for UK salons?",
    answer:
      "Absolutely. Feature Salon is built specifically for the UK market. Pricing is in GBP, reminders are optimised for UK time zones, and our support team is UK-based.",
  },
  {
    question: "How does Feature compare to Fresha?",
    answer:
      "Unlike Fresha, Feature Salon charges a flat monthly subscription with zero commission on bookings or payments. Our Pro plan at £59/month replaces Fresha's hidden fees which can exceed £150/month for a busy salon.",
  },
  {
    question: "How does Feature compare to Treatwell?",
    answer:
      "Treatwell takes a commission on every booking made through their marketplace. Feature Salon gives you your own branded booking page with no marketplace fees — you keep 100% of your revenue.",
  },
  {
    question: "Can clients book online 24/7?",
    answer:
      "Yes. Every salon gets a public booking page where clients can browse services, choose a staff member, and book at any time — no phone calls needed.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "Feature Salon uses Stripe for payments, supporting all major credit and debit cards. You can take deposits or full payments at booking time to reduce no-shows.",
  },
  {
    question: "Is there a long-term contract?",
    answer:
      "No contracts at all. All plans are monthly and you can cancel at any time from your dashboard. We also offer a 30-day money-back guarantee.",
  },
  {
    question: "Do you send automated appointment reminders?",
    answer:
      "Yes — Feature Salon sends automated SMS, WhatsApp, and email reminders to clients before their appointments. Salons using reminders report a 60% reduction in no-shows.",
  },
];

const comparisonData = [
  { feature: "Monthly subscription fee",     feature_: true,  fresha: false, treatwell: false },
  { feature: "Zero booking commission",      feature_: true,  fresha: false, treatwell: false },
  { feature: "Zero payment commission",      feature_: true,  fresha: false, treatwell: false },
  { feature: "Own branded booking page",     feature_: true,  fresha: true,  treatwell: false },
  { feature: "WhatsApp reminders",           feature_: true,  fresha: false, treatwell: false },
  { feature: "SMS & email reminders",        feature_: true,  fresha: true,  treatwell: true  },
  { feature: "Stripe online payments",       feature_: true,  fresha: true,  treatwell: true  },
  { feature: "UK-based customer support",    feature_: true,  fresha: false, treatwell: false },
  { feature: "14-day free trial",            feature_: true,  fresha: false, treatwell: false },
  { feature: "No hidden marketplace fees",   feature_: true,  fresha: false, treatwell: false },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function Home() {
  return (
    <main className="landing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Navbar */}
      <nav className="nav">
        <span className="nav-logo">feature</span>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#compare">vs Fresha</a>
          <a href="#pricing">Pricing</a>
          <a href="#reviews">Reviews</a>
          <Link href="/partner" style={{ color: "#4F6EF7", fontWeight: 600 }}>Become a Partner</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup" className="btn-primary">Start free trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">BUILT FOR UK &amp; EUROPEAN SALONS</div>
        <h1 className="hero-title">UK&apos;s Best Salon Management Software</h1>
        <p className="hero-sub">Feature handles your bookings, staff, and clients — so you can focus on what you do best.</p>
        <div className="hero-btns">
          <Link href="/signup" className="btn-primary">Start free trial</Link>
          <a href="#how" className="btn-secondary">See how it works</a>
        </div>
      </section>

      {/* Trust bar */}
      <section className="trust-bar">
        {["No setup fees", "Free 14-day trial", "Cancel anytime", "UK-based support"].map((item) => (
          <div key={item} className="trust-item">
            <div className="trust-dot" />
            {item}
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" className="section">
        <div className="section-label">WHAT YOU GET</div>
        <h2 className="section-title">Everything your salon needs</h2>
        <div className="features-grid">
          {[
            { title: "Online booking", desc: "Clients book 24/7 from your own booking page. No more missed calls." },
            { title: "Staff management", desc: "Set hours, assign services, and manage your team in one place." },
            { title: "Client profiles", desc: "Track visit history, preferences, and notes for every client." },
            { title: "Reports", desc: "See revenue, bookings, and trends at a glance every day." },
            { title: "Reminders", desc: "Automated SMS, WhatsApp and email reminders reduce no-shows by 60%." },
            { title: "Payments", desc: "Accept deposits and full payments online. Stripe powered." },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="section section-white">
        <div className="section-label">HOW IT WORKS</div>
        <h2 className="section-title">Up and running in minutes</h2>
        <div className="steps">
          {[
            { num: "1", title: "Set up your salon", desc: "Add your services, staff, and working hours." },
            { num: "2", title: "Share your link", desc: "Send clients your booking page or add it to Instagram." },
            { num: "3", title: "Sit back", desc: "Feature handles bookings, reminders, and payments for you." },
          ].map((s) => (
            <div key={s.num} className="step">
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* vs Fresha & Treatwell Comparison */}
      <section id="compare" className="section">
        <div className="section-label">COMPETITOR COMPARISON</div>
        <h2 className="section-title">Feature vs Fresha vs Treatwell</h2>
        <p className="section-sub">See why thousands of UK salon owners are switching to Feature</p>
        <div className="compare-table-wrap">
          <table className="compare-table" role="table" aria-label="Feature Salon vs Fresha vs Treatwell comparison">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className="compare-col-feature">
                  <span className="compare-badge-our">Feature</span>
                </th>
                <th scope="col" className="compare-col-other">Fresha</th>
                <th scope="col" className="compare-col-other">Treatwell</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td className="compare-cell-feature">
                    <span className={row.feature_ ? "compare-check" : "compare-cross"}>
                      {row.feature_ ? "✓" : "✕"}
                    </span>
                  </td>
                  <td className="compare-cell-other">
                    <span className={row.fresha ? "compare-check" : "compare-cross"}>
                      {row.fresha ? "✓" : "✕"}
                    </span>
                  </td>
                  <td className="compare-cell-other">
                    <span className={row.treatwell ? "compare-check" : "compare-cross"}>
                      {row.treatwell ? "✓" : "✕"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="compare-cta">
          <Link href="/signup" className="btn-primary">Switch to Feature — Free Trial</Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section section-white">
        <div className="section-label">PRICING</div>
        <h2 className="section-title">Simple, honest pricing</h2>
        <div className="fresha-badge">
          <span>💰</span>
          <span>Up to 30% cheaper than Fresha — with no hidden fees</span>
        </div>
        <div className="pricing-grid">

          <div className="plan-card">
            <div className="plan-name">STARTER</div>
            <div className="plan-price">£29<span>/month</span></div>
            <p className="plan-desc">Perfect for independent stylists and small salons.</p>
            {["Online booking page", "Up to 3 staff", "Client profiles", "Email reminders", "50 messages/month"].map((f) => (
              <div key={f} className="plan-feature"><span>✓</span> {f}</div>
            ))}
            <Link href="/signup" className="plan-btn-outline">Start free trial</Link>
          </div>

          <div className="plan-card plan-featured">
            <div className="plan-popular">MOST POPULAR</div>
            <div className="plan-name plan-name-blue">PRO</div>
            <div className="plan-price">£59<span>/month</span></div>
            <p className="plan-desc">For growing salons that need more power and control.</p>
            {["Everything in Starter", "Up to 10 staff", "SMS &amp; email reminders", "Reports &amp; analytics", "100 messages/month"].map((f) => (
              <div key={f} className="plan-feature"><span>✓</span> {f}</div>
            ))}
            <Link href="/signup" className="plan-btn-filled">Start free trial</Link>
          </div>

          <div className="plan-card">
            <div className="plan-name">BUSINESS</div>
            <div className="plan-price">£99<span>/month</span></div>
            <p className="plan-desc">For multi-location salons and large teams.</p>
            {["Everything in Pro", "Unlimited staff", "Priority support", "Advanced reports", "Unlimited messages"].map((f) => (
              <div key={f} className="plan-feature"><span>✓</span> {f}</div>
            ))}
            <Link href="/signup" className="plan-btn-outline">Start free trial</Link>
          </div>

        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="section">
        <div className="section-label">WHAT SALON OWNERS SAY</div>
        <h2 className="section-title">Trusted by salons across the UK</h2>
        <div className="reviews-grid">

          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">&ldquo;Feature replaced three different apps we were using. Bookings, reminders, payments — all in one place. Our no-show rate dropped by half within a month.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">SB</div>
              <div>
                <div className="review-name">Sarah B.</div>
                <div className="review-salon">Studio Bloom · Manchester</div>
              </div>
            </div>
          </div>

          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">&ldquo;The automated WhatsApp reminders are a game changer. Clients actually turn up now. Setup took less than 20 minutes and our booking page looks incredibly professional.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">RA</div>
              <div>
                <div className="review-name">Rania A.</div>
                <div className="review-salon">Aura Hair &amp; Beauty · London</div>
              </div>
            </div>
          </div>

          <div className="review-card review-card-featured">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">&ldquo;I was paying Fresha nearly £150 a month with hidden commission fees. Feature costs me £59, does everything Fresha does, and the support team actually replies within the hour.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">JT</div>
              <div>
                <div className="review-name">James T.</div>
                <div className="review-salon">The Barber Collective · Birmingham</div>
              </div>
            </div>
          </div>

          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">&ldquo;Managing 8 staff members used to be a nightmare. Now I can see everyone&apos;s schedule, block off holidays, and track revenue — all from my phone. Absolutely brilliant software.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">NK</div>
              <div>
                <div className="review-name">Nadia K.</div>
                <div className="review-salon">Luxe Beauty Lounge · Leeds</div>
              </div>
            </div>
          </div>

        </div>
        <div className="reviews-summary">
          <span className="reviews-score">4.9 / 5</span>
          <span className="reviews-stars-sm">★★★★★</span>
          <span className="reviews-count">Based on 200+ salon owner reviews</span>
        </div>
      </section>

      {/* Location Pages */}
      <section id="locations" className="section section-white">
        <div className="section-label">SALONS ACROSS THE UK</div>
        <h2 className="section-title">Salon software for every UK city</h2>
        <p className="section-sub">Feature Salon powers independent salons and large chains across the UK.</p>
        <div className="locations-grid">
          <Link href="/salons/london" className="location-card">
            <div className="location-icon">🏙️</div>
            <h3>London Salons</h3>
            <p>Salon software for London&apos;s thriving beauty industry</p>
            <span className="location-link">Explore →</span>
          </Link>
          <Link href="/salons/manchester" className="location-card">
            <div className="location-icon">🌆</div>
            <h3>Manchester Salons</h3>
            <p>Powering Manchester&apos;s fastest-growing salons</p>
            <span className="location-link">Explore →</span>
          </Link>
          <Link href="/salons/birmingham" className="location-card">
            <div className="location-icon">🏘️</div>
            <h3>Birmingham Salons</h3>
            <p>Trusted by Birmingham&apos;s top hair &amp; beauty salons</p>
            <span className="location-link">Explore →</span>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section">
        <div className="section-label">FAQ</div>
        <h2 className="section-title">Frequently asked questions</h2>
        <div className="faq-list">
          {faqItems.map((item, i) => (
            <details key={i} className="faq-item" itemScope itemType="https://schema.org/Question">
              <summary className="faq-question" itemProp="name">{item.question}</summary>
              <div
                className="faq-answer"
                itemScope
                itemType="https://schema.org/Answer"
                itemProp="acceptedAnswer"
              >
                <p itemProp="text">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
        <div className="faq-cta">
          <p>Still have questions?</p>
          <Link href="/signup" className="btn-primary">Start your free trial</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span className="nav-logo footer-logo">feature</span>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/pricing">Pricing</Link>
          <Link href="/partner">Become a Partner</Link>
          <Link href="/salons/london">London</Link>
          <Link href="/salons/manchester">Manchester</Link>
          <Link href="/salons/birmingham">Birmingham</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign up</Link>
        </nav>
        <span className="footer-copy">© 2025 Feature. Built for salons across the UK &amp; Europe.</span>
      </footer>

    </main>
  );
}