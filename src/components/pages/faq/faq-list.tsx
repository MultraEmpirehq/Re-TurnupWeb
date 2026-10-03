"use client";

import { getData } from "@/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import React, { memo, useState } from "react";

interface IFaqItem {
  id: string;
  question: string;
  answer: string;
}

// Written here rather than in the api because they describe how verification works
// in this app; the general FAQs come from the api, where admins manage them.
const VENDOR_VERIFICATION_FAQS: IFaqItem[] = [
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
].map((item, index) => ({ ...item, id: `vendor-verification-${index}` }));

const FaqSection: React.FC<{
  title: string;
  items: IFaqItem[];
  openId: string | null;
  onToggle: (id: string) => void;
}> = ({ title, items, openId, onToggle }) => (
  <section className="space-y-3">
    <h2 className="text-xs font-semibold tracking-[0.28em] text-secondary-400 uppercase">
      {title}
    </h2>
    <div className="overflow-hidden rounded-[1.75rem] border border-secondary-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const panelId = `faq-panel-${item.id}`;
        return (
          <div
            key={item.id}
            className="border-b border-secondary-100 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left hover:bg-secondary-50"
            >
              <span className="text-sm font-semibold text-secondary-950 sm:text-base">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-secondary-400 transition-transform",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {isOpen && (
              <div
                id={panelId}
                className="px-5 pb-5 text-sm leading-6 whitespace-pre-line text-secondary-600"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </section>
);

/**
 * Every FAQ in one place: the general ones admins manage through the api, then the
 * vendor verification ones. Shared by the public FAQ page and the account help tab.
 */
const FaqList = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, error, refetch, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data } = await getData<IFaqItem[]>("/faqs");
      return data?.data ?? [];
    },
  });
  const generalFaqs = data ?? [];

  const handleToggle = (id: string) =>
    setOpenId((current) => (current === id ? null : id));

  return (
    <div className="space-y-10">
      {isLoading && (
        <section className="space-y-3">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </section>
      )}

      {error && (
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-secondary-100 bg-secondary-50 p-5 text-sm text-secondary-600 sm:flex-row sm:items-center sm:justify-between">
          <p>We couldn&apos;t load the general FAQs right now.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="w-fit rounded-xl border-secondary-200"
          >
            Try again
          </Button>
        </div>
      )}

      {generalFaqs.length > 0 && (
        <FaqSection
          title="General"
          items={generalFaqs}
          openId={openId}
          onToggle={handleToggle}
        />
      )}

      <FaqSection
        title="Vendor verification"
        items={VENDOR_VERIFICATION_FAQS}
        openId={openId}
        onToggle={handleToggle}
      />
    </div>
  );
};

export default memo(FaqList);
