import { ROUTES } from "@/lib/variables";
import {
  BadgeCheck,
  LayoutDashboard,
  LucideIcon,
  MapPin,
  Tags,
  Users,
} from "lucide-react";

export type TAdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Other routes that belong to this section, such as its create form. */
  alsoActiveOn?: string[];
  /** Shows the count of applications waiting for a decision. */
  showsPendingVerifications?: boolean;
};

export type TAdminNavGroup = { label: string; items: TAdminNavItem[] };

export const ADMIN_NAV_GROUPS: TAdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: ROUTES.ADMIN_OVERVIEW.label,
        href: ROUTES.ADMIN_OVERVIEW.href,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: ROUTES.ADMIN_USERS.label,
        href: ROUTES.ADMIN_USERS.href,
        icon: Users,
      },
      {
        label: ROUTES.ADMIN_VERIFICATIONS.label,
        href: ROUTES.ADMIN_VERIFICATIONS.href,
        icon: BadgeCheck,
        showsPendingVerifications: true,
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        label: ROUTES.VENUES.label,
        href: ROUTES.VENUES.href,
        icon: MapPin,
        alsoActiveOn: [ROUTES.CREATE_VENUE.href],
      },
      {
        label: ROUTES.CATEGORIES.label,
        href: ROUTES.CATEGORIES.href,
        icon: Tags,
        alsoActiveOn: [ROUTES.CREATE_CATEGORY.href],
      },
    ],
  },
];

const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

const isWithin = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * Overview is the parent of every other admin route, so it only counts as active on
 * its own page; everything else is active for itself and anything nested under it.
 */
export const isAdminNavItemActive = (pathname: string, item: TAdminNavItem) => {
  if (item.href === ROUTES.ADMIN_OVERVIEW.href) {
    return pathname === item.href;
  }
  return [item.href, ...(item.alsoActiveOn ?? [])].some((href) =>
    isWithin(pathname, href),
  );
};

export const adminSectionLabel = (pathname: string) =>
  ADMIN_NAV_ITEMS.find((item) => isAdminNavItemActive(pathname, item))?.label ??
  "Admin";
