import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

// ─────────────────────────────────────────────────────────────────
// City Data
// ─────────────────────────────────────────────────────────────────
const CITY_DATA: Record<string, {
  name: string;
  region: string;
  emoji: string;
  tagline: string;
  desc: string;
  salonCount: string;
  neighborhoods: string[];
  reviews: { initials: string; name: string; salon: string; text: string }[];
  localNote: string;
}> = {
  london: {
    name: "London",
    region: "Greater London",
    emoji: "🏙️",
    tagline: "Built for the pace of London",
    desc: "Hundreds of London hair salons, beauty salons, and barbershops use Feature to manage bookings, staff, and payments — without Fresha's hidden commission fees.",
    salonCount: "200+",
    neighborhoods: ["Shoreditch", "Brixton", "Canary Wharf", "Chelsea", "Notting Hill"],
    reviews: [
      { initials: "RA", name: "Rania A.", salon: "Aura Hair & Beauty · Shoreditch", text: "The automated WhatsApp reminders are a game changer. Setup took less than 20 minutes and our booking page looks incredibly professional." },
      { initials: "MC", name: "Marcus C.", salon: "The Cut Room · Brixton", text: "We switched from Fresha 6 months ago and haven't looked back. Feature is simpler, faster, and we're saving over £80/month in fees." },
    ],
    localNote: "Feature is trusted by salons from Shoreditch to Chelsea — helping London's busiest salons cut no-shows by 60%.",
  },
  manchester: {
    name: "Manchester",
    region: "Greater Manchester",
    emoji: "🌆",
    tagline: "Powering Manchester's fastest-growing salons",
    desc: "Manchester hair salons, beauty studios, and barbers rely on Feature to automate bookings, reminders, and payments — all from one dashboard.",
    salonCount: "80+",
    neighborhoods: ["Northern Quarter", "Didsbury", "Deansgate", "Chorlton", "Salford"],
    reviews: [
      { initials: "SB", name: "Sarah B.", salon: "Studio Bloom · Northern Quarter", text: "Feature replaced three different apps we were using. Bookings, reminders, payments — all in one place. Our no-show rate dropped by half." },
      { initials: "AT", name: "Amy T.", salon: "Luxe Hair Studio · Didsbury", text: "I was sceptical but within a week my clients were booking online at midnight. The reminders alone are worth every penny." },
    ],
    localNote: "From the Northern Quarter to Didsbury, Feature helps Manchester salons fill their chairs and reduce no-shows.",
  },
  birmingham: {
    name: "Birmingham",
    region: "West Midlands",
    emoji: "🏘️",
    tagline: "Trusted by Birmingham's top hair & beauty salons",
    desc: "Birmingham salons use Feature to replace Treatwell and Fresha — keeping 100% of their revenue with zero marketplace commission.",
    salonCount: "60+",
    neighborhoods: ["Jewellery Quarter", "Moseley", "Edgbaston", "Digbeth", "Harborne"],
    reviews: [
      { initials: "JT", name: "James T.", salon: "The Barber Collective · Jewellery Quarter", text: "I was paying Fresha nearly £150 a month with hidden fees. Feature costs me £59, does everything Fresha does, and support actually replies." },
      { initials: "PK", name: "Priya K.", salon: "Glam & Co · Moseley", text: "Setting up took 10 minutes. My clients love the online booking page and I love not paying commission on every appointment." },
    ],
    localNote: "Birmingham's independent salons are switching from Fresha and Treatwell to Feature — saving an average of £80/month.",
  },
  leeds: {
    name: "Leeds",
    region: "West Yorkshire",
    emoji: "🏛️",
    tagline: "The salon software Leeds has been waiting for",
    desc: "Leeds salons choose Feature for its flat-rate pricing, zero commission, and powerful automated reminders that keep clients coming back.",
    salonCount: "50+",
    neighborhoods: ["Chapel Allerton", "Headingley", "Roundhay", "Leeds City Centre", "Horsforth"],
    reviews: [
      { initials: "NK", name: "Nadia K.", salon: "Luxe Beauty Lounge · Chapel Allerton", text: "Managing 8 staff members used to be a nightmare. Now I can see everyone's schedule, block off holidays, and track revenue from my phone." },
      { initials: "CW", name: "Claire W.", salon: "The Beauty Room · Headingley", text: "Our no-show rate went from 20% to under 5% in the first month. The WhatsApp reminders are absolutely brilliant." },
    ],
    localNote: "Leeds salons from Headingley to the city centre are automating their bookings with Feature.",
  },
  edinburgh: {
    name: "Edinburgh",
    region: "Scotland",
    emoji: "🏰",
    tagline: "Scotland's favourite salon booking software",
    desc: "Edinburgh salons use Feature to manage bookings year-round — from festival season spikes to quiet January weeks — with smart scheduling and automated reminders.",
    salonCount: "40+",
    neighborhoods: ["New Town", "Old Town", "Leith", "Morningside", "Stockbridge"],
    reviews: [
      { initials: "FM", name: "Fiona M.", salon: "The Mane Event · New Town", text: "During the Fringe we're fully booked weeks in advance. Feature handles it all seamlessly — clients can book 24/7 without calling us." },
      { initials: "DS", name: "David S.", salon: "Sharp & Clean Barbers · Leith", text: "I tried Fresha for 6 months. Switched to Feature and cut my software costs in half with better features." },
    ],
    localNote: "From the Royal Mile to Morningside, Edinburgh salons trust Feature to handle their busiest days automatically.",
  },
  glasgow: {
    name: "Glasgow",
    region: "Scotland",
    emoji: "🌉",
    tagline: "Glasgow salons deserve better software",
    desc: "Glasgow's thriving salon scene uses Feature to automate bookings, cut no-shows with WhatsApp reminders, and take Stripe payments — all with no marketplace fees.",
    salonCount: "45+",
    neighborhoods: ["West End", "Merchant City", "Southside", "Finnieston", "Shawlands"],
    reviews: [
      { initials: "LM", name: "Laura M.", salon: "Velvet Hair Studio · Finnieston", text: "Feature is the most straightforward salon software I've used. No bloat, just the essentials — and the reminders are fantastic." },
      { initials: "RG", name: "Ryan G.", salon: "Blade & Burn Barbershop · Merchant City", text: "My clients are booking online now instead of calling. It's freed up so much of my time. Worth every penny." },
    ],
    localNote: "Glasgow's independent salons and barbershops are growing faster with Feature's zero-commission booking system.",
  },
  bristol: {
    name: "Bristol",
    region: "South West England",
    emoji: "🌉",
    tagline: "Bristol's most-loved salon management software",
    desc: "Bristol salons, beauty studios, and barbershops use Feature to book clients online, send automatic reminders, and grow revenue — without Fresha's fees.",
    salonCount: "35+",
    neighborhoods: ["Clifton", "Stokes Croft", "Bedminster", "Bishopston", "Redland"],
    reviews: [
      { initials: "HB", name: "Holly B.", salon: "Bloom Hair · Clifton", text: "I went from 15 no-shows per month to 2. The automated reminders changed everything. My revenue has increased noticeably." },
      { initials: "TN", name: "Tom N.", salon: "The Faded Barber · Stokes Croft", text: "Really easy to set up and my clients love the booking page. Looks far more professional than anything else I've tried." },
    ],
    localNote: "From Clifton to Stokes Croft, Bristol's creative salon community relies on Feature for modern booking management.",
  },
  sheffield: {
    name: "Sheffield",
    region: "South Yorkshire",
    emoji: "⚙️",
    tagline: "Sheffield salon software that actually works",
    desc: "Sheffield salons use Feature to replace their paper diary, automate reminders, and take online payments — at a fraction of the cost of Fresha or Treatwell.",
    salonCount: "30+",
    neighborhoods: ["Ecclesall Road", "Broomhill", "Kelham Island", "Hillsborough", "Abbeydale"],
    reviews: [
      { initials: "SP", name: "Sophie P.", salon: "Steel City Salon · Ecclesall Road", text: "Feature is the reason I stopped answering calls at 9pm. Clients book themselves, get automatic reminders, and I get my evenings back." },
      { initials: "MH", name: "Mike H.", salon: "The Barber Quarter · Kelham Island", text: "Switched from a paper diary to Feature in one afternoon. Best business decision I've made this year." },
    ],
    localNote: "Sheffield's independent salons on Ecclesall Road and across the city are modernising with Feature.",
  },
  liverpool: {
    name: "Liverpool",
    region: "Merseyside",
    emoji: "🎵",
    tagline: "Liverpool's #1 choice for salon software",
    desc: "Liverpool salons trust Feature for online booking, automated WhatsApp reminders, and Stripe payments — with no commissions and no hidden fees.",
    salonCount: "40+",
    neighborhoods: ["Bold Street", "Allerton", "Woolton", "Aigburth", "Crosby"],
    reviews: [
      { initials: "KR", name: "Kelly R.", salon: "Gloss Hair Studio · Bold Street", text: "Our clients absolutely love being able to book online at any time. The WhatsApp reminders have slashed our no-show rate dramatically." },
      { initials: "JH", name: "Jay H.", salon: "The Fade Factory · Allerton", text: "I used to lose track of appointments all the time. Feature made everything so much cleaner. The dashboard is brilliant." },
    ],
    localNote: "From Bold Street to Allerton, Liverpool salons are automating their operations with Feature.",
  },
  nottingham: {
    name: "Nottingham",
    region: "East Midlands",
    emoji: "🏹",
    tagline: "Nottingham salons, meet your perfect software",
    desc: "Nottingham salons and beauty studios use Feature to manage bookings online, send automated reminders, and grow their client base — all for a flat monthly fee.",
    salonCount: "25+",
    neighborhoods: ["Hockley", "West Bridgford", "Beeston", "Arnold", "Mapperley"],
    reviews: [
      { initials: "ZA", name: "Zara A.", salon: "The Styling Suite · Hockley", text: "Feature is the simplest, cleanest salon software I've used. My clients can book from Instagram and I get a notification instantly." },
      { initials: "BL", name: "Ben L.", salon: "Cuts & Co · West Bridgford", text: "I was using WhatsApp to manage bookings manually. Feature saved me hours every week and my clients love the professional experience." },
    ],
    localNote: "Nottingham's growing salon community from Hockley to West Bridgford is choosing Feature over outdated alternatives.",
  },
};

