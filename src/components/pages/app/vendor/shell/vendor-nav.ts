import { ROUTES } from "@/lib/variables";
import { TVendorPermission } from "@/stores/workspace-store";
import {
  ScanLine,
  UsersRound,
  Mic,
  CalendarDays,
  CalendarPlus,
  ChartNoAxesCombined,
  LayoutDashboard,
  MapPin,
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
  /**
   * For a team member: any one of these shows the item. Left out, every member
   * sees it; an empty list means the account owner only.
   */
  permissions?: TVendorPermission[];
  /** A count beside it of what's waiting: unread chats or bookings to approve. */
  badge?: "chats" | "approvals";
};

export const VENDOR_NAV_ITEMS: TVendorNavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD.href, icon: LayoutDashboard },
  {
    label: "Create Event",
    href: ROUTES.CREATE_EVENT.href,
    icon: CalendarPlus,
    requiresVerification: true,
    permissions: ["EVENTS_MANAGE"],
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
    permissions: ["EVENTS_MANAGE"],
  },
  {
    label: ROUTES.VENUES.label,
    href: ROUTES.VENUES.href,
    icon: MapPin,
    requiresVerification: true,
    permissions: ["EVENTS_MANAGE"],
  },
  {
    label: ROUTES.SCAN_TICKETS.label,
    href: ROUTES.SCAN_TICKETS.href,
    icon: ScanLine,
    requiresVerification: true,
    permissions: ["TICKETS_SCAN"],
  },
  {
    label: "Tickets",
    href: ROUTES.TICKETS.href,
    icon: Ticket,
    requiresVerification: true,
    permissions: ["SALES_VIEW", "SCANNERS_MANAGE", "REGISTRATIONS_REVIEW"],
    badge: "approvals",
  },
  // Open to everyone: attendees and unverified vendors chat in the groups of events
  // they're going to.
  {
    label: "Chats",
    href: ROUTES.MESSAGES.href,
    icon: MessagesSquare,
    badge: "chats",
  },
  {
    label: "Analysis",
    href: ROUTES.ANALYSIS.href,
    icon: ChartNoAxesCombined,
    requiresVerification: true,
    permissions: ["SALES_VIEW"],
  },
  {
    label: "Wallet",
    href: ROUTES.WALLET.href,
    icon: Wallet,
    requiresVerification: true,
    permissions: ["FINANCE_VIEW"],
  },
  {
    label: ROUTES.TEAM.label,
    href: ROUTES.TEAM.href,
    icon: UsersRound,
    requiresVerification: true,
    permissions: [],
  },
];

/** The items a team member with `permissions` gets; an owner (null) gets all. */
export const navItemsFor = (permissions: TVendorPermission[] | null) =>
  permissions
    ? VENDOR_NAV_ITEMS.filter(
        (item) =>
          !item.permissions ||
          item.permissions.some((permission) =>
            permissions.includes(permission),
          ),
      )
    : VENDOR_NAV_ITEMS;

/** The nav item a path belongs to, for keeping a team member out of the rest. */
export const vendorNavItemFor = (pathname: string) =>
  VENDOR_NAV_ITEMS.find(
    (item) =>
      item.href !== ROUTES.DASHBOARD.href && isWithin(pathname, item.href),
  );

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
