import Link from "next/link";
import React, { memo } from "react";

const policySections = [
  {
    title: "Event Publishing Requirements",
    items: [
      "Event names, descriptions, dates, locations, media, and ticket details must be accurate before publishing.",
      "Vendors must have the right to host, promote, or manage the event they list on Turnupz.",
      "Venue capacity, safety requirements, age limits, and entry rules must be clearly reflected in the listing.",
      "Turnupz may pause, reject, or remove listings that appear misleading, unsafe, unlawful, or high risk.",
    ],
  },
  {
    title: "Ticketing Rules",
    items: [
      "Ticket categories, prices, registration limits, private links, and access passes must match the real entry rules for the event.",
      "Private tickets must only be shared with the intended audience and should not be presented as public inventory.",
      "Transfer settings are controlled by the vendor. Customers should only transfer tickets or passes where transfer is allowed.",
      "A ticket or pass may be denied at scan if it is invalid, expired, cancelled, already checked in, or assigned to another event.",
    ],
  },
  {
    title: "Vendor Verification And Payouts",
    items: [
      "Vendors may create drafts before verification, but paid publishing, payout setup, and cross-border paid hosting may require approval.",
      "Identity, business, payout, and cross-border information must be truthful and belong to the vendor or authorized business.",
      "Turnupz may request more information before approving paid ticket sales or releasing payouts.",
      "Payout details must match the verified person or business receiving event funds.",
    ],
  },
  {
    title: "Venue And Event Conduct",
    items: [
      "Vendors are responsible for attendee communication, event readiness, scanner access, and safe admission processes.",
      "Events must follow local laws, venue rules, permit requirements, and public safety expectations.",
      "Vendors should update customers quickly if event details, access rules, timing, venue, or ticket availability changes.",
      "Turnupz may notify customers about important event updates, blog posts, ticket activity, transfers, and registration status.",
    ],
  },
  {
    title: "Customer Experience",
    items: [
      "Listings should help customers understand what they are registering for or buying before they commit.",
      "Refund, cancellation, reschedule, and entry requirements should be communicated clearly when they apply.",
      "Customer data, scanner access, and pass invite emails should only be used for legitimate event operations.",
      "Abuse, fraud, duplicate ticket use, or misleading event activity may result in restrictions on the account or event.",
    ],
  },
];

const TermsPage = () => {
  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
          Turnupz Policies
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-secondary-950 md:text-5xl">
          Terms, ticketing rules, and publishing requirements
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-secondary-500 sm:text-base">
          These rules help vendors publish clear events, protect customers, and
          keep ticketing, access passes, verification, and venue operations
          consistent across Turnupz.
        </p>
      </section>

      <section className="grid gap-5">
        {policySections.map((section) => (
          <article
            key={section.title}
            className="rounded-[1.6rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-xl font-bold text-secondary-950">
              {section.title}
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-secondary-600">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-[1.6rem] bg-secondary-50 p-6 text-sm leading-7 text-secondary-600">
        <p className="font-semibold text-secondary-950">Before publishing</p>
        <p className="mt-2">
          By confirming the publish checkbox, the vendor confirms that the event
          follows these requirements and that the submitted event information is
          accurate to the best of their knowledge.
        </p>
        <Link
          href="/app/create"
          className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-secondary-950 transition hover:bg-secondary-100"
        >
          Back to Create Event
        </Link>
      </section>
    </main>
  );
};

export default memo(TermsPage);
