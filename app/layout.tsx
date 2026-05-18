import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SchemaMarkup from "./components/SchemaMarkup";
import WhatsAppWidget from "./components/WhatsAppWidget";

// next/font/google — self-hosted, zero layout shift, no external request
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

const BASE_URL = "https://www.featuresalon.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  verification: {
    google: "CIqk72hycnLUlX0LS-M6tuB2wbeCD6dwf8jColbtyp4",
  },
  title: {
    default: "Feature Salon | UK's #1 Salon Management Software",
    template: "%s | Feature Salon",
  },
  description:
    "Free salon booking software for UK salons. Online bookings, payments, reminders. Better than Fresha. Start free trial.",
  keywords: [
    "salon software uk",
    "salon booking system",
    "fresha alternative",
    "salon management software",
    "uk salon app",
    "online salon booking",
    "salon scheduling software",
    "treatwell alternative",
    "salon crm uk",
    "beauty salon software",
  ],
  authors: [{ name: "Feature Salon", url: BASE_URL }],
  creator: "Feature Salon",
  publisher: "Feature Salon",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: BASE_URL,
    siteName: "Feature Salon",
    title: "Feature Salon | UK's #1 Salon Management Software",
    description:
      "Free salon booking software for UK salons. Online bookings, payments, reminders. Better than Fresha. Start free trial.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Feature Salon — UK's #1 Salon Management Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feature Salon | UK's #1 Salon Management Software",
    description:
      "Free salon booking software for UK salons. Online bookings, payments, reminders. Better than Fresha.",
    images: ["/og-image.png"],
    creator: "@featuresalon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* SVG favicon — crisp at all sizes, tiny file vs 905KB PNG */}
        <link rel="icon" href="/brand/favicon.svg" type="image/svg+xml" />
        {/* PNG fallback for older browsers */}
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Feature" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="geo.region" content="GB" />
        <meta name="geo.placename" content="United Kingdom" />
        {/* DNS prefetch for fast API calls */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <SchemaMarkup />
        {children}
        <WhatsAppWidget />
      </body>
    </html>
  );
}