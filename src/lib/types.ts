import { TUserDetails } from "@/stores/user-store";

export enum ROUTE_TYPE {
  NAV_ROUTE = "NAV_ROUTE",
  FOOTER_ROUTE = "FOOTER_ROUTE",
  FOOTER_COMPANY_INFO_ROUTE = "FOOTER_COMPANY_INFO_ROUTE",
  FOOTER_HELP_ROUTE = "FOOTER_HELP_ROUTE",
  FOOTER_CATEGORIES_ROUTE = "FOOTER_CATEGORIES_ROUTE",
  FOOTER_FOLLOW_US_ROUTE = "FOOTER_FOLLOW_US_ROUTE",
}

export interface RouteProps {
  shouldShowIn: ROUTE_TYPE[];
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface VenueDetailsType {
  id: string;
  name: string;
  longitude?: number;
  latitude?: number;
  address: string;
  totalAvailableSeat: number;
  description?: string;
  creator?: TUserDetails;
  images: string[];
}

export interface EventActivityDetails {
  name: string;
  description?: string;
  date: Date;
}
export interface EventDetailsType {
  id: string;
  name: string;
  date: Date;
  venue?: VenueDetailsType;
  image: string;
  totalTickets: number;
  description?: string;
  activities?: EventActivityDetails[];
  additionalInformation?: string[];
  eventGuestsOfHonour?: ({ name: string } | TUserDetails)[];
  medias?: string[];
}
