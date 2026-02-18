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
  CAREERS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_COMPANY_INFO_ROUTE],
    label: "Careers",
    href: "/careers",
  },
  FAQS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_COMPANY_INFO_ROUTE],
    label: "FAQs",
    href: "/faqs",
  },
  TERMS_OF_SERVICE: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_COMPANY_INFO_ROUTE],
    label: "Terms of Service",
    href: "/terms-of-service",
  },
  PRIVACY_POLICY: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_COMPANY_INFO_ROUTE],
    label: "Privacy Policy",
    href: "/privacy-policy",
  },

  // Help Routes
  ACCOUNT_SUPPORT: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_HELP_ROUTE],
    label: "Account Support",
    href: "/help/account-support",
  },
  LISTING_EVENTS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_HELP_ROUTE],
    label: "Listing Events",
    href: "/help/listing-events",
  },
  EVENT_TICKETING: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_HELP_ROUTE],
    label: "Event Ticketing",
    href: "/help/event-ticketing",
  },
  TICKET_PURCHASE_TERMS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_HELP_ROUTE],
    label: "Ticket Purchase Terms & Conditions",
    href: "/help/ticket-purchase-terms",
  },

  // Categories Routes
  CONCERTS_GIGS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_CATEGORIES_ROUTE],
    label: "Concerts & Gigs",
    href: "/categories/concerts-gigs",
  },
  FESTIVALS_LIFESTYLE: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_CATEGORIES_ROUTE],
    label: "Festivals & Lifestyle",
    href: "/categories/festivals-lifestyle",
  },
  BUSINESS_NETWORKING: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_CATEGORIES_ROUTE],
    label: "Business & Networking",
    href: "/categories/business-networking",
  },
  FOOD_DRINKS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_CATEGORIES_ROUTE],
    label: "Food & Drinks",
    href: "/categories/food-drinks",
  },
  PERFORMING_ARTS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_CATEGORIES_ROUTE],
    label: "Performing Arts",
    href: "/categories/performing-arts",
  },
  SPORTS_OUTDOORS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_CATEGORIES_ROUTE],
    label: "Sports & Outdoors",
    href: "/categories/sports-outdoors",
  },
  EXHIBITIONS: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_CATEGORIES_ROUTE],
    label: "Exhibitions",
    href: "/categories/exhibitions",
  },
  WORKSHOPS_CONFERENCES_CLASSES: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_CATEGORIES_ROUTE],
    label: "Workshops, Conferences & Classes",
    href: "/categories/workshops-conferences-classes",
  },

  // Follow Us Routes (Social Links)
  FACEBOOK: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_FOLLOW_US_ROUTE],
    label: "Facebook",
    href: "https://facebook.com",
  },
  INSTAGRAM: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_FOLLOW_US_ROUTE],
    label: "Instagram",
    href: "https://instagram.com",
  },
  TWITTER: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_FOLLOW_US_ROUTE],
    label: "Twitter",
    href: "https://twitter.com",
  },
  YOUTUBE: {
    shouldShowIn: [ROUTE_TYPE.FOOTER_FOLLOW_US_ROUTE],
    label: "Youtube",
    href: "https://youtube.com",
  },

  // App Routes
  DASHBOARD: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE, ROUTE_TYPE.SHOW_ON_APP_SIDE_NAV],
    label: "Dashboard",
    href: "/app",
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
  NOTIFICATIONS: {
    shouldShowIn: [ROUTE_TYPE.APP_ROUTE],
    label: "Notifications",
    href: "/app/notifications",
  },
};
