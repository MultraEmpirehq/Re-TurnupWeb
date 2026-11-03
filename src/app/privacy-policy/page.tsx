import type { Metadata } from "next";
import Link from "next/link";
import { memo } from "react";

// Written from what Turnupz actually collects and who it shares data with (as
// of 1 November 2026), and aligned with the approved pricing, tax, settlement
// and points addendum (revision 4) and the CTO review. Counsel should review
// it before launch. Fill in LEGAL below: until every value is set, the page
// shows a draft notice and stays out of search.
const LEGAL = {
  /** The company responsible for Turnupz (for now, in both Nigeria and Canada). */
  company: "Turnupz Inc. (corporation number 1822152-9)",
  canadaAddress: "Calgary, Canada",
  nigeriaAddress: "Lagos, Nigeria",
  /** Where people send privacy requests. */
  privacyEmail: "admin@multraempire.com",
  /** Who's responsible for personal information (required in Québec): a title is enough. */
  privacyOfficer: "Our Data Protection Officer",
};

const IS_DRAFT = Object.values(LEGAL).some((value) => !value.trim());
const show = (value: string, placeholder: string) => value.trim() || `[${placeholder}]`;

export const metadata: Metadata = {
  title: IS_DRAFT ? "Privacy Policy (draft) | Turnupz" : "Privacy Policy | Turnupz",
  description:
    "What Turnupz collects, why, who it's shared with, how long it's kept, and your choices.",
  ...(IS_DRAFT ? { robots: { index: false, follow: false } } : {}),
};

const LAST_UPDATED = "1 November 2026";

type TSection = {
  title: string;
  intro?: string;
  items?: string[];
  table?: { what: string; why: string }[];
};

const sections: TSection[] = [
  {
    title: "Who we are",
    intro: `Turnupz is an event platform for discovering events, buying or registering for tickets, and hosting events, in Nigeria and Canada. In this policy, "Turnupz", "we" and "us" means ${show(LEGAL.company, "company name and number")}, based in ${show(LEGAL.canadaAddress, "Canadian city")} and ${show(LEGAL.nigeriaAddress, "Nigerian city")}. We decide how and why your personal data is used. Organisers are responsible for how they use attendee information for their own events.`,
  },
  {
    title: "What we collect, and why",
    intro: "We only collect what we need to run your account, your tickets and your events.",
    table: [
      {
        what: "Account details: email address, name, username, date of birth, gender (optional), postal code (optional) and a profile photo if you add one.",
        why: "To create your account, show your profile and sign you in.",
      },
      {
        what: "The country you normally live in.",
        why: "To show an approximate amount in your local currency at checkout and to handle the account rules that apply to you. You can browse and buy for events in any country.",
      },
      {
        what: "Sign-in details: your password (stored only as a one-way hash), and if you sign in with Google, your name, email address and the account identifier Google gives us.",
        why: "To sign you in securely.",
      },
      {
        what: "Your phone's location, only if you allow it, only while you're using the app.",
        why: "To find your city and show events near you first. We use it to work out your city and country; we don't keep your precise location. Saying no doesn't stop you browsing or buying.",
      },
      {
        what: "Orders, tickets and registrations: what you bought or registered for, quantities, prices, discounts, payment references and status, the tax position of each sale, transfers, refunds, and check-ins at the door.",
        why: "To issue and check your tickets, handle refunds and transfers, and keep the financial and tax records the law requires.",
      },
      {
        what: "Payment details. Card and bank details you enter at checkout go straight to our payment provider. We never see your full card number. If you choose to save a card, we keep the provider's token for it (encrypted), the card brand, expiry and issuing country.",
        why: "To take payment, match it to your order and let you pay faster next time.",
      },
      {
        what: "For organisers: legal name, date of birth, address, phone number, business name and registration number, tax ID, an identity document and supporting documents, and payout account details. Payout account numbers are stored encrypted, with only the last four digits readable; you can view the full number again by confirming your password.",
        why: "To verify organisers (who must be 18 or over) before they sell paid tickets, prevent fraud, meet our legal obligations and send ticket proceeds to the right account.",
      },
      {
        what: "Event content you create: event details, venues, line-ups, images, sponsors, blog posts, and the people you invite to access passes or to your team.",
        why: "To publish and run your event.",
      },
      {
        what: "Messages: event group chats, private chats, support chats, messages through our contact form, and reports about events.",
        why: "To run chats, help you, and keep the platform safe.",
      },
      {
        what: "Social activity: who you follow and who follows you, saved events, your privacy settings and notification history.",
        why: "To show your feed and updates, and respect your privacy choices.",
      },
      {
        what: "Referrals and Turnupz Credit: who invited you or whose link you bought through, the codes you use, and any credit you earn or spend.",
        why: "To run the referral programme and give you the credit you've earned.",
      },
      {
        what: "Device and security data: your IP address, the devices you're signed in on (device name and sign-in times), and a scrambled device identifier.",
        why: "To keep your account secure, let you sign out of other devices, stop abuse such as fake referral accounts, and record who changed what on administrator accounts.",
      },
      {
        what: "Usage counts: a random visitor identifier that lets us count visits to events and promoted listings, and technical error reports when something breaks.",
        why: "To show organisers how many people saw their event and to fix problems. These don't identify who you are.",
      },
    ],
  },
  {
    title: "What we don't do",
    items: [
      "We don't sell your personal data.",
      "We don't use advertising trackers or third-party analytics cookies.",
      "We don't keep your precise location, and location is never required.",
      "We don't hold ticket money. Payment providers take payments and send organisers their share directly; Turnupz receives only its own fees.",
      "We only use the camera when an organiser scans tickets at the door, and we don't keep those images.",
    ],
  },
  {
    title: "Who we share it with",
    intro:
      "We share data only with the services that help us run Turnupz, and only what each one needs:",
    items: [
      "Payment providers: Flutterwave (Nigeria) and Stripe (Canada) take payments, process refunds and pay organisers. Canadian organisers have their own Stripe account, so Stripe also holds the details they give it. Payments taken earlier through Paystack stay with Paystack, which handles their refunds.",
      "Google: signing in with Google, and Google Maps to look up venue addresses.",
      "Cloudinary: storing images and documents you upload, including organiser identity documents.",
      "SendGrid: sending emails such as sign-in codes, receipts and event updates.",
      "Novu and OneSignal: delivering in-app and push notifications.",
      "Sentry: error reports, so we can fix problems.",
      "Railway and Vercel: hosting our servers, database and website.",
      "Event organisers: when you get a ticket, the organiser sees your name and ticket details, including at check-in. For events where they approve registrations, they also see your email address.",
      "Other attendees: your name and profile photo are visible to other members of an event chat you join, and your public profile follows your privacy settings.",
      "Tax advisers, auditors and authorities, where the law requires it, or to protect people from fraud or harm.",
    ],
  },
  {
    title: "Why we're allowed to use it",
    intro:
      "Under Nigeria's Data Protection Act 2023 and Canada's privacy laws (PIPEDA, and Québec's Law 25 for people in Québec), we use your data because:",
    items: [
      "You asked us to: to provide your account, tickets, payments and payouts.",
      "The law requires it: to keep financial and tax records and to verify organisers.",
      "It's needed to keep Turnupz safe: to secure accounts, prevent fraud and moderate events.",
      "You agreed: for location and push notifications, which you can turn off at any time in your phone's settings.",
    ],
  },
  {
    title: "How long we keep it",
    items: [
      "Account details: until you delete your account. Deleting it removes your profile, photo, followers, saved cards and sign-ins straight away.",
      "Orders, payments, payouts and tax records: at least six years, as tax and accounting law requires, longer where the law says so. If you delete your account, these are kept without your name.",
      "Organiser verification documents and payout details: while the organiser account is open, then for as long as the law requires for financial records.",
      "Security and administrator audit records: for as long as we need them to investigate problems, and no longer than the financial records above.",
      "Messages you send us and event reports: until they're resolved, and for as long as we may need them to answer follow-ups.",
    ],
  },
  {
    title: "Your choices and rights",
    intro: `You can see, correct and download most of your data in your account settings, and delete your account at any time in the app or at turnupz.app/delete-account. You can also ask us for a copy of your data, to correct or delete it, or to stop or limit how we use it, and you can withdraw consent you've given. Email ${show(LEGAL.privacyEmail, "privacy email")} and we'll reply within 30 days. If you're not happy with our answer, you can complain to the Nigeria Data Protection Commission, the Office of the Privacy Commissioner of Canada, or in Québec, the Commission d'accès à l'information.`,
  },
  {
    title: "Who's responsible for your privacy",
    intro: `${show(LEGAL.privacyOfficer, "privacy officer's title")} is responsible for protecting personal information at Turnupz. You can reach them at ${show(LEGAL.privacyEmail, "privacy email")}.`,
  },
  {
    title: "Cookies and local storage",
    intro:
      "We use a cookie and your browser's local storage to keep you signed in, remember your settings and keep a copy of an event you're creating while you work on it. We also keep a random visitor identifier to count visits, not to identify you. The app stores the same kind of information on your phone. Our Cookie Policy lists each one.",
  },
  {
    title: "Security",
    intro: `Passwords are hashed, payout account numbers and saved-card tokens are encrypted, connections are encrypted, and administrator access is limited by role and logged. Tickets show a code that changes every 30 seconds, so a picture of a ticket stops working within minutes. No system is perfectly secure: use a strong password, and tell us at ${show(LEGAL.privacyEmail, "privacy email")} if you notice anything wrong.`,
  },
  {
    title: "Data stored in other countries",
    intro:
      "Some of the services above store or process data outside Nigeria and Canada, mainly in the United States. We choose providers that protect personal data under their data processing terms, and we only share what each one needs.",
  },
  {
    title: "Children",
    intro:
      "Turnupz isn't for children under 13. We ask for your date of birth when you sign up. Organisers must be 18 or over. Some events have their own age limits, which the organiser sets and checks at the door.",
  },
  {
    title: "Changes to this policy",
    intro:
      "If we change this policy in a way that matters, we'll tell you by email or in the app before the change takes effect.",
  },
];

const PrivacyPolicyPage = () => (
  <main className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
    {IS_DRAFT && (
      <div
        role="note"
        className="rounded-2xl border-2 border-dashed border-secondary-300 bg-secondary-50 px-5 py-4 text-sm text-secondary-900"
      >
        <p className="font-bold uppercase tracking-wider">Draft</p>
        <p className="mt-1 leading-6">
          This policy describes what Turnupz collects today. Items in [square
          brackets] are still being confirmed.
        </p>
      </div>
    )}

    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
        Turnupz Policies
      </p>
      <h1 className="text-4xl font-bold tracking-tight text-secondary-950 md:text-5xl">
        Privacy Policy
      </h1>
      <p className="max-w-3xl text-sm leading-7 text-secondary-500 sm:text-base">
        What we collect when you use Turnupz, why, who we share it with, how
        long we keep it, and the choices you have. Last updated {LAST_UPDATED}.
      </p>
    </section>

    <section className="grid gap-5">
      {sections.map((section) => (
        <article
          key={section.title}
          className="rounded-[1.6rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
        >
          <h2 className="text-xl font-bold text-secondary-950">
            {section.title}
          </h2>
          {section.intro && (
            <p className="mt-3 text-sm leading-7 text-secondary-600">
              {section.intro}
            </p>
          )}
          {section.items && (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-secondary-600">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.table && (
            <dl className="mt-4 divide-y divide-secondary-100 overflow-hidden rounded-xl border border-secondary-100">
              {section.table.map((row) => (
                <div
                  key={row.what}
                  className="grid gap-1 px-4 py-3 text-sm leading-6 md:grid-cols-[3fr_2fr] md:gap-6"
                >
                  <dt className="text-secondary-700">{row.what}</dt>
                  <dd className="text-secondary-500">{row.why}</dd>
                </div>
              ))}
            </dl>
          )}
        </article>
      ))}
    </section>

    <p className="text-sm text-secondary-500">
      Questions? Email {show(LEGAL.privacyEmail, "privacy email")}, use our{" "}
      <Link href="/contact" className="font-semibold text-primary underline">
        contact form
      </Link>
      , or see how to{" "}
      <Link href="/delete-account" className="font-semibold text-primary underline">
        delete your account
      </Link>
      .
    </p>
  </main>
);

export default memo(PrivacyPolicyPage);
