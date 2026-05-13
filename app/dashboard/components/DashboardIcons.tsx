"use client";

/**
 * DashboardIcons — Lucide React based icon components
 * Each icon is a separate component with:
 * - size prop (default 18)
 * - className prop for Tailwind
 * - Dark mode compatible (inherits currentColor)
 */

import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Clock,
  Users,
  UserCheck,
  CreditCard,
  Coins,
  FileText,
  BarChart3,
  Gift,
  Star,
  Heart,
  Share2,
  Megaphone,
  Zap,
  Globe,
  ImageIcon,
  CalendarX,
  Settings2,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Base icon wrapper — shared props
// ─────────────────────────────────────────────────────────────────
type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function makeIcon(LucideIcon: React.FC<LucideProps>) {
  const Comp = ({ size = 18, className = "", strokeWidth = 1.6 }: IconProps) => (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    />
  );
  Comp.displayName = LucideIcon.displayName;
  return Comp;
}

// ─────────────────────────────────────────────────────────────────
// Individual icon exports — one per nav item
// ─────────────────────────────────────────────────────────────────
export const DashboardIcon    = makeIcon(LayoutDashboard);
export const CalendarIcon     = makeIcon(CalendarDays);
export const BookingsIcon     = makeIcon(ClipboardList);
export const WaitlistIcon     = makeIcon(Clock);
export const ClientsIcon      = makeIcon(Users);
export const StaffIcon        = makeIcon(UserCheck);
export const PaymentsIcon     = makeIcon(CreditCard);
export const TipsIcon         = makeIcon(Coins);
export const InvoicesIcon     = makeIcon(FileText);
export const ReportsIcon      = makeIcon(BarChart3);
export const GiftCardsIcon    = makeIcon(Gift);
export const ReviewsIcon      = makeIcon(Star);
export const LoyaltyIcon      = makeIcon(Heart);
export const ReferralsIcon    = makeIcon(Share2);
export const BroadcastIcon    = makeIcon(Megaphone);
export const AutomationsIcon  = makeIcon(Zap);
export const ClientPortalIcon = makeIcon(Globe);
export const GalleryIcon      = makeIcon(ImageIcon);
export const ClosedDatesIcon  = makeIcon(CalendarX);
export const SettingsIcon     = makeIcon(Settings2);

// ─────────────────────────────────────────────────────────────────
// Icon map — for dynamic lookup by nav label
// ─────────────────────────────────────────────────────────────────
export const NAV_ICON_MAP: Record<string, React.FC<IconProps>> = {
  "Dashboard":     DashboardIcon,
  "Calendar":      CalendarIcon,
  "Bookings":      BookingsIcon,
  "Waitlist":      WaitlistIcon,
  "Clients":       ClientsIcon,
  "Staff":         StaffIcon,
  "Payments":      PaymentsIcon,
  "Tips":          TipsIcon,
  "Invoices":      InvoicesIcon,
  "Reports":       ReportsIcon,
  "Gift Cards":    GiftCardsIcon,
  "Reviews":       ReviewsIcon,
  "Loyalty":       LoyaltyIcon,
  "Referrals":     ReferralsIcon,
  "Broadcast":     BroadcastIcon,
  "Automations":   AutomationsIcon,
  "Client Portal": ClientPortalIcon,
  "Gallery":       GalleryIcon,
  "Closed Dates":  ClosedDatesIcon,
  "Settings":      SettingsIcon,
};
