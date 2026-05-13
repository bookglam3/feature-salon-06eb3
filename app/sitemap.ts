import { MetadataRoute } from "next";

const BASE_URL = "https://www.featuresalon.co.uk";

const CITIES = [
  { slug: "london",       priority: 0.9 },
  { slug: "manchester",   priority: 0.8 },
  { slug: "birmingham",   priority: 0.8 },
  { slug: "leeds",        priority: 0.8 },
  { slug: "edinburgh",    priority: 0.8 },
  { slug: "glasgow",      priority: 0.8 },
  { slug: "bristol",      priority: 0.8 },
  { slug: "sheffield",    priority: 0.75 },
  { slug: "liverpool",    priority: 0.75 },
  { slug: "nottingham",   priority: 0.75 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const cityPages: MetadataRoute.Sitemap = CITIES.map(({ slug, priority }) => ({
    url: `${BASE_URL}/salons/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority,
  }));

  return [
    { url: BASE_URL,                  lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/pricing`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/signup`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/partner`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/login`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    ...cityPages,
  ];
}
