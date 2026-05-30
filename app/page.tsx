import type { Metadata } from "next";
import Link from "next/link";
import { Scissors, Dumbbell, Flower2, Stethoscope, Sparkles, Leaf, Smile, HeartPulse, PhoneOff, Banknote, BookOpen, CreditCard, BellOff, BarChart3, Smartphone, MessageCircle, CalendarCheck, Zap, CalendarClock, Users, ContactRound, Rocket, Settings2, Share2, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Feature | Health & Wellbeing Booking Software — Free Trial",
  description: "Feature is a booking & management platform for salons, gyms, spas, yoga studios, physiotherapy clinics and more. WhatsApp reminders, Stripe payments, staff scheduling & CRM. 14-day free trial. No commission fees.",
  alternates: { canonical: "https://www.featuresalon.co.uk" },
};

const industries: { Icon: LucideIcon; name: string; desc: string }[] = [
  { Icon: Scissors,    name: "Salons & Barbershops",       desc: "Hair, beauty, nails & brows" },
  { Icon: Dumbbell,    name: "Gyms & Fitness Studios",     desc: "Classes, PT sessions & memberships" },
  { Icon: Flower2,     name: "Yoga & Pilates",              desc: "Group classes & 1-to-1 sessions" },
  { Icon: Stethoscope, name: "Physiotherapy",               desc: "Appointments, plans & follow-ups" },
  { Icon: Sparkles,    name: "Massage Therapy",             desc: "Deep tissue, sports & holistic" },
  { Icon: Leaf,        name: "Spas & Wellness Centres",    desc: "Full treatments & day packages" },
  { Icon: Smile,       name: "Dental & Aesthetic Clinics", desc: "Consultations & aftercare" },
  { Icon: HeartPulse,  name: "Personal Trainers",           desc: "Sessions, packages & progress" },
];

const faqItems = [
  { question: "Is Feature free to start?",                          answer: "Yes — every plan includes a 14-day free trial with no credit card required. You get full access to all features from day one." },
  { question: "Does Feature work for my type of business?",         answer: "Absolutely. Feature is built for any Health & Wellbeing business — salons, barbershops, gyms, yoga studios, physiotherapy clinics, spas, massage therapists, personal trainers, dental & aesthetic clinics, and more. If you take appointments, Feature works for you." },
  { question: "How does Feature compare to Fresha?",                answer: "Unlike Fresha, Feature charges a flat monthly subscription with zero commission on bookings or payments. Feature also supports a much broader range of businesses — gyms, physio clinics, yoga studios — not just salons and spas. Our Pro plan at £59/month replaces Fresha's hidden fees which can exceed £150/month for a busy business." },
  { question: "How does Feature compare to Treatwell?",             answer: "Treatwell takes a commission on every booking made through their marketplace. Feature gives you your own branded booking page with no marketplace fees — you keep 100% of your revenue. Feature also supports businesses far beyond salons and spas." },
  { question: "Can clients book online 24/7?",                      answer: "Yes. Every business gets a public booking page where clients can browse services, choose a staff member, and book at any time — no phone calls needed." },
  { question: "What payment methods are supported?",                answer: "Feature uses Stripe for payments, supporting all major credit and debit cards. You can take deposits or full payments at booking time to reduce no-shows." },
  { question: "Is there a long-term contract?",                     answer: "No contracts at all. All plans are monthly and you can cancel at any time from your dashboard. We also offer a 30-day money-back guarantee." },
  { question: "Do you send automated appointment reminders?",       answer: "Yes — Feature sends automated SMS, WhatsApp, and email reminders to clients before their appointments." },
  { question: "How much does Feature cost?",                        answer: "Feature starts from £29/month for the Starter plan (up to 3 staff), £59/month for Pro (up to 10 staff), and £99/month for Business (unlimited staff). All plans include a 14-day free trial with no credit card required." },
  { question: "What features does Feature include?",                answer: "Feature includes: online booking system, staff management & scheduling, automated WhatsApp/SMS/email reminders, Stripe payment processing, client CRM, revenue analytics, gift cards, loyalty program, waitlist management, class scheduling, and multi-location support." },
];

