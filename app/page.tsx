import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">

      {/* Navbar */}
      <nav className="nav">
        <span className="nav-logo">feature</span>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#reviews">Reviews</a>
          <Link href="/login">Login</Link>
          <Link href="/signup" className="btn-primary">Start free trial</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">BUILT FOR UK & EUROPEAN SALONS</div>
        <h1 className="hero-title">Run your salon without the chaos</h1>
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
            { title: "Reminders", desc: "Automated SMS and email reminders reduce no-shows by 60%." },
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

      {/* Pricing */}
      <section id="pricing" className="section">
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
            {["Everything in Starter", "Up to 10 staff", "SMS & email reminders", "Reports & analytics", "100 messages/month"].map((f) => (
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
      <section id="reviews" className="section section-white">
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
                <div className="review-salon">Aura Hair & Beauty · London</div>
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
            <p className="review-text">&ldquo;Managing 8 staff members used to be a nightmare. Now I can see everyone's schedule, block off holidays, and track revenue — all from my phone. Absolutely brilliant software.&rdquo;</p>
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

      {/* Footer */}
      <footer className="footer">
        <span className="nav-logo footer-logo">feature</span>
        <span className="footer-copy">© 2025 Feature. Built for salons across the UK & Europe.</span>
      </footer>

    </main>
  );
}