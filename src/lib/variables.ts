import { ROUTE_TYPE, RouteProps } from "./types";

export const ROUTES: { [key: string]: RouteProps } = {
  HOME: {
    shouldShowIn: [],
    label: "Home",
    href: "/",
  },
  // Nav Routes
  EXPLORE: {
    shouldShowIn: [ROUTE_TYPE.NAV_ROUTE],
    label: "Explore",
    href: "/explore",
  },
  PRICING: {
    shouldShowIn: [ROUTE_TYPE.NAV_ROUTE],
    label: "Pricing",
    href: "/pricing",
  },
  CONTACT: {
    shouldShowIn: [ROUTE_TYPE.NAV_ROUTE, ROUTE_TYPE.FOOTER_COMPANY_INFO_ROUTE],
    label: "Contact Us",
    href: "/contact",
  },
  LOGIN: {
    shouldShowIn: [ROUTE_TYPE.NAV_ROUTE, ROUTE_TYPE.HIDE_ON_LOGIN],
    label: "Login",
    href: "/auth",
  },
  OTP: {
    shouldShowIn: [],
    label: "OTP Verification",
    href: "/auth/otp",
  },
  SIGNUP: {
    shouldShowIn: [ROUTE_TYPE.NAV_ROUTE, ROUTE_TYPE.HIDE_ON_LOGIN],
    label: "Signup",
    href: "/auth?type=signup",
  },
  COMPLETE_USER_INFORMATION: {
    shouldShowIn: [],
    label: "Complete User Information",
    href: "/auth/complete-user",
  },

  // Company Info Routes
  ABOUT_US: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_COMPANY_INFO_ROUTE],
    label: "About Us",
    href: "/about",
  },
  FAQS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_COMPANY_INFO_ROUTE],
    label: "FAQs",
    href: "/faqs",
  },
  TERMS_OF_SERVICE: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_COMPANY_INFO_ROUTE],
    label: "Terms of Service",
    href: "/terms",
  },

  // App Routes
  DASHBOARD: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV],
    label: "Dashboard",
    href: "/app",
  },
  ADMIN_OVERVIEW: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.ADMIN_ONLY],
    label: "Overview",
    href: "/app/admin",
  },
  ADMIN_USERS: {
    shouldShowIn: [
      ROUTE_TYPE.APP_ROUTE,
      ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV,
      ROUTE_TYPE.ADMIN_ONLY,
    ],
    label: "Users",
    href: "/app/admin/users",
  },
  ADMIN_VERIFICATIONS: {
    shouldShowIn: [
      ROUTE_TYPE.APP_ROUTE,
      ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV,
      ROUTE_TYPE.ADMIN_ONLY,
    ],
    label: "Verifications",
    href: "/app/admin/verifications",
  },
  PROFILE: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE],
    label: "Profile",
    href: "/app/profile",
  },
  CREATE_EVENT: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV],
    label: "Create Event",
    href: "/app/create",
  },
  VENUES: {
    shouldShowIn: [
      ROUTE_TYPE.APP_ROUTE,
      ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV,
      ROUTE_TYPE.ADMIN_ONLY,
    ],
    label: "Venues",
    href: "/app/venues",
  },
  CATEGORIES: {
    shouldShowIn: [
      ROUTE_TYPE.APP_ROUTE,
      ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV,
      ROUTE_TYPE.ADMIN_ONLY,
    ],
    label: "Categories",
    href: "/app/categories",
  },
  CREATE_VENUE: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.ADMIN_ONLY],
    label: "Create Venue",
    href: "/app/create-venue",
  },
  CREATE_CATEGORY: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.ADMIN_ONLY],
    label: "Create Category",
    href: "/app/create-category",
  },
  EVENTS: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV],
    label: "Manage Posts",
    href: "/app/events",
  },
  MESSAGES: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV],
    label: "Chats",
    href: "/app/messages",
  },
  ANALYSIS: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV],
    label: "Analysis",
    href: "/app/analysis",
  },
  WALLET: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV],
    label: "Wallet",
    href: "/app/wallet",
  },
  TICKETS: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV],
    label: "Tickets",
    href: "/app/tickets",
  },
  SETTINGS: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV],
    label: "Settings",
    href: "/app/settings",
  },
  VENDOR_VERIFICATION: {
    shouldShowIn: [],
    label: "Vendor Verification",
    href: "/app/settings/vendor-verification",
  },
  NOTIFICATIONS: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE],
    label: "Notifications",
    href: "/app/notifications",
  },

  // Profile Routes
  USER_PROFILE: {
    shouldShowIn: [],
    label: "Profile",
    href: "/profile",
  },
  PROFILE_ORDERS: {
    shouldShowIn: [],
    label: "Orders",
    href: "/profile/orders",
  },
  PROFILE_TICKETS: {
    shouldShowIn: [],
    label: "Tickets",
    href: "/profile/tickets",
  },
  PROFILE_HELP: {
    shouldShowIn: [],
    label: "Help",
    href: "/profile/help",
  },
  TICKET_CLAIM: {
    shouldShowIn: [],
    label: "Claim Ticket",
    href: "/tickets/claim/:id",
  },
};
