import { ROUTES } from "@/lib/variables";
import {
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
};

export const VENDOR_NAV_ITEMS: TVendorNavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD.href, icon: LayoutDashboard },
  { label: "Create Event", href: ROUTES.CREATE_EVENT.href, icon: CalendarPlus },
  { label: "Listings", href: ROUTES.EVENTS.href, icon: CalendarDays },
  { label: "Tickets", href: ROUTES.TICKETS.href, icon: Ticket },
  { label: "Chats", href: ROUTES.MESSAGES.href, icon: MessagesSquare },
  { label: "Analysis", href: ROUTES.ANALYSIS.href, icon: ChartNoAxesCombined },
  { label: "Wallet", href: ROUTES.WALLET.href, icon: Wallet },
];

// Pages reached from the header rather than the sidebar, named in the breadcrumb.
const HEADER_PAGES = [ROUTES.NOTIFICATIONS, ROUTES.SETTINGS, ROUTES.PROFILE];

const isWithin = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * The dashboard is the parent of every other vendor route, so it only counts as
 * active on its own page; everything else is active for itself and anything under it.
 */
export const isVendorNavItemActive = (pathname: string, item: TVendorNavItem) =>
  item.href === ROUTES.DASHBOARD.href
    ? pathname === item.href
    : isWithin(pathname, item.href);

export const vendorSectionLabel = (pathname: string) =>
  VENDOR_NAV_ITEMS.find((item) => isVendorNavItemActive(pathname, item))
    ?.label ??
  HEADER_PAGES.find((route) => isWithin(pathname, route.href))?.label ??
  "Dashboard";
