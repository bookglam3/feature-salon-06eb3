/**
 * Global Schema Markup component (JSON-LD)
 * Injected in the root layout on every page.
 * Contains: SoftwareApplication + Organization schemas.
 * FAQPage schema is added separately on the landing page.
 */
export default function SchemaMarkup() {
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Feature Salon",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Salon Management Software",
    operatingSystem: "Web, iOS, Android",
    url: "https://www.featuresalon.co.uk",
    description:
      "UK salon management software with online booking, staff management, automated reminders, and Stripe payments. Free 14-day trial.",
    inLanguage: "en-GB",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "29",
        priceCurrency: "GBP",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "29",
          priceCurrency: "GBP",
          unitCode: "MON",
        },
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "59",
        priceCurrency: "GBP",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "59",
          priceCurrency: "GBP",
          unitCode: "MON",
        },
      },
      {
        "@type": "Offer",
        name: "Business",
        price: "99",
        priceCurrency: "GBP",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "99",
          priceCurrency: "GBP",
          unitCode: "MON",
        },
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "200",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "Online booking system",
      "Staff management",
      "Client profiles",
      "Automated SMS reminders",
      "Automated WhatsApp reminders",
      "Email notifications",
      "Stripe online payments",
      "Revenue reports and analytics",
      "14-day free trial",
    ],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Feature Salon",
    url: "https://www.featuresalon.co.uk",
    logo: "https://www.featuresalon.co.uk/og-image.png",
    description:
      "Feature Salon is the UK's leading salon management software, helping salons manage bookings, staff, payments, and client communications.",
    areaServed: {
      "@type": "Country",
      name: "United Kingdom",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      areaServed: "GB",
      availableLanguage: "English",
    },
    sameAs: [
      "https://twitter.com/featuresalon",
      "https://www.instagram.com/featuresalon",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  );
}
