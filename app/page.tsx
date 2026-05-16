import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Feature Salon | UK's #1 Salon Management Software",
  description: "Free salon booking software for UK salons. Online bookings, payments, reminders. Better than Fresha. Start free trial.",
  alternates: { canonical: "https://www.featuresalon.co.uk" },
};

const faqItems = [
  { question: "Is Feature Salon free to start?", answer: "Yes — every plan includes a 14-day free trial with no credit card required. You get full access to all features from day one." },
  { question: "Does Feature Salon work for UK salons?", answer: "Absolutely. Feature Salon is built specifically for the UK market. Pricing is in GBP, reminders are optimised for UK time zones, and our support team is UK-based." },
  { question: "How does Feature compare to Fresha?", answer: "Unlike Fresha, Feature Salon charges a flat monthly subscription with zero commission on bookings or payments. Our Pro plan at £59/month replaces Fresha's hidden fees which can exceed £150/month for a busy salon." },
  { question: "How does Feature compare to Treatwell?", answer: "Treatwell takes a commission on every booking made through their marketplace. Feature Salon gives you your own branded booking page with no marketplace fees — you keep 100% of your revenue." },
  { question: "Can clients book online 24/7?", answer: "Yes. Every salon gets a public booking page where clients can browse services, choose a staff member, and book at any time — no phone calls needed." },
  { question: "What payment methods are supported?", answer: "Feature Salon uses Stripe for payments, supporting all major credit and debit cards. You can take deposits or full payments at booking time to reduce no-shows." },
  { question: "Is there a long-term contract?", answer: "No contracts at all. All plans are monthly and you can cancel at any time from your dashboard. We also offer a 30-day money-back guarantee." },
  { question: "Do you send automated appointment reminders?", answer: "Yes — Feature Salon sends automated SMS, WhatsApp, and email reminders to clients before their appointments. Salons using reminders report a 60% reduction in no-shows." },
];

const comparisonData = [
  { feature: "Monthly subscription fee",   feature_: true,  fresha: false, treatwell: false },
  { feature: "Zero booking commission",    feature_: true,  fresha: false, treatwell: false },
  { feature: "Zero payment commission",    feature_: true,  fresha: false, treatwell: false },
  { feature: "Own branded booking page",   feature_: true,  fresha: true,  treatwell: false },
  { feature: "WhatsApp reminders",         feature_: true,  fresha: false, treatwell: false },
  { feature: "SMS & email reminders",      feature_: true,  fresha: true,  treatwell: true  },
  { feature: "Stripe online payments",     feature_: true,  fresha: true,  treatwell: true  },
  { feature: "UK-based customer support",  feature_: true,  fresha: false, treatwell: false },
  { feature: "14-day free trial",          feature_: true,  fresha: false, treatwell: false },
  { feature: "No hidden marketplace fees", feature_: true,  fresha: false, treatwell: false },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.featuresalon.co.uk/#faq",
  url: "https://www.featuresalon.co.uk",
  name: "Feature Salon — Frequently Asked Questions",
  mainEntity: faqItems.map((item, i) => ({
    "@type": "Question",
    "@id": `https://www.featuresalon.co.uk/#faq-${i + 1}`,
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      "@id": `https://www.featuresalon.co.uk/#faq-${i + 1}-answer`,
      text: item.answer,
    },
  })),
};