// ── Schema: FAQ ───────────────────────────────────────────────────
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.featuresalon.co.uk/#faq",
  mainEntity: faqItems.map((item, i) => ({
    "@type": "Question",
    "@id": `https://www.featuresalon.co.uk/#faq-${i + 1}`,
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

// ── Schema: SoftwareApplication ──────────────────────────────────
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://www.featuresalon.co.uk/#software",
  name: "Feature",
  url: "https://www.featuresalon.co.uk",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Health & Wellbeing Booking Software",
  operatingSystem: "Web, iOS, Android",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  description: "Feature is a UK booking & management platform for Health & Wellbeing businesses. Manage online bookings, staff scheduling, WhatsApp & SMS reminders, Stripe payments, client CRM, revenue analytics, gift cards, and loyalty programs — all from one dashboard.",
  featureList: [
    "Online booking system with 24/7 client self-booking",
    "Automated WhatsApp appointment reminders",
    "Automated SMS and email reminders",
    "Stripe payment processing with deposit collection",
    "Staff scheduling and management",
    "Class and group session scheduling",
    "Client CRM with visit history",
    "Revenue analytics and reports",
    "Multi-location management",
    "Gift card system",
    "Loyalty rewards program",
    "Waitlist management",
    "Mobile-first PWA design",
    "No booking commission fees",
    "Branded public booking page",
  ],
  screenshot: "https://www.featuresalon.co.uk/og-image.png",
  offers: [
    {
      "@type": "Offer",
      name: "Starter Plan",
      price: "29.00",
      priceCurrency: "GBP",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "29.00", priceCurrency: "GBP", billingDuration: "P1M" },
      description: "For solo practitioners. Up to 3 staff, online booking, email reminders.",
      url: "https://www.featuresalon.co.uk/signup",
    },
    {
      "@type": "Offer",
      name: "Pro Plan",
      price: "59.00",
      priceCurrency: "GBP",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "59.00", priceCurrency: "GBP", billingDuration: "P1M" },
      description: "For growing businesses. Up to 10 staff, SMS & WhatsApp reminders, analytics.",
      url: "https://www.featuresalon.co.uk/signup",
    },
    {
      "@type": "Offer",
      name: "Business Plan",
      price: "99.00",
      priceCurrency: "GBP",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "99.00", priceCurrency: "GBP", billingDuration: "P1M" },
      description: "For multi-location businesses. Unlimited staff, advanced reports, priority support.",
      url: "https://www.featuresalon.co.uk/signup",
    },
  ],
  publisher: {
    "@type": "Organization",
    name: "Feature",
    url: "https://www.featuresalon.co.uk",
    logo: { "@type": "ImageObject", url: "https://www.featuresalon.co.uk/brand/logo-light.svg" },
  },
};

// ── Schema: Organization ─────────────────────────────────────────
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.featuresalon.co.uk/#organization",
  name: "Feature",
  url: "https://www.featuresalon.co.uk",
  logo: {
    "@type": "ImageObject",
    url: "https://www.featuresalon.co.uk/brand/logo-light.svg",
    width: 200,
    height: 60,
  },
  description: "Feature provides UK Health & Wellbeing businesses with an all-in-one management platform including online booking, payments, reminders, and CRM.",
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", availableLanguage: "English", areaServed: "GB" },
  areaServed: { "@type": "Country", name: "United Kingdom" },
  sameAs: [
    "https://www.instagram.com/featuresalon",
    "https://www.facebook.com/featuresalon",
  ],
};

// ── Schema: WebSite ──────────────────────────────────────────────
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.featuresalon.co.uk/#website",
  url: "https://www.featuresalon.co.uk",
  name: "Feature",
  description: "UK Health & Wellbeing Booking & Management Software",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: "https://www.featuresalon.co.uk/book/{search_term_string}" },
    "query-input": "required name=search_term_string",
  },
};

const comparisonData = [
  { feature: "Monthly subscription fee",       feature_: true,  fresha: false, treatwell: false },
  { feature: "Zero booking commission",        feature_: true,  fresha: false, treatwell: false },
  { feature: "Zero payment commission",        feature_: true,  fresha: false, treatwell: false },
  { feature: "Own branded booking page",       feature_: true,  fresha: true,  treatwell: false },
  { feature: "WhatsApp reminders",             feature_: true,  fresha: false, treatwell: false },
  { feature: "SMS & email reminders",          feature_: true,  fresha: true,  treatwell: true  },
  { feature: "Stripe online payments",         feature_: true,  fresha: true,  treatwell: true  },
  { feature: "Gyms, physio & yoga support",   feature_: true,  fresha: false, treatwell: false },
  { feature: "14-day free trial",              feature_: true,  fresha: false, treatwell: false },
  { feature: "No hidden marketplace fees",     feature_: true,  fresha: false, treatwell: false },
];

