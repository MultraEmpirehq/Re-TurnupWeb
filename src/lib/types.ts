import { EUserRoles, TUserDetails } from "@/stores/user-store";

export enum ROUTE_TYPE {
  NAV_ROUTE = "NAV_ROUTE",
  FOOTER_ROUTE = "FOOTER_ROUTE",
  FOOTER_COMPANY_INFO_ROUTE = "FOOTER_COMPANY_INFO_ROUTE",
  FOOTER_HELP_ROUTE = "FOOTER_HELP_ROUTE",
  FOOTER_CATEGORIES_ROUTE = "FOOTER_CATEGORIES_ROUTE",
  FOOTER_FOLLOW_US_ROUTE = "FOOTER_FOLLOW_US_ROUTE",
  HIDE_ON_LOGIN = "HIDE_ON_LOGIN",
  /** A header page link that's only for visitors; signed-in people reach it another way. */
  SIGNED_OUT_ONLY = "SIGNED_OUT_ONLY",
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
  "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "OTHER";

export type TAttachmentPurpose =
  | "EVENT_COVER"
  | "EVENT_MEDIA"
  | "EVENT_SPONSOR"
  | "EVENT_BLOG"
  | "VENUE_IMAGE"
  | "ID_DOCUMENT"
  | "SUPPORTING_DOCUMENT"
  | "CHAT_ASSET"
  | "AVATAR"
  | "PERFORMER_IMAGE";

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
  /** Paid, couldn't be fulfilled, money returned. */
  REFUNDED = "REFUNDED",
  /** Paid, but held for a person to check (amount mismatch, failed refund). */
  NEEDS_REVIEW = "NEEDS_REVIEW",
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
  salesStartAt?: string | null;
  salesEndAt?: string | null;
  maxPerOrder?: number | null;
  /** Inside its sales window right now. */
  isOnSale?: boolean;
  /** For a multi-day event: the days it admits on. Empty means every day. */
  dayIds?: string[];
  /** The same as positions in the event's days, while a form edits them. */
  dayIndexes?: number[];
}

/** One day of a multi-day event. */
export interface IEventDayDetails {
  id: string;
  startsAt: string;
  endsAt?: string | null;
  /** Shown instead of the date when set, e.g. "Opening night". */
  label?: string | null;
  position: number;
  /** Who performs that day, headliner first. */
  performers?: IPerformerSummary[];
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
  status?: "draft" | "pending_review" | "published" | "suspended";
  /** Why an admin suspended the event; present only while suspended. */
  suspensionReason?: string | null;
  /** What an admin asked the organiser to change; only the organiser sees it. */
  reviewNote?: string | null;
  /** IANA zone the event's times are in, e.g. "Africa/Lagos". */
  timezone?: string;
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
  /** The organiser's user id: what their planner page and follows go by. */
  organizerId?: string;
  /** Who's on the bill, headliner first. */
  performers?: IPerformerSummary[];
  /** A multi-day event's days in order; empty for a one-day event. */
  days?: IEventDayDetails[];
  /** When a multi-day event ends; null for a one-day event. */
  endDate?: string | null;
  isFavorite?: boolean;
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
  salesStartAt?: string | null;
  salesEndAt?: string | null;
  maxPerOrder?: number | null;
  isOnSale?: boolean;
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
  /** Only when they have no account; account holders show by name and @username. */
  toEmail: string | null;
  recipientUsername?: string | null;
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
  /** The order number to quote to support, e.g. ORD-D7YS-YYKJ. */
  reference?: string | null;
  status: EOrderStatus;
  /** Why a refunded, failed or held order ended up that way. */
  statusReason?: string | null;
  /** For a pending paid order: when its held seats are released. */
  holdExpiresAt?: string | null;
  quantity: number;
  createdAt: Date;
  ticket: IOrderTicketType;
  /** Every ticket type in the order; `ticket` is the first of them. */
  items?: { ticket: IOrderTicketType; quantity: number }[];
  userTickets: IUserTicketType[];
  /** How much Turnupz Credit paid, or null. */
  paidWithCredit?: IMoney | null;
  /** Money given back, oldest first. */
  refunds?: IOrderRefund[];
  refundedTickets?: number;
}

export interface IMoney {
  amount: number;
  formatted: { withCurrency: string };
}

export interface IOrderRefund {
  status: "processing" | "completed" | "failed";
  tickets: number;
  /** Back to the card it was paid with. */
  toCard: IMoney;
  /** Back as Turnupz Credit. */
  asCredit: IMoney;
  requestedAt: string;
  completedAt: string | null;
}

export interface ICategoryDetailsType {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Admin console
// ---------------------------------------------------------------------------

export type TAdminUserType =
  "all" | "vendors" | "users" | "unverified" | "suspended";

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
  isEmailVerified?: boolean;
  isAccountDisabled?: boolean;
}

export interface IVendorVerificationSummary {
  reference: string | null;
  status: TVerificationStatus;
  /** free: free events only, no ID or bank; paid: the full verification. */
  plan?: "free" | "paid" | null;
  approvalLevel: TApprovalLevel | null;
  vendorType: "individual" | "business" | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  needsMoreInfoMessage: string | null;
  stepStatuses: Record<string, string>;
}

export interface IAdminUserDetails extends IAdminUserListItem {
  isAccountDisabled: boolean;
  isAccountCreationCompleted?: boolean;
  dateOfBirth?: string;
  gender?: string;
  platformCurrency?: string;
  vendorVerification?: IVendorVerificationSummary;
}

export type TVerificationStepKey =
  "vendorType" | "identity" | "business" | "payout" | "crossBorder" | "review";

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
  /** free: free events only, no ID or bank; paid: the full verification. */
  plan?: "free" | "paid" | null;
  /** What's still needed before it can be approved to sell tickets. */
  missingForSelling?: string[];
  /** What's still needed before it can be approved to sell abroad. */
  missingForCrossBorder?: string[];
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
  /** The bank's code from the payment provider's list, for direct payouts. */
  bankCode?: string | null;
  /** Where the vendor is paid once approved; null until it's set up (admin view). */
  payoutAccount?: {
    provider: "FLUTTERWAVE" | "PAYSTACK" | "STRIPE";
    status: "ACTIVE" | "DISABLED";
    livemode: boolean;
    country: string;
    currency: string;
    bankName: string | null;
    accountLast4: string | null;
  } | null;
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

// ---------------------------------------------------------------------------
// Performers, planners, follows
// ---------------------------------------------------------------------------

export type TPerformerType =
  | "ARTIST"
  | "DJ"
  | "BAND"
  | "SPEAKER"
  | "COMEDIAN"
  | "HOST"
  | "ATHLETE"
  | "CHEF"
  | "OTHER";

export interface IPerformerSummary {
  id: string;
  name: string;
  type: TPerformerType;
  image?: string | null;
  /** Approved by the team: shown with the verified tick. */
  isVerified?: boolean;
}

export interface IPerformer extends IPerformerSummary {
  bio?: string | null;
  countryCode?: string | null;
  country?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  website?: string | null;
  upcomingEventsCount: number;
  /** The viewer added it, so they can edit or remove it (admins always can). */
  isOwner?: boolean;
  /** One a vendor added waits for an admin before it's listed publicly. */
  reviewStatus?: "pending" | "approved" | "rejected";
  /** Why it was sent back; only its owner sees it. */
  reviewNote?: string | null;
  /** Position on a chart, when it came from one. */
  rank?: number;
}

export interface IPlanner {
  /** Their user id: the organizerId on events, and what they're followed by. */
  id: string;
  name: string;
  image?: string | null;
  upcomingEvents: number;
}

export interface IEventLocation {
  countryCode: string;
  country: string;
  count: number;
  cities: { name: string; count: number }[];
}

export type TFollowTargetType = "PERFORMER" | "VENUE" | "PLANNER";

export interface IFollowedItem {
  targetType: TFollowTargetType;
  targetId: string;
  name: string;
  image: string | null;
  subtitle: string | null;
  upcomingEvents: number;
  followedAt: string;
}
