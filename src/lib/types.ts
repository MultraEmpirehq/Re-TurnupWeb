import { TUserDetails } from "@/stores/user-store";

export enum ROUTE_TYPE {
  NAV_ROUTE = "NAV_ROUTE",
  FOOTER_ROUTE = "FOOTER_ROUTE",
  FOOTER_COMPANY_INFO_ROUTE = "FOOTER_COMPANY_INFO_ROUTE",
  FOOTER_HELP_ROUTE = "FOOTER_HELP_ROUTE",
  FOOTER_CATEGORIES_ROUTE = "FOOTER_CATEGORIES_ROUTE",
  FOOTER_FOLLOW_US_ROUTE = "FOOTER_FOLLOW_US_ROUTE",
  HIDE_ON_LOGIN = "HIDE_ON_LOGIN",
  APP_ROUTE = "APP_ROUTE",
  SHOW_ON_APP_SIDE_NAV = "SHOW_ON_APP_SIDE_NAV",
}

export enum OTP_VERIFICATION_TYPE {
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  FORGOT_PASSWORD = "FORGOT_PASSWORD",
  CHANGE_EMAIL = "CHANGE_EMAIL",
  CHANGE_MOBILE = "CHANGE_MOBILE",
  ACCOUNT_CREATION = "ACCOUNT_CREATION",
}

export enum EOrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface RouteProps {
  shouldShowIn: ROUTE_TYPE[];
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface IVenueDetailsType {
  id: string;
  name: string;
  longitude?: number;
  latitude?: number;
  address: string;
  rating: number;
  totalAvailableSeat: number;
  description?: string;
  creator?: TUserDetails;
  images: string[];
}

export interface IEventActivityDetails {
  name: string;
  description?: string;
  date: Date;
}
export interface IEventDetailsType {
  id: string;
  name: string;
  date: Date;
  venue?: IVenueDetailsType;
  image: string;
  totalTickets: number;
  description?: string;
  activities?: IEventActivityDetails[];
  additionalInformation?: string[];
  eventGuestsOfHonour?: ({ name: string } | TUserDetails)[];
  medias?: string[];
}

export interface IUserCheckedCredentials {
  exists: boolean;
  isAccountDisabled: boolean;
  isEmailVerified: boolean;
  shouldRequestPassword: boolean;
  isAccountCreationCompleted: boolean;
}

export interface ITicketDetailsType {
  id: string;
  event: IEventDetailsType;
  name: string;
  type: string;
  link: string;
  price: {
    amount: number;
    currency: {
      code: string;
      symbol: string;
      name: string;
      locale: string;
    };
    formatted: {
      withCurrency: string;
      withoutCurrency: string;
    };
    parts: {
      whole: number;
      subUnit: number;
      smallestUnit: number;
    };
  };
  description?: string;
  quantity?: number;
}

export interface IOrderTicketType {
  id: string;
  name: string;
  type: string;
  link: string;
  price: ITicketDetailsType["price"];
}

export interface IOrderDetailsType {
  id: string;
  status: EOrderStatus;
  tickets: IOrderTicketType[];
  event: IEventDetailsType;
  quantity: number;
  totalAmount: {
    amount: number;
    currency: ITicketDetailsType["price"]["currency"];
    formatted: ITicketDetailsType["price"]["formatted"];
  };
  createdAt: Date;
}

export interface ICategoryDetailsType {
  id: string;
  name: string;
}
