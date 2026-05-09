import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SchemaMarkup from "./components/SchemaMarkup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://www.featuresalon.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  verification: {
    google: "CIqk72hycnLUIX0l",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F6EF7" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Feature" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="geo.region" content="GB" />
        <meta name="geo.placename" content="United Kingdom" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <SchemaMarkup />
        {children}
      </body>
    </html>
  );
}