import { ROUTES } from "@/lib/variables";
import { EUserRoles } from "@/stores/user-store";
import {
  CalendarPlus,
  ChartNoAxesCombined,
  CircleHelp,
  Heart,
  LayoutDashboard,
  LucideIcon,
  MessagesSquare,
  ShieldCheck,
  Settings,
  ShoppingBag,
  Store,
  Ticket,
  TicketCheck,
  User,
  Wallet,
} from "lucide-react";

export type TAccountLink = { label: string; href: string; icon: LucideIcon };

export type TAccountNav = {
  /** Shown in the header beside Explore and Contact Us. */
  headerLinks: TAccountLink[];
  /** The highlighted button in the header and at the foot of the mobile menu. */
  cta: TAccountLink;
  /** The account menu, one group per separator. */
  menuGroups: TAccountLink[][];
};

// Tickets and orders the person holds as an attendee; every role can buy tickets.
const myTickets: TAccountLink = {
  label: "My Tickets",
  href: ROUTES.PROFILE_TICKETS.href,
  icon: Ticket,
};
const myOrders: TAccountLink = {
  label: "Orders",
  href: ROUTES.PROFILE_ORDERS.href,
  icon: ShoppingBag,
};
// Event group chats, which anyone with a ticket joins.
const chats: TAccountLink = {
  label: ROUTES.MESSAGES.label,
  href: ROUTES.MESSAGES.href,
  icon: MessagesSquare,
};
// Turnupz Credit and saved cards.
const wallet: TAccountLink = {
  label: ROUTES.PROFILE_WALLET.label,
  href: ROUTES.PROFILE_WALLET.href,
  icon: Wallet,
};
const following: TAccountLink = {
  label: ROUTES.PROFILE_FOLLOWING.label,
  href: ROUTES.PROFILE_FOLLOWING.href,
  icon: Heart,
};
const dashboardSettings: TAccountLink = {
  label: ROUTES.SETTINGS.label,
  href: ROUTES.SETTINGS.href,
  icon: Settings,
};
const help: TAccountLink = {
  label: "Help",
  href: ROUTES.PROFILE_HELP.href,
  icon: CircleHelp,
};
const dashboardProfile: TAccountLink = {
  label: "Profile",
  href: ROUTES.PROFILE.href,
  icon: User,
};
const createEvent: TAccountLink = {
  label: "Create Event",
  href: ROUTES.CREATE_EVENT.href,
  icon: CalendarPlus,
};

const ATTENDEE_NAV: TAccountNav = {
  // Orders sit in the account menu; the header keeps the two they use most.
  headerLinks: [myTickets, chats],
  // Attendees become vendors by applying, so that is where hosting starts.
  cta: {
    label: "Host an Event",
    href: ROUTES.VENDOR_VERIFICATION.href,
    icon: Store,
  },
  menuGroups: [
    [
      { label: "Profile", href: ROUTES.USER_PROFILE.href, icon: User },
      myTickets,
      myOrders,
      wallet,
      chats,
      following,
      {
        label: ROUTES.PROFILE_SETTINGS.label,
        href: ROUTES.PROFILE_SETTINGS.href,
        icon: Settings,
      },
    ],
    [help],
  ],
};

const VENDOR_NAV: TAccountNav = {
  headerLinks: [
    { label: "Dashboard", href: ROUTES.DASHBOARD.href, icon: LayoutDashboard },
  ],
  cta: createEvent,
  menuGroups: [
    [
      {
        label: "Dashboard",
        href: ROUTES.DASHBOARD.href,
        icon: LayoutDashboard,
      },
      // The vendor ledger, named apart from the tickets they hold.
      { label: "Ticket Sales", href: ROUTES.TICKETS.href, icon: TicketCheck },
      chats,
      {
        label: ROUTES.ANALYSIS.label,
        href: ROUTES.ANALYSIS.href,
        icon: ChartNoAxesCombined,
      },
      { label: ROUTES.WALLET.label, href: ROUTES.WALLET.href, icon: Wallet },
    ],
    [myTickets, myOrders, following, dashboardProfile, dashboardSettings],
    [help],
  ],
};

const ADMIN_NAV: TAccountNav = {
  headerLinks: [
    {
      label: "Admin Console",
      href: ROUTES.ADMIN_OVERVIEW.href,
      icon: ShieldCheck,
    },
  ],
  cta: createEvent,
  menuGroups: [
    [
      {
        label: "Admin Console",
        href: ROUTES.ADMIN_OVERVIEW.href,
        icon: ShieldCheck,
      },
    ],
    [myTickets, myOrders, following, dashboardProfile, dashboardSettings],
    [help],
  ],
};

export const getAccountNav = (role?: EUserRoles): TAccountNav => {
  switch (role) {
    case EUserRoles.ADMIN:
      return ADMIN_NAV;
    case EUserRoles.VENDOR:
      return VENDOR_NAV;
    default:
      return ATTENDEE_NAV;
  }
};
