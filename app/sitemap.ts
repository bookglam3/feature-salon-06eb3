import { MetadataRoute } from "next";

// ─────────────────────────────────────────────────────────────────
// Feature Salon — Dynamic Sitemap
// Covers: homepage, core pages, blog (5 posts), city pages (10)
// ─────────────────────────────────────────────────────────────────
const BASE_URL = "https://www.featuresalon.co.uk";

// Blog post slugs — add new posts here
const BLOG_POSTS: { slug: string; date: string; priority: number }[] = [
  { slug: "how-to-reduce-no-shows-salon",           date: "2025-03-10", priority: 0.85 },
  { slug: "fresha-alternative-uk-2025",             date: "2025-02-14", priority: 0.9  },
  { slug: "best-salon-software-uk-2025",            date: "2025-01-20", priority: 0.9  },
  { slug: "how-to-get-more-salon-bookings-online",  date: "2025-04-05", priority: 0.8  },
  { slug: "treatwell-vs-feature-salon",             date: "2025-03-28", priority: 0.85 },
];

// City pages — add new cities here
const CITY_PAGES: { slug: string; priority: number }[] = [
  { slug: "london",       priority: 0.9  },
  { slug: "manchester",   priority: 0.85 },
  { slug: "birmingham",   priority: 0.85 },
  { slug: "leeds",        priority: 0.8  },
  { slug: "edinburgh",    priority: 0.8  },
  { slug: "glasgow",      priority: 0.8  },
  { slug: "bristol",      priority: 0.8  },
  { slug: "sheffield",    priority: 0.75 },
  { slug: "liverpool",    priority: 0.75 },
  { slug: "nottingham",   priority: 0.75 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // ── Core pages ───────────────────────────────────────────────
  const corePages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date("2025-05-01"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date("2025-05-01"),
      changeFrequency: "monthly",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date("2025-04-01"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/partner`,
      lastModified: new Date("2025-04-01"),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // ── Blog pages ───────────────────────────────────────────────
  const blogIndex: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date("2025-05-01"),
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];

  const blogPostPages: MetadataRoute.Sitemap = BLOG_POSTS.map(({ slug, date, priority }) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(date),
    changeFrequency: "monthly" as const,
    priority,
  }));

  // ── City pages ───────────────────────────────────────────────
  const cityPages: MetadataRoute.Sitemap = CITY_PAGES.map(({ slug, priority }) => ({
    url: `${BASE_URL}/salons/${slug}`,
    lastModified: new Date("2025-05-01"),
    changeFrequency: "monthly" as const,
    priority,
  }));

  return [
    ...corePages,
    ...blogIndex,
    ...blogPostPages,
    ...cityPages,
  ];
}