export default function Home() {
  return (
    <main className="landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />

      {/* ── Navbar ── */}
      <nav className="nav">
        <span className="nav-logo">feature</span>
        <div className="nav-links">
          <a href="#who">Who it&apos;s for</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#compare">vs Fresha</a>
          <a href="#pricing">Pricing</a>
          <Link href="/about">About</Link>
          <Link href="/partner" style={{ color: "#C9A24B", fontWeight: 600 }}>Become a Partner</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup" className="btn-primary">Start free trial</Link>
        </div>
        <Link href="/signup" className="btn-primary mobile-nav-cta">Start free trial</Link>
      </nav>

      {/* ── Hero ── */}
      <section className="hero hero-v2">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">BUILT FOR UK HEALTH &amp; WELLBEING BUSINESSES</div>
            <h1 className="hero-title">One platform.<br/>Every wellness business.</h1>
            <p className="hero-sub">Feature handles bookings, WhatsApp reminders, payments, and staff — whether you run a salon, gym, physio clinic, yoga studio, or spa.</p>
            <div className="hero-btns">
              <Link href="/signup" className="btn-primary btn-lg">Start Free 14-Day Trial</Link>
              <a href="#who" className="btn-secondary btn-lg">See who it&apos;s for</a>
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
                <div className="mock-stats">
                  {[
                    { label:"Today's Bookings", val:"18", color:"#C9A24B" },
                    { label:"Revenue",          val:"£1,240", color:"#10B981" },
                    { label:"No-Shows",         val:"0",      color:"#F59E0B" },
                  ].map(s => (
                    <div key={s.label} className="mock-stat">
                      <div className="mock-stat-val" style={{color:s.color}}>{s.val}</div>
                      <div className="mock-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mock-section-title">Today&apos;s Appointments</div>
                {[
                  { time:"09:00", name:"Sarah M.",  service:"Balayage",           staff:"Emma",  status:"confirmed" },
                  { time:"10:00", name:"James T.",  service:"Physio Assessment",  staff:"Dr. K", status:"confirmed" },
                  { time:"11:30", name:"Aisha K.",  service:"Yoga — Beginners",   staff:"Liam",  status:"pending"   },
                  { time:"13:00", name:"Priya S.",  service:"Deep Tissue Massage", staff:"Nina",  status:"confirmed" },
                ].map(a => (
                  <div key={a.time} className="mock-appt">
                    <span className="mock-time">{a.time}</span>
                    <span className="mock-name">{a.name}</span>
                    <span className="mock-service">{a.service}</span>
                    <span className={`mock-badge mock-badge-${a.status}`}>{a.status}</span>
                  </div>
                ))}
                <div className="mock-reminder">
                  <span style={{color:"#25D366",fontSize:12}}>✔</span> WhatsApp reminders sent to 8 clients
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="trust-bar">
        {["No setup fees", "Free 14-day trial", "Cancel anytime", "UK-based support", "Automated appointment reminders"].map(item => (
          <div key={item} className="trust-item">
            <div className="trust-dot"/>
            {item}
          </div>
        ))}
      </section>

      {/* ── Who it's for ── */}
      <section id="who" className="section section-white">
        <div className="section-label">WHO IT&apos;S FOR</div>
        <h2 className="section-title">Built for every Health &amp; Wellbeing business</h2>
        <p className="section-sub">Whether you see 5 or 500 clients a week, Feature gives you one powerful platform to manage it all.</p>
        <div className="features-grid features-grid-v2" style={{marginTop:40}}>
          {industries.map(({ Icon, name, desc }) => (
            <div key={name} className="feature-card feature-card-v2" style={{cursor:"default"}}>
              <div className="feature-icon-v2" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={28} strokeWidth={1.5} color="#C9A24B" />
              </div>
              <h3 style={{fontSize:15,marginBottom:6}}>{name}</h3>
              <p style={{fontSize:13,color:"#aab1c4",margin:0}}>{desc}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:40}}>
          <Link href="/signup" className="btn-primary btn-lg">Start free — no card needed</Link>
        </div>
      </section>

      {/* ── Problem → Solution ── */}
      <section className="section section-ps">
        <div className="section-label">THE PROBLEM</div>
        <h2 className="section-title">Sound familiar?</h2>
        <div className="ps-grid">
          <div className="ps-problems">
            {([
              { Icon: PhoneOff,  text:"Phone ringing during appointments" },
              { Icon: Banknote,  text:"Clients ghosting after no-show" },
              { Icon: BookOpen,  text:"Paper diary causing double bookings" },
              { Icon: CreditCard,text:"Chasing payments manually" },
              { Icon: BellOff,   text:"No automated reminders" },
              { Icon: BarChart3, text:"No idea which services make money" },
            ] as { Icon: LucideIcon; text: string }[]).map(({ Icon, text }) => (
              <div key={text} className="ps-problem-item">
                <span className="ps-icon"><Icon size={18} strokeWidth={1.5} color="#94A3B8" /></span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="ps-arrow">→</div>
          <div className="ps-solution">
            <div className="ps-solution-header">Feature fixes all of this</div>
            {([
              { Icon: Smartphone,     text:"Clients book online 24/7 — you never pick up the phone" },
              { Icon: MessageCircle,  text:"Automated WhatsApp, SMS & email reminders to help reduce no-shows" },
              { Icon: CalendarCheck,  text:"Smart calendar prevents double bookings" },
              { Icon: CreditCard,     text:"Stripe payments collected at booking" },
              { Icon: Zap,            text:"Automated SMS, email & WhatsApp reminders" },
              { Icon: BarChart3,      text:"Revenue reports updated in real-time" },
            ] as { Icon: LucideIcon; text: string }[]).map(({ Icon, text }) => (
              <div key={text} className="ps-solution-item">
                <span className="ps-icon"><Icon size={18} strokeWidth={1.5} color="#C9A24B" /></span>
                <span>{text}</span>
              </div>
            ))}
            <Link href="/signup" className="btn-primary" style={{display:"inline-block",marginTop:20}}>Fix it free for 14 days →</Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section section-white">
        <div className="section-label">WHAT YOU GET</div>
        <h2 className="section-title">Everything your business needs</h2>
        <div className="features-grid features-grid-v2">
          {([
            { Icon: CalendarCheck,  title:"Online Booking System",       desc:"Clients book 24/7 from your branded page. No more missed calls, no more double bookings." },
            { Icon: CalendarClock,  title:"Class & Session Scheduling", desc:"Run group classes, 1-to-1 sessions or both. Waitlists, capacity limits and cancellation policies built in." },
            { Icon: Users,          title:"Staff Management",            desc:"Set hours, assign services, manage holidays and track each team member's performance." },
            { Icon: MessageCircle,  title:"WhatsApp Reminders",          desc:"Send automated WhatsApp, SMS & email reminders — so clients don't forget their appointment." },
            { Icon: CreditCard,     title:"Stripe Payments",             desc:"Take deposits or full payments at booking time. Reduce no-shows and get paid upfront." },
            { Icon: ContactRound,   title:"Client CRM",                  desc:"Every client's visit history, treatment notes and preferences — all in one searchable profile." },
            { Icon: BarChart3,      title:"Revenue Analytics",           desc:"Know your busiest times, top services, and best staff at a glance every morning." },
            { Icon: Smartphone,     title:"Mobile-First Design",         desc:"Your entire business runs from your phone. iOS and Android ready, no app to download." },
          ] as { Icon: LucideIcon; title: string; desc: string }[]).map(({ Icon, title, desc }) => (
            <div key={title} className="feature-card feature-card-v2">
              <div className="feature-icon-v2" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={28} strokeWidth={1.5} color="#C9A24B" />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="section">
        <div className="section-label">HOW IT WORKS</div>
        <h2 className="section-title">Up and running in under 10 minutes</h2>
        <div className="steps steps-v2">
          {([
            { num:"1", Icon: Rocket,   title:"Create your account",       desc:"Sign up free. No credit card needed. Takes 60 seconds." },
            { num:"2", Icon: Settings2, title:"Add services & staff",      desc:"Set your menu, team, and working hours. We guide you through everything." },
            { num:"3", Icon: Share2,   title:"Share your booking link",   desc:"Send it to clients or add it to Instagram bio. Start receiving bookings instantly." },
          ] as { num: string; Icon: LucideIcon; title: string; desc: string }[]).map(({ num, Icon, title, desc }) => (
            <div key={num} className="step step-v2">
              <div className="step-icon" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={24} strokeWidth={1.5} color="#C9A24B" />
              </div>
              <div className="step-num">{num}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
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
        <p className="section-sub">An honest side-by-side comparison</p>
        <div className="compare-table-wrap">
          <table className="compare-table" role="table" aria-label="Feature vs Fresha vs Treatwell comparison">
            <thead>
              <tr>
                <th scope="col">What you need</th>
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
        <div className="fresha-badge"><span>💰</span><span>No commission fees, ever — just one flat monthly price</span></div>
        <div className="pricing-grid">
          <div className="plan-card">
            <div className="plan-name">STARTER</div>
            <div className="plan-price">£29<span>/month</span></div>
            <p className="plan-desc">Perfect for sole practitioners and small teams.</p>
            {["Online booking page","Up to 3 staff","Client profiles","Email reminders","50 messages/month"].map(f => (
              <div key={f} className="plan-feature"><span>✓</span> {f}</div>
            ))}
            <Link href="/signup" className="plan-btn-outline">Start free trial</Link>
          </div>

          <div className="plan-card plan-featured">
            <div className="plan-popular">MOST POPULAR</div>
            <div className="plan-name plan-name-blue">PRO</div>
            <div className="plan-price">£59<span>/month</span></div>
            <p className="plan-desc">For growing businesses that need more power and control.</p>
            {["Everything in Starter","Up to 10 staff","SMS & WhatsApp reminders","Reports & analytics","100 messages/month"].map(f => (
              <div key={f} className="plan-feature"><span>✓</span> {f}</div>
            ))}
            <Link href="/signup" className="plan-btn-filled">Start free trial</Link>
          </div>

          <div className="plan-card">
            <div className="plan-name">BUSINESS</div>
            <div className="plan-price">£99<span>/month</span></div>
            <p className="plan-desc">For multi-location businesses and large teams.</p>
            {["Everything in Pro","Unlimited staff","Priority support","Advanced reports","Unlimited messages"].map(f => (
              <div key={f} className="plan-feature"><span>✓</span> {f}</div>
            ))}
            <Link href="/signup" className="plan-btn-outline">Start free trial</Link>
          </div>
        </div>
      </section>


      {/* ── Location Pages ── */}
      <section id="locations" className="section">
        <div className="section-label">AVAILABLE ACROSS THE UK</div>
        <h2 className="section-title">Available across every UK city</h2>
        <p className="section-sub">Feature is open to any UK health &amp; wellbeing business — wherever you are.</p>
        <div className="locations-grid">
          <Link href="/salons/london" className="location-card">
            <div className="location-icon" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><Building2 size={28} strokeWidth={1.5} color="#C9A24B" /></div>
            <h3>London</h3>
            <p>Salons, spas, gyms &amp; clinics in London</p>
            <span className="location-link">Explore →</span>
          </Link>
          <Link href="/salons/manchester" className="location-card">
            <div className="location-icon" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><Building2 size={28} strokeWidth={1.5} color="#C9A24B" /></div>
            <h3>Manchester</h3>
            <p>Salon software for Manchester businesses</p>
            <span className="location-link">Explore →</span>
          </Link>
          <Link href="/salons/birmingham" className="location-card">
            <div className="location-icon" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><Building2 size={28} strokeWidth={1.5} color="#C9A24B" /></div>
            <h3>Birmingham</h3>
            <p>Salon software for Birmingham businesses</p>
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
        <h2 className="final-cta-title">Start your business transformation today</h2>
        <p className="final-cta-sub">Be among the first UK health &amp; wellbeing businesses to run on Feature. No commission, no contracts, no catch.</p>
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
        <span className="nav-logo footer-logo">feature</span>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/partner">Become a Partner</Link>
          <Link href="/salons/london">London</Link>
          <Link href="/salons/manchester">Manchester</Link>
          <Link href="/salons/birmingham">Birmingham</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign up</Link>
        </nav>
        <span className="footer-copy">© 2025 Feature. Built for Health &amp; Wellbeing businesses across the UK &amp; Europe.</span>
      </footer>

      {/* ── Mobile sticky CTA ── */}
      <div className="mobile-sticky-cta">
        <Link href="/signup" className="mobile-sticky-btn">Start Free Trial — No Card Needed</Link>
      </div>
    </main>
  );
}
