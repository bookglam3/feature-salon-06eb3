import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  // ── Performance: tree-shake large icon libraries ──
  experimental: {
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      // Supabase storage (all projects)
      { protocol: "https", hostname: "*.supabase.co", pathname: "/**" },
      // Supabase storage alternative domain
      { protocol: "https", hostname: "*.supabase.in", pathname: "/**" },
      // Any HTTPS image (for paste-URL fallback)
      { protocol: "https", hostname: "**" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // ── Performance: tell browser to prefetch DNS early ──
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // Cache static assets for 1 year
        source: "/(.*)\\..(ico|png|jpg|jpeg|svg|webp|avif|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;