export default function Home() {
  return (
    <main className="landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── Navbar ── */}
      <nav className="nav">
        <span className="nav-logo" style={{display:"flex",alignItems:"center",gap:8}}>
          <Image src="/icons/icon-192.png" alt="Feature Salon logo" width={28} height={28} style={{borderRadius:8,display:"block"}} priority />
          feature
        </span>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#compare">vs Fresha</a>
          <a href="#pricing">Pricing</a>
          <a href="#reviews">Reviews</a>
          <Link href="/partner" style={{ color: "#6366F1", fontWeight: 600 }}>Become a Partner</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup" className="btn-primary">Start free trial</Link>
        </div>
        {/* Mobile hamburger area — just show CTA */}
        <Link href="/signup" className="btn-primary mobile-nav-cta">Start free trial</Link>
      </nav>

      {/* ── Hero ── */}
      <section className="hero hero-v2">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">BUILT FOR UK &amp; EUROPEAN SALONS</div>
            <h1 className="hero-title">Run your salon.<br/>Stop chasing clients.</h1>
            <p className="hero-sub">Feature handles bookings, WhatsApp reminders, payments, and staff — so you can focus on the chair, not the chaos.</p>
            <div className="hero-btns">
              <Link href="/signup" className="btn-primary btn-lg">Start Free 14-Day Trial</Link>
              <a href="#how" className="btn-secondary btn-lg">See how it works</a>
            </div>
            <div className="hero-trust">
              {["No credit card required", "Cancel anytime", "UK support"].map(t => (
                <span key={t} className="hero-trust-item">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#ECFDF5"/><path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="hero-mockup" aria-hidden="true">
            <div className="mockup-browser">
              <div className="mockup-bar">
                <span className="mockup-dot" style={{background:"#FF5F57"}}/>
                <span className="mockup-dot" style={{background:"#FEBC2E"}}/>
                <span className="mockup-dot" style={{background:"#28C840"}}/>
                <div className="mockup-url">featuresalon.co.uk/dashboard</div>
              </div>
              <div className="mockup-body">
                {/* Stats row */}
                <div className="mock-stats">
                  {[
                    { label:"Today's Bookings", val:"12", color:"#6366F1" },
                    { label:"Revenue", val:"£840", color:"#10B981" },
                    { label:"No-Shows", val:"0", color:"#F59E0B" },
                  ].map(s => (
                    <div key={s.label} className="mock-stat">
                      <div className="mock-stat-val" style={{color:s.color}}>{s.val}</div>
                      <div className="mock-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Appointments */}
                <div className="mock-section-title">Today&apos;s Appointments</div>
                {[
                  { time:"09:00", name:"Sarah M.", service:"Balayage", staff:"Emma", status:"confirmed" },
                  { time:"10:30", name:"James T.", service:"Haircut", staff:"Liam",  status:"confirmed" },
                  { time:"11:00", name:"Aisha K.", service:"Blow-dry", staff:"Emma", status:"pending" },
                  { time:"12:00", name:"Priya S.", service:"Colour",   staff:"Liam",  status:"confirmed" },
                ].map(a => (
                  <div key={a.time} className="mock-appt">
                    <span className="mock-time">{a.time}</span>
                    <span className="mock-name">{a.name}</span>
                    <span className="mock-service">{a.service}</span>
                    <span className={`mock-badge mock-badge-${a.status}`}>{a.status}</span>
                  </div>
                ))}
                {/* WhatsApp sent indicator */}
                <div className="mock-reminder">
                  <span style={{color:"#25D366",fontSize:12}}>✔</span> WhatsApp reminders sent to 4 clients
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="trust-bar">
        {["No setup fees", "Free 14-day trial", "Cancel anytime", "UK-based support", "60% fewer no-shows"].map(item => (
          <div key={item} className="trust-item">
            <div className="trust-dot"/>
            {item}
          </div>
        ))}
      </section>

      {/* ── Problem → Solution ── */}
      <section className="section section-ps">
        <div className="section-label">THE PROBLEM</div>
        <h2 className="section-title">Sound familiar?</h2>
        <div className="ps-grid">
          <div className="ps-problems">
            {[
              { icon:"📞", text:"Phone ringing during appointments" },
              { icon:"💸", text:"Clients ghosting after no-show" },
              { icon:"📒", text:"Paper diary causing double bookings" },
              { icon:"😤", text:"Chasing payments manually" },
              { icon:"🔕", text:"No automated reminders" },
              { icon:"😩", text:"No idea which services make money" },
            ].map(p => (
              <div key={p.text} className="ps-problem-item">
                <span className="ps-icon">{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
          <div className="ps-arrow">→</div>
          <div className="ps-solution">
            <div className="ps-solution-header">Feature fixes all of this</div>
            {[
              { icon:"📲", text:"Clients book online 24/7 — you never pick up the phone" },
              { icon:"💬", text:"WhatsApp reminders cut no-shows by 60%" },
              { icon:"📅", text:"Smart calendar prevents double bookings" },
              { icon:"💳", text:"Stripe payments collected at booking" },
              { icon:"⚡", text:"Automated SMS, email & WhatsApp reminders" },
              { icon:"📊", text:"Revenue reports updated in real-time" },
            ].map(s => (
              <div key={s.text} className="ps-solution-item">
                <span className="ps-icon">{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
            <Link href="/signup" className="btn-primary" style={{display:"inline-block",marginTop:20}}>Fix it free for 14 days →</Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section section-white">
        <div className="section-label">WHAT YOU GET</div>
        <h2 className="section-title">Everything your salon needs</h2>
        <div className="features-grid features-grid-v2">
          {[
            { icon:"📲", title:"Online Booking System",      desc:"Clients book 24/7 from your branded page. No more missed calls or double bookings." },
            { icon:"👥", title:"Staff Management",           desc:"Set hours, assign services, manage holidays and track each staff member's performance." },
            { icon:"💬", title:"WhatsApp Reminders",         desc:"Automated WhatsApp, SMS & email reminders. Salons see 60% fewer no-shows within weeks." },
            { icon:"💳", title:"Stripe Payments",            desc:"Take deposits or full payments at booking time. Reduce no-shows and get paid upfront." },
            { icon:"📋", title:"Client CRM",                 desc:"Every client's visit history, preferences and notes — all in one searchable profile." },
            { icon:"📊", title:"Revenue Analytics",          desc:"Know your busiest days, top services, and best staff members at a glance every morning." },
            { icon:"🏢", title:"Multi-Salon Support",        desc:"Manage multiple locations from one dashboard. Perfect for growing salon chains." },
            { icon:"📱", title:"Mobile-First Design",        desc:"Your entire salon runs from your phone. iOS and Android ready, no app to download." },
          ].map(f => (
            <div key={f.title} className="feature-card feature-card-v2">
              <div className="feature-icon-v2">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="section">
        <div className="section-label">HOW IT WORKS</div>
        <h2 className="section-title">Up and running in under 10 minutes</h2>
        <div className="steps steps-v2">
          {[
            { num:"1", title:"Create your account", desc:"Sign up free. No credit card needed. Takes 60 seconds.", icon:"🚀" },
            { num:"2", title:"Add services & staff", desc:"Set your menu, team, and working hours. We guide you through everything.", icon:"⚙️" },
            { num:"3", title:"Share your booking link", desc:"Send it to clients or add it to Instagram bio. Start receiving bookings instantly.", icon:"🔗" },
          ].map(s => (
            <div key={s.num} className="step step-v2">
              <div className="step-icon">{s.icon}</div>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:40}}>
          <Link href="/signup" className="btn-primary btn-lg">Start for free — no card needed</Link>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section id="compare" className="section section-white">
        <div className="section-label">COMPETITOR COMPARISON</div>
        <h2 className="section-title">Feature vs Fresha vs Treatwell</h2>
        <p className="section-sub">See why UK salon owners are switching to Feature</p>
        <div className="compare-table-wrap">
          <table className="compare-table" role="table" aria-label="Feature Salon vs Fresha vs Treatwell comparison">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className="compare-col-feature"><span className="compare-badge-our">Feature ✓</span></th>
                <th scope="col" className="compare-col-other">Fresha</th>
                <th scope="col" className="compare-col-other">Treatwell</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map(row => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td className="compare-cell-feature"><span className={row.feature_ ? "compare-check" : "compare-cross"}>{row.feature_ ? "✓" : "✕"}</span></td>
                  <td className="compare-cell-other"><span className={row.fresha ? "compare-check" : "compare-cross"}>{row.fresha ? "✓" : "✕"}</span></td>
                  <td className="compare-cell-other"><span className={row.treatwell ? "compare-check" : "compare-cross"}>{row.treatwell ? "✓" : "✕"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="compare-cta">
          <Link href="/signup" className="btn-primary btn-lg">Switch to Feature — Free Trial</Link>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="section">
        <div className="section-label">PRICING</div>
        <h2 className="section-title">Simple, honest pricing</h2>
        <div className="fresha-badge"><span>💰</span><span>Up to 30% cheaper than Fresha — with zero commission fees</span></div>
        <div className="pricing-grid">
          <div className="plan-card">
            <div className="plan-name">STARTER</div>
            <div className="plan-price">£29<span>/month</span></div>
            <p className="plan-desc">Perfect for independent stylists and small salons.</p>
            {["Online booking page","Up to 3 staff","Client profiles","Email reminders","50 messages/month"].map(f => (
              <div key={f} className="plan-feature"><span>✓</span> {f}</div>
            ))}
            <Link href="/signup" className="plan-btn-outline">Start free trial</Link>
          </div>

          <div className="plan-card plan-featured">
            <div className="plan-popular">MOST POPULAR</div>
            <div className="plan-name plan-name-blue">PRO</div>
            <div className="plan-price">£59<span>/month</span></div>
            <p className="plan-desc">For growing salons that need more power and control.</p>
            {["Everything in Starter","Up to 10 staff","SMS & email reminders","Reports & analytics","100 messages/month"].map(f => (
              <div key={f} className="plan-feature"><span>✓</span> {f}</div>
            ))}
            <Link href="/signup" className="plan-btn-filled">Start free trial</Link>
          </div>

          <div className="plan-card">
            <div className="plan-name">BUSINESS</div>
            <div className="plan-price">£99<span>/month</span></div>
            <p className="plan-desc">For multi-location salons and large teams.</p>
            {["Everything in Pro","Unlimited staff","Priority support","Advanced reports","Unlimited messages"].map(f => (
              <div key={f} className="plan-feature"><span>✓</span> {f}</div>
            ))}
            <Link href="/signup" className="plan-btn-outline">Start free trial</Link>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="reviews" className="section section-white">
        <div className="section-label">WHAT SALON OWNERS SAY</div>
        <h2 className="section-title">Trusted by salons across the UK</h2>
        <div className="reviews-grid">
          {[
            { initials:"SB", name:"Sarah B.", salon:"Studio Bloom · Manchester", text:"Feature replaced three different apps we were using. Bookings, reminders, payments — all in one place. Our no-show rate dropped by half within a month." },
            { initials:"RA", name:"Rania A.", salon:"Aura Hair & Beauty · London", text:"The automated WhatsApp reminders are a game changer. Clients actually turn up now. Setup took less than 20 minutes and our booking page looks incredibly professional." },
            { initials:"JT", name:"James T.", salon:"The Barber Collective · Birmingham", text:"I was paying Fresha nearly £150 a month with hidden commission fees. Feature costs me £59, does everything Fresha does, and the support team actually replies within the hour.", featured: true },
            { initials:"NK", name:"Nadia K.", salon:"Luxe Beauty Lounge · Leeds", text:"Managing 8 staff members used to be a nightmare. Now I can see everyone's schedule, block off holidays, and track revenue — all from my phone. Absolutely brilliant software." },
          ].map(r => (
            <div key={r.name} className={`review-card${r.featured ? " review-card-featured" : ""}`}>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">&ldquo;{r.text}&rdquo;</p>
              <div className="review-author">
                <div className="review-avatar">{r.initials}</div>
                <div>
                  <div className="review-name">{r.name}</div>
                  <div className="review-salon">{r.salon}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="reviews-summary">
          <span className="reviews-score">4.9 / 5</span>
          <span className="reviews-stars-sm">★★★★★</span>
          <span className="reviews-count">Based on 200+ salon owner reviews</span>
        </div>
      </section>

      {/* ── Location Pages ── */}
      <section id="locations" className="section">
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

      {/* ── FAQ ── */}
      <section id="faq" className="section section-white">
        <div className="section-label">FAQ</div>
        <h2 className="section-title">Frequently asked questions</h2>
        <div className="faq-list">
          {faqItems.map((item, i) => (
            <details key={i} className="faq-item" itemScope itemType="https://schema.org/Question">
              <summary className="faq-question" itemProp="name">{item.question}</summary>
              <div className="faq-answer" itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                <p itemProp="text">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
        <div className="faq-cta">
          <p>Still have questions?</p>
          <Link href="/signup" className="btn-primary btn-lg">Start your free trial</Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="section final-cta">
        <h2 className="final-cta-title">Start your salon transformation today</h2>
        <p className="final-cta-sub">Join salons across the UK using Feature to automate bookings, cut no-shows, and grow revenue.</p>
        <Link href="/signup" className="btn-primary btn-lg btn-glow">Start Free 14-Day Trial →</Link>
        <div className="final-cta-trust">
          <span>No credit card required</span>
          <span>·</span>
          <span>Cancel anytime</span>
          <span>·</span>
          <span>UK support</span>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <span className="nav-logo footer-logo" style={{display:"flex",alignItems:"center",gap:8}}>
          <Image src="/icons/icon-192.png" alt="Feature Salon logo" width={24} height={24} style={{borderRadius:6,display:"block",opacity:0.9}} />
          feature
        </span>
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

      {/* ── Mobile sticky CTA ── */}
      <div className="mobile-sticky-cta">
        <Link href="/signup" className="mobile-sticky-btn">Start Free Trial — No Card Needed</Link>
      </div>
    </main>
  );
}