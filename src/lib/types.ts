import { EUserRoles, TUserDetails } from "@/stores/user-store";

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
  ADMIN_ONLY = "ADMIN_ONLY",
}

export enum OTP_VERIFICATION_TYPE {
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  FORGOT_PASSWORD = "FORGOT_PASSWORD",
  CHANGE_EMAIL = "CHANGE_EMAIL",
  CHANGE_MOBILE = "CHANGE_MOBILE",
  ACCOUNT_CREATION = "ACCOUNT_CREATION",
}

export type TAttachmentType =
  | "IMAGE"
  | "VIDEO"
  | "DOCUMENT"
  | "AUDIO"
  | "OTHER";

export type TAttachmentPurpose =
  | "EVENT_COVER"
  | "EVENT_MEDIA"
  | "EVENT_SPONSOR"
  | "EVENT_BLOG"
  | "VENUE_IMAGE"
  | "ID_DOCUMENT"
  | "SUPPORTING_DOCUMENT"
  | "CHAT_ASSET"
  | "AVATAR";

/**
 * A stored file. `id` is null for anything uploaded before attachments existed,
 * which the api still returns in this shape so one field can be read everywhere.
 */
export interface TAttachment {
  id: string;
  url: string;
  type: TAttachmentType;
}

export interface TAttachmentDetails {
  id: string | null;
  url: string;
  type: TAttachmentType;
}

export enum EOrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface PriceDetailsType {
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
}

export interface IMonthlyTicketsSold {
  month: string;
  label: string;
  count: number;
}

export interface ITicketAnalytics {
  totalSales: PriceDetailsType;
  totalTicketsSold: number;
  totalTicketsRemaining: number;
  totalTicketsCreated: number;
  monthlyTicketsSold: IMonthlyTicketsSold[];
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
  imageDetails?: TAttachmentDetails[];
}

export interface IEventActivityDetails {
  name: string;
  description?: string;
  date: Date;
}

export interface IEventTicketOptionDetails {
  id?: string;
  eventId?: string;
  ticketName: string;
  ticketPrice: number | PriceDetailsType;
  ticketQuantity: number;
  soldCount?: number;
  visibility?: "public" | "private";
  actionType?: "paid" | "register";
  transferable?: boolean;
  privateAccessCode?: string;
}

export interface IEventPassAssignmentDetails {
  id?: string;
  eventId?: string;
  passName: string;
  quantity: number;
  assigneeEmails: string[];
  emailedAssignees?: string[];
  assignments?: {
    id: string;
    email: string;
    userId?: string | null;
    passClaimStatus?: "invited" | "claimed" | "revoked";
    passEmailSentAt?: string | null;
    claimedAt?: string | null;
    revokedAt?: string | null;
  }[];
  transferable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEventBlogPostDetails {
  id: string;
  title: string;
  excerpt?: string;
  body: string;
  image?: string | File;
  images?: (string | File)[];
  createdAt: string;
  updatedAt?: string;
}

export interface IEventDetailsType {
  id: string;
  name: string;
  date: Date;
  status?: "draft" | "published";
  /** True when the signed-in viewer created this event; only they may edit or delete it. */
  isOwner?: boolean;
  draftStep?: number;
  draftSnapshot?: Record<string, unknown>;
  venue?: IVenueDetailsType;
  image: string;
  imageDetails?: TAttachmentDetails | null;
  totalTickets: number;
  organizerName?: string;
  eventYear?: string;
  description?: string;
  blogPost?: string;
  blogPosts?: IEventBlogPostDetails[];
  activities?: IEventActivityDetails[];
  additionalInformation?: string[];
  eventGuestsOfHonour?: ({ name: string } | TUserDetails)[];
  medias?: string[];
  mediaDetails?: TAttachmentDetails[];
  sponsors?: string[];
  sponsorImages?: string[];
  saleMethod?: string;
  ticketUrl?: string;
  venueName?: string;
  venueAddress?: string;
  eventCountry?: string;
  eventCountryCode?: string;
  eventState?: string;
  eventStateCode?: string;
  eventCity?: string;
  category?: { id: string; name: string };
  customCategoryName?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  stateCode?: string;
  city?: string;
  registrationCount?: number;
  registrationLimit?: number;
  remainingRegistrationSpots?: number;
  registrationStatus?: "open" | "closed" | "full";
  requiresApproval?: boolean;
  eventTickets?: IEventTicketOptionDetails[];
  passAssignments?: IEventPassAssignmentDetails[];
  accessPasses?: IEventPassAssignmentDetails[];
  eventPasses?: IEventPassAssignmentDetails[];
  passes?: IEventPassAssignmentDetails[];
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
  price: PriceDetailsType;
  description?: string;
  quantity?: number;
  sold?: number;
  available?: number;
  transferable?: boolean;
  isTransferable?: boolean;
  visibility?: "public" | "private";
  privateAccessCode?: string;
  accessCode?: string;
  privateToken?: string;
}

export enum ETicketStatus {
  UN_USED = "UN_USED",
  USED = "USED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export interface IOrderTicketType {
  id: string;
  name: string;
  type: string;
  link: string | null;
  event?: { data?: IEventDetailsType };
  price: PriceDetailsType;
  quantity?: number;
  sold?: number;
  available?: number;
  transferable?: boolean;
  isTransferable?: boolean;
}

export interface IUserTicketType {
  id: string;
  code: string;
  ticketCode?: string;
  qrCodeValue?: string;
  barcodeValue?: string;
  createdAt: Date;
  status: ETicketStatus;
  registrationStatus?: "PENDING" | "CONFIRMED" | "REJECTED";
  currentHolderName?: string;
  currentHolderEmail?: string;
  checkedInAt?: string | null;
  scannerEmail?: string | null;
  ticket: IOrderTicketType;
  transfer?: TicketTransferResponseType;
}

/** Response from GET /tickets/user - list of tickets the user has bought */
export type TicketTransferResponseType = {
  id: string;
  status: string;
  toEmail: string;
  createdAt: Date;
  claimedAt: Date | null;
  recipientName: string | null;
};

export type UserTicketDetailsTicketType = {
  id: string;
  event: IEventDetailsType;
  name: string;
  type: string;
  link: string;
  price: PriceDetailsType;
  quantity: number;
  sold: number;
  available: number;
  transferable?: boolean;
  isTransferable?: boolean;
};

export type UserTicketDetailsResponseType = {
  id: string;
  code: string;
  ticketCode?: string;
  qrCodeValue?: string;
  barcodeValue?: string;
  createdAt: Date;
  status: ETicketStatus | string;
  registrationStatus?: "PENDING" | "CONFIRMED" | "REJECTED";
  currentHolderName?: string;
  currentHolderEmail?: string;
  checkedInAt?: string | null;
  scannerEmail?: string | null;
  ticket: UserTicketDetailsTicketType;
  transfer?: TicketTransferResponseType;
};

export interface IOrderDetailsType {
  id: string;
  status: EOrderStatus;
  quantity: number;
  createdAt: Date;
  ticket: IOrderTicketType;
  userTickets: IUserTicketType[];
}

export interface ICategoryDetailsType {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Admin console
// ---------------------------------------------------------------------------

export type TAdminUserType = "all" | "vendors" | "users";

export type TVerificationStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_more_info";

export type TVerificationDecision = "approved" | "rejected" | "needs_more_info";

export type TApprovalLevel =
  | "basic_verified"
  | "paid_verified"
  | "cross_border_verified"
  | "high_risk_review";

export interface IAdminUserListItem {
  id: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role?: EUserRoles;
  country?: string;
  createdAt?: string;
  profileImage?: string;
}

export interface IVendorVerificationSummary {
  reference: string | null;
  status: TVerificationStatus;
  approvalLevel: TApprovalLevel | null;
  vendorType: "individual" | "business" | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  needsMoreInfoMessage: string | null;
  stepStatuses: Record<string, string>;
}

export interface IAdminUserDetails extends IAdminUserListItem {
  isEmailVerified?: boolean;
  isAccountDisabled: boolean;
  isAccountCreationCompleted?: boolean;
  dateOfBirth?: string;
  gender?: string;
  platformCurrency?: string;
  vendorVerification?: IVendorVerificationSummary;
}

export type TVerificationStepKey =
  | "vendorType"
  | "identity"
  | "business"
  | "payout"
  | "crossBorder"
  | "review";

export interface IVerificationDocument {
  id?: string | null;
  url: string;
  type?: string | null;
}

export interface IVendorVerification {
  id: string;
  reference: string | null;
  vendorId: string;
  vendor?: IAdminUserListItem;
  status: TVerificationStatus;
  approvalLevel: TApprovalLevel | null;
  vendorType: "individual" | "business" | null;
  legalFirstName: string | null;
  legalLastName: string | null;
  dateOfBirth: string | null;
  countryOfResidence: string | null;
  address: string | null;
  phoneNumber: string | null;
  idDocumentDetails: IVerificationDocument | null;
  supportingDocumentDetails: IVerificationDocument | null;
  businessName: string | null;
  businessRegistrationNumber: string | null;
  businessAddress: string | null;
  payoutCountry: string | null;
  payoutCurrency: string | null;
  accountHolderName: string | null;
  bankName: string | null;
  accountNumberLast4: string | null;
  payoutAccountLast4: string | null;
  ibanLast4: string | null;
  swiftCode: string | null;
  crossBorderCountries: string[];
  crossBorderReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  needsMoreInfoMessage: string | null;
  stepStatuses?: Partial<Record<TVerificationStepKey, TVerificationStatus>>;
  createdAt: string;
  updatedAt: string;
}
