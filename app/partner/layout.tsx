import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Partner | Feature Salon",
  description: "Join the Feature partner program. Help salons grow and earn commission on every successful signup.",
  openGraph: {
    title: "Become a Feature Partner",
    description: "Help salons grow with Feature and earn commission on every successful signup.",
  },
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
