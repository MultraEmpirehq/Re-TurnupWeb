"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import React, { memo, useState } from "react";

const faqItems = [
  {
    question: "What is vendor verification?",
    answer:
      "Vendor verification is the review process Turnupz uses to confirm that a vendor is real, the event is real, and money can be collected and paid out safely.",
  },
  {
    question: "Can I create an event before verification is approved?",
    answer:
      "Yes. Vendors can create event drafts before approval. Verification is required before publishing paid events, selling paid tickets, receiving payouts, or publishing cross-border paid events.",
  },
  {
    question: "What can a Basic Verified vendor do?",
    answer:
      "Basic Verified vendors can publish free or registration-only events after basic account checks such as email, phone, and profile completion.",
  },
  {
    question: "What can a Paid Verified vendor do?",
    answer:
      "Paid Verified vendors can sell paid tickets after identity, payout, and event legitimacy checks are approved.",
  },
  {
    question: "What is Cross-Border Verified?",
    answer:
      "Cross-Border Verified means a vendor can sell paid tickets for events outside their account country, subject to payout support, currency rules, and extra risk review.",
  },
  {
    question: "What is High-Risk Review?",
    answer:
      "High-Risk Review is a manual admin review for events or vendors with higher fraud, payout, chargeback, or location risk. The event may need admin approval before going live.",
  },
  {
    question: "What does admin verify?",
    answer:
      "Admin reviews vendor identity, business details when applicable, payout ownership, event legitimacy, venue/location, cross-border risk, compliance needs, and fraud signals.",
  },
  {
    question: "Why do paid events need stronger verification?",
    answer:
      "Paid events involve customer money, refunds, chargebacks, taxes, and payouts. Verification protects customers, vendors, and the platform.",
  },
  {
    question: "How is event currency selected?",
    answer:
      "The event location should usually determine the ticket currency. For example, a vendor in Canada hosting an event in Nigeria should default to NGN for that event.",
  },
  {
    question: "Can a vendor in Canada host an event in Nigeria?",
    answer:
      "Yes. They can create the draft and set the Nigerian event location. Paid publishing should require cross-border verification and a payout setup that supports the country and currency.",
  },
  {
    question: "Where do I complete vendor verification?",
    answer:
      "Go to the vendor dashboard, then open Settings and use the Vendor Verification section. Dashboard, Create Event, and Wallet screens also show verification prompts when action is needed.",
  },
  {
    question: "What information is required for verification?",
    answer:
      "Vendors provide vendor type, legal identity, address, phone number, government ID, business details if applicable, payout setup, and cross-border hosting details if needed.",
  },
  {
    question: "Can I receive payouts before verification?",
    answer:
      "No. Payouts should stay locked until the payout owner and vendor identity are verified.",
  },
  {
    question: "What happens if verification needs more information?",
    answer:
      "The verification status changes to Needs More Info. The vendor should update the requested fields or documents and submit again for review.",
  },
  {
    question: "Do free events need full verification?",
    answer:
      "Free and registration-only events can use lighter verification, but Turnupz can still request extra checks if an event appears suspicious or high risk.",
  },
];

const FaqPage = () => {
  const [openQuestion, setOpenQuestion] = useState(faqItems[0].question);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(244,248,255,0.92)_0%,rgba(255,255,255,1)_30%)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
              FAQs
            </p>
            <h1 className="text-[clamp(1.8rem,3.2vw,2.7rem)] font-bold leading-[0.98] tracking-tight text-secondary-950">
              Vendor verification questions
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-secondary-500 sm:text-base">
              Answers about verification levels, paid publishing, cross-border
              events, currencies, payouts, and admin review.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
          >
            <Link href="/app/settings/vendor-verification">
              Start Verification
            </Link>
          </Button>
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-secondary-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          {faqItems.map((item) => {
            const isOpen = openQuestion === item.question;
            return (
              <div key={item.question} className="border-b border-secondary-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenQuestion(isOpen ? "" : item.question)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left hover:bg-secondary-50"
                >
                  <span className="text-sm font-semibold text-secondary-950 sm:text-base">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-secondary-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-6 text-secondary-600">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
};

export default memo(FaqPage);
