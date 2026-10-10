import { ROUTES } from "@/lib/variables";
import {
  Mic,
  CalendarDays,
  CalendarPlus,
  ChartNoAxesCombined,
  LayoutDashboard,
  LucideIcon,
  MessagesSquare,
  Ticket,
  Wallet,
} from "lucide-react";

export type TVendorNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Locked until the vendor's verification is approved. */
  requiresVerification?: boolean;
};

export const VENDOR_NAV_ITEMS: TVendorNavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD.href, icon: LayoutDashboard },
  {
    label: "Create Event",
    href: ROUTES.CREATE_EVENT.href,
    icon: CalendarPlus,
    requiresVerification: true,
  },
  {
    label: "Listings",
    href: ROUTES.EVENTS.href,
    icon: CalendarDays,
    requiresVerification: true,
  },
  {
    label: ROUTES.PERFORMERS.label,
    href: ROUTES.PERFORMERS.href,
    icon: Mic,
    requiresVerification: true,
  },
  {
    label: "Tickets",
    href: ROUTES.TICKETS.href,
    icon: Ticket,
    requiresVerification: true,
  },
  // Open to everyone: attendees and unverified vendors chat in the groups of events
  // they're going to.
  { label: "Chats", href: ROUTES.MESSAGES.href, icon: MessagesSquare },
  {
    label: "Analysis",
    href: ROUTES.ANALYSIS.href,
    icon: ChartNoAxesCombined,
    requiresVerification: true,
  },
  {
    label: "Wallet",
    href: ROUTES.WALLET.href,
    icon: Wallet,
    requiresVerification: true,
  },
];

export const verificationMessageFor = (item: TVendorNavItem) =>
  `Verify your vendor account to use ${item.label}.`;

// Pages reached from the header rather than the sidebar, named in the breadcrumb.
const HEADER_PAGES = [ROUTES.NOTIFICATIONS, ROUTES.SETTINGS, ROUTES.PROFILE];

const isWithin = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * The dashboard is the parent of every other vendor route, so it only counts as
 * active on its own page; everything else is active for itself and anything under it.
 */
export const isVendorNavItemActive = (
  pathname: string,
  item: TVendorNavItem,
) =>
  item.href === ROUTES.DASHBOARD.href
    ? pathname === item.href
    : isWithin(pathname, item.href);

export const vendorSectionLabel = (pathname: string) =>
  VENDOR_NAV_ITEMS.find((item) => isVendorNavItemActive(pathname, item))
    ?.label ??
  HEADER_PAGES.find((route) => isWithin(pathname, route.href))?.label ??
  "Dashboard";

/**
 * The locked section the path belongs to, if any. Create Event is left out because
 * its own layout already guards it with a create-specific message.
 */
export const lockedVendorSection = (pathname: string) =>
  VENDOR_NAV_ITEMS.find(
    (item) =>
      item.requiresVerification &&
      item.href !== ROUTES.CREATE_EVENT.href &&
      isWithin(pathname, item.href),
  );