const ALL_CITIES = Object.keys(CITY_DATA);

// ─────────────────────────────────────────────────────────────────
// generateStaticParams — pre-render all 10 city pages
// ─────────────────────────────────────────────────────────────────
export function generateStaticParams() {
  return ALL_CITIES.map((city) => ({ city }));
}

// ─────────────────────────────────────────────────────────────────
// generateMetadata — unique title + description per city
// ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const data = CITY_DATA[city];
  if (!data) return {};

  return {
    title: `Best Salon Software in ${data.name} | Feature Salon`,
    description: `Feature Salon is the best salon management software for ${data.name} salons. Online bookings, WhatsApp reminders, Stripe payments. No commission fees. Free 14-day trial.`,
    keywords: [
      `salon software ${data.name.toLowerCase()}`,
      `${data.name.toLowerCase()} salon booking system`,
      `fresha alternative ${data.name.toLowerCase()}`,
      `salon management ${data.name.toLowerCase()}`,
      `beauty salon software ${data.name.toLowerCase()}`,
    ],
    alternates: {
      canonical: `https://www.featuresalon.co.uk/salons/${city}`,
    },
    openGraph: {
      title: `Best Salon Software in ${data.name} | Feature Salon`,
      description: `The best salon software for ${data.name} salons. Online bookings, automated reminders, Stripe payments — with zero commission fees.`,
      url: `https://www.featuresalon.co.uk/salons/${city}`,
      locale: "en_GB",
      type: "website",
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────
export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const data = CITY_DATA[city];
  if (!data) notFound();

  const BASE = "https://www.featuresalon.co.uk";
  const pageUrl = `${BASE}/salons/${city}`;

  // ── LocalBusiness Schema ────────────────────────────────────
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${pageUrl}#software`,
    name: "Feature Salon",
    description: `Feature Salon is the leading salon management software for ${data.name} salons. Online bookings, automated WhatsApp & SMS reminders, Stripe payments — with zero commission fees.`,
    url: BASE,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "29",
      priceCurrency: "GBP",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "200",
      bestRating: "5",
    },
    areaServed: {
      "@type": "City",
      name: data.name,
      "@id": `https://www.wikidata.org/wiki/${data.name}`,
    },
  };

  // ── BreadcrumbList Schema ───────────────────────────────────
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "UK Salon Locations",
        item: `${BASE}/salons`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${data.name} Salons`,
        item: pageUrl,
      },
    ],
  };

  // Other cities for internal linking (exclude current)
  const otherCities = ALL_CITIES.filter((c) => c !== city).slice(0, 6);

  return (
    <main className="landing">
      {/* Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ── Nav ── */}
      <nav className="nav">
        <Link href="/" className="nav-logo">feature</Link>
        <div className="nav-links">
          <Link href="/#features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Login</Link>
          <Link href="/signup" className="btn-primary">Start free trial</Link>
        </div>
        <Link href="/signup" className="btn-primary mobile-nav-cta">Start free trial</Link>
      </nav>

      {/* ── Breadcrumb ── */}
      <div style={{ padding: "12px 24px", maxWidth: 1100, margin: "0 auto", fontSize: 13, color: "#94A3B8" }}>
        <Link href="/" style={{ color: "#6366F1", textDecoration: "none" }}>Home</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span style={{ color: "#94A3B8" }}>UK Cities</span>
        <span style={{ margin: "0 8px" }}>›</span>
        <span style={{ color: "#0F172A", fontWeight: 600 }}>{data.name}</span>
      </div>

      {/* ── Hero ── */}
      <section className="hero hero-v2">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">{data.emoji} {data.name.toUpperCase()} SALONS</div>
            <h1 className="hero-title">Salon Software for {data.name} Salons</h1>
            <p className="hero-sub">{data.desc}</p>
            <div className="hero-btns">
              <Link href="/signup" className="btn-primary btn-lg">Start Free 14-Day Trial</Link>
              <Link href="/pricing" className="btn-secondary btn-lg">View pricing</Link>
            </div>
            <div className="hero-trust">
              {["No commission fees", "Free 14-day trial", "Cancel anytime", "UK-based support"].map((t) => (
                <span key={t} className="hero-trust-item">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="#ECFDF5"/>
                    <path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="trust-bar">
        {["No commission fees", `${data.salonCount} ${data.name} salons`, "Free 14-day trial", "Cancel anytime", "UK-based support"].map((item) => (
          <div key={item} className="trust-item"><div className="trust-dot" />{item}</div>
        ))}
      </section>

      {/* ── Local note ── */}
      <section className="section section-white">
        <div className="section-label">WHY {data.name.toUpperCase()} SALONS CHOOSE FEATURE</div>
        <h2 className="section-title">{data.tagline}</h2>
        <p style={{ maxWidth: 640, margin: "0 auto 32px", fontSize: 16, color: "#64748B", lineHeight: 1.7, textAlign: "center" }}>
          {data.localNote}
        </p>

        <div className="features-grid features-grid-v2">
          {[
            { icon: "📲", title: "Online Booking 24/7", desc: `${data.name} clients expect to book at any time. Feature gives every salon a beautiful, mobile-first booking page.` },
            { icon: "💬", title: "WhatsApp & SMS Reminders", desc: `Reduce no-shows with automated reminders via WhatsApp, SMS, and email — personalised for every ${data.name} salon.` },
            { icon: "💷", title: "No Commission Fees", desc: "Feature charges a flat monthly fee. No per-booking commissions, no payment processing markups — ever." },
            { icon: "👥", title: "Multi-Staff Scheduling", desc: `Manage your entire ${data.name} salon team's calendars, breaks, and holidays from one clean dashboard.` },
            { icon: "💳", title: "Stripe Online Payments", desc: "Take deposits or full payments online via Stripe. Reduce no-shows and get paid before clients arrive." },
            { icon: "📊", title: "Revenue Analytics", desc: `Track your busiest days, top services, and best staff members — specific to your ${data.name} salon.` },
          ].map((f) => (
            <div key={f.title} className="feature-card feature-card-v2">
              <div className="feature-icon-v2">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Neighbourhoods ── */}
      <section className="section">
        <div className="section-label">AREAS WE SERVE</div>
        <h2 className="section-title">Feature Salon across {data.name}</h2>
        <p style={{ textAlign: "center", color: "#64748B", marginBottom: 32 }}>
          Feature is used by salons across {data.region}, including:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 700, margin: "0 auto 40px" }}>
          {data.neighborhoods.map((n) => (
            <span key={n} style={{
              padding: "10px 20px", background: "#EEF2FF", color: "#4338CA",
              borderRadius: 999, fontSize: 14, fontWeight: 600,
            }}>
              📍 {n}
            </span>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <Link href="/signup" className="btn-primary btn-lg">Start your free trial →</Link>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="section section-white">
        <div className="section-label">{data.name.toUpperCase()} SALON OWNERS SAY</div>
        <h2 className="section-title">Trusted by {data.name} salons</h2>
        <div className="reviews-grid">
          {data.reviews.map((r, i) => (
            <div key={r.name} className={`review-card${i === 1 ? " review-card-featured" : ""}`}>
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
      </section>

      {/* ── Pricing CTA ── */}
      <section className="section">
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div className="section-label">PRICING</div>
          <h2 className="section-title">Simple pricing for {data.name} salons</h2>
          <p style={{ color: "#64748B", marginBottom: 32, fontSize: 16 }}>
            From £29/month — no contracts, no hidden fees, no commission on bookings.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            {[
              { plan: "Starter", price: "£29", features: ["3 staff", "Online booking", "Email reminders"] },
              { plan: "Pro", price: "£59", features: ["10 staff", "SMS + WhatsApp", "Revenue reports"], featured: true },
              { plan: "Business", price: "£99", features: ["Unlimited staff", "Priority support", "Multi-location"] },
            ].map((p) => (
              <div key={p.plan} style={{
                padding: "24px 20px", borderRadius: 16,
                border: p.featured ? "2px solid #6366F1" : "1.5px solid #E2E8F0",
                background: p.featured ? "#EEF2FF" : "#fff",
                minWidth: 160, textAlign: "center",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1", marginBottom: 8, textTransform: "uppercase" }}>{p.plan}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>{p.price}<span style={{ fontSize: 13, fontWeight: 400, color: "#94A3B8" }}>/mo</span></div>
                {p.features.map((f) => (
                  <div key={f} style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>✓ {f}</div>
                ))}
              </div>
            ))}
          </div>
          <Link href="/signup" className="btn-primary btn-lg">Start free 14-day trial →</Link>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 12 }}>No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="section final-cta">
        <h2 className="final-cta-title">Ready to grow your {data.name} salon?</h2>
        <p className="final-cta-sub">
          Join {data.salonCount} {data.name} salons using Feature to automate bookings, cut no-shows, and grow revenue.
        </p>
        <Link href="/signup" className="btn-primary btn-lg btn-glow">Start Free 14-Day Trial →</Link>
        <div className="final-cta-trust">
          <span>No credit card required</span><span>·</span>
          <span>Cancel anytime</span><span>·</span>
          <span>UK support</span>
        </div>
      </section>

      {/* ── Other city pages ── */}
      <section className="section section-white">
        <div className="section-label">OTHER UK CITIES</div>
        <h2 className="section-title" style={{ marginBottom: 24 }}>Salon software across the UK</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {otherCities.map((c) => (
            <Link key={c} href={`/salons/${c}`} style={{
              padding: "10px 20px", background: "#F1F5F9", color: "#475569",
              borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600,
              border: "1.5px solid #E2E8F0", transition: "all 0.15s",
            }}>
              {CITY_DATA[c].emoji} {CITY_DATA[c].name}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <Link href="/" className="nav-logo footer-logo">feature</Link>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/signup">Sign up</Link>
          {otherCities.slice(0, 4).map((c) => (
            <Link key={c} href={`/salons/${c}`}>{CITY_DATA[c].name}</Link>
          ))}
        </nav>
        <span className="footer-copy">© 2025 Feature. Built for salons across the UK.</span>
      </footer>
    </main>
  );
}
