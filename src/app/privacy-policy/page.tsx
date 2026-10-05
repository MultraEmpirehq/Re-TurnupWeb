import type { Metadata } from "next";
import Link from "next/link";
import { memo } from "react";

// DRAFT FOR LEGAL REVIEW. Written from what the app actually collects and who it
// shares data with, as of October 2026. Anything in [square brackets] needs a
// decision from the business or counsel. Keep it out of search until signed off.
export const metadata: Metadata = {
  title: "Privacy Policy (draft) | Turnupz",
  robots: { index: false, follow: false },
};

const LAST_UPDATED = "5 October 2026";

type TSection = {
  title: string;
  intro?: string;
  items?: string[];
  table?: { what: string; why: string }[];
};

const sections: TSection[] = [
  {
    title: "Who we are",
    intro:
      'Turnupz is an event platform for discovering events, buying or registering for tickets, and hosting events. In this policy, "Turnupz", "we" and "us" means [legal entity name], [registered address], [company registration number]. We decide how and why your personal data is used, which makes us its controller.',
  },
  {
    title: "What we collect",
    intro: "We only collect what we need to run your account and your events.",
    table: [
      {
        what: "Account details: email address, first and last name, username, date of birth, gender (optional), country, postal code (optional), and a profile photo if you add one.",
        why: "To create your account, show your profile, confirm your age where needed, and set your currency.",
      },
      {
        what: "Password, stored only as a one-way hash. If you sign in with Google, we receive your name, email address and profile photo from Google, and a Google account identifier.",
        why: "To sign you in securely.",
      },
      {
        what: "Orders, tickets and registrations: what you bought or registered for, quantities, amounts, payment references and status, ticket transfers, and check-in scans at the door.",
        why: "To issue and validate your tickets, handle refunds and transfers, and keep financial records.",
      },
      {
        what: "Payment details. Card and bank details you enter at checkout go directly to Paystack. We never see or store your card number; we keep the payment reference Paystack gives us.",
        why: "To take payment and match it to your order.",
      },
      {
        what: "For organisers (vendors): legal name, date of birth, address, phone number, business name and registration number, tax ID, an identity document and any supporting documents, and payout account details. Account numbers, IBANs, sort codes and routing numbers are stored encrypted, with only the last four digits readable.",
        why: "To verify organisers before they sell paid tickets, prevent fraud, meet our legal obligations, and pay out ticket revenue.",
      },
      {
        what: "Event content you create: event details, venues, images, blog posts, guest names and the email addresses you invite to access passes.",
        why: "To publish and run your event.",
      },
      {
        what: "Messages: event group chat messages, messages you send through our contact form, and reports you make about an event.",
        why: "To run event chats, answer you, and keep the platform safe.",
      },
      {
        what: "Bookmarks and notification history.",
        why: "To save events you like and show you updates.",
      },
      {
        what: "Technical data: your IP address (used for rate limiting and, for administrators, recorded with sensitive actions in our audit log), and the session that keeps you signed in.",
        why: "To protect accounts from abuse and keep a record of who changed what.",
      },
    ],
  },
  {
    title: "What we don't do",
    items: [
      "We don't sell your personal data.",
      "We don't use advertising or analytics trackers on the website.",
      "We don't ask for your device's location. Venue search uses the address text you type.",
    ],
  },
  {
    title: "Who we share it with",
    intro:
      "We share data only with the services that help us run Turnupz, and only what each one needs:",
    items: [
      "Paystack: payments, refunds and organiser payouts.",
      "Google: sign-in with Google, and Google Maps / Places to look up venue addresses.",
      "Cloudinary: storing images and documents you upload, including organiser identity documents.",
      "SendGrid: sending emails such as sign-in codes, receipts and event updates.",
      "Novu and OneSignal: delivering in-app and push notifications.",
      "[Hosting provider and region]: hosting our servers, database and session store.",
      "Event organisers: the organiser of an event you get a ticket for can see your ticket details when it's scanned at the door, and for events where they approve registrations, your name and email address. [Confirm against what organiser screens show before publishing.]",
      "Other attendees: your name and profile photo are visible to other members of an event chat you join.",
      "Authorities, where the law requires it, or to protect people from fraud or harm.",
    ],
  },
  {
    title: "Your legal bases",
    intro:
      "[Counsel to confirm against the Nigeria Data Protection Act 2023 and, where we serve people in the UK or EU, the UK/EU GDPR.] We rely on:",
    items: [
      "Contract: to provide your account, tickets and payouts.",
      "Legal obligation: to keep financial records and verify organisers.",
      "Legitimate interests: to keep the platform secure, prevent fraud and moderate events.",
      "Consent: for optional push notifications, which you can turn off at any time.",
    ],
  },
  {
    title: "How long we keep it",
    items: [
      "Account data: while your account is open, and [X months] after you close it.",
      "Orders, payments and payouts: [X years], as required for tax and accounting.",
      "Organiser verification documents: [X years] after verification ends.",
      "Audit log entries: [X years].",
      "Contact messages and event reports: [X months] after they're resolved.",
    ],
  },
  {
    title: "Your rights",
    intro:
      "You can ask us to give you a copy of your data, correct it, delete it, restrict or object to how we use it, or move it to another service. You can also withdraw consent you've given. Email [privacy contact email] and we'll reply within [30 days]. If you're not happy with our answer, you can complain to the Nigeria Data Protection Commission [or your local data protection authority].",
  },
  {
    title: "Cookies and local storage",
    intro:
      "We use a cookie and your browser's local storage only to keep you signed in and remember your settings. We don't use advertising or analytics cookies, so there is nothing to opt out of.",
  },
  {
    title: "Security",
    intro:
      "Passwords are hashed, payout account numbers are encrypted, connections are encrypted in transit, and administrator access is limited by role and logged. No system is perfectly secure, so please use a strong password and tell us at [security contact email] if you notice anything wrong.",
  },
  {
    title: "International transfers",
    intro:
      "Some of the services above store data outside [Nigeria]. [Counsel to describe the safeguards relied on for these transfers.]",
  },
  {
    title: "Children",
    intro:
      "Turnupz isn't meant for children under [13/16/18]. We ask for date of birth when you sign up so we can enforce this.",
  },
  {
    title: "Changes to this policy",
    intro:
      "If we change this policy in a way that matters, we'll tell you by email or in the app before the change takes effect.",
  },
];

const PrivacyPolicyPage = () => (
  <main className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
    <div
      role="note"
      className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"
    >
      <p className="font-bold uppercase tracking-wider">
        Draft for legal review
      </p>
      <p className="mt-1 leading-6">
        This policy hasn&apos;t been approved yet. It describes what Turnupz
        collects today, but items in [square brackets] still need to be
        confirmed. It isn&apos;t a final legal document.
      </p>
    </div>

    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
        Turnupz Policies
      </p>
      <h1 className="text-4xl font-bold tracking-tight text-secondary-950 md:text-5xl">
        Privacy Policy
      </h1>
      <p className="max-w-3xl text-sm leading-7 text-secondary-500 sm:text-base">
        What we collect when you use Turnupz, why, who we share it with, and the
        choices you have. Last updated {LAST_UPDATED}.
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
      Questions? Email [privacy contact email] or use our{" "}
      <Link href="/contact" className="font-semibold text-primary underline">
        contact form
      </Link>
      .
    </p>
  </main>
);

export default memo(PrivacyPolicyPage);
