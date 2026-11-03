import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import { PRICING, FEE_LABEL } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import React from "react";
import Reveal from "../home/landing/reveal";
import FeeCalculator from "./fee-calculator";

const STARS = Array.from({ length: 20 }, (_, index) => ({
  top: `${(index * 43 + 9) % 100}%`,
  left: `${(index * 59 + 17) % 100}%`,
  size: index % 4 === 0 ? 3 : 2,
  delay: `${(index % 6) * 0.7}s`,
}));

const INCLUDED = [
  "Unlimited events and ticket tiers",
  "Public and private tickets",
  "Door scanning from any phone",
  "A group chat for every event",
  "Sales and check-in analytics",
  "Your events in the Turnupz app",
];

const PLANS = [
  {
    name: "Free events",
    price: "₦0",
    unit: "always",
    body: "Running a free event? It costs nothing, however many people you let in.",
    cta: { label: "List a free event", href: ROUTES.VENDOR_LOGIN.href },
  },
  {
    name: "Paid events",
    price: FEE_LABEL,
    unit: "per ticket sold",
    body: "Only pay when you sell: it comes off each ticket, and your share is paid straight to your bank.",
    cta: { label: "Start selling", href: ROUTES.VENDOR_LOGIN.href },
    featured: true,
  },
  {
    name: "Big or recurring",
    price: "Let's talk",
    unit: "custom rates",
    body: "Festivals, tours and venues with a full calendar can get rates built around them.",
    cta: { label: "Contact us", href: ROUTES.CONTACT.href },
  },
];

const FAQS = [
  {
    q: "Is it really free for free events?",
    a: "Yes. If your tickets are free, Turnupz charges nothing, for any number of attendees.",
  },
  {
    q: "Who pays the fee on paid tickets?",
    a: "You do, from each ticket you sell. Buyers pay your ticket price, our payment partner pays your share straight to your bank, and Turnupz keeps only its fee. We never hold your money.",
  },
  {
    q: `How is ${FEE_LABEL} worked out?`,
    a: `It's ${FEE_LABEL} of each paid ticket's price, after any promo code, with no flat fee. A ₦5,000 ticket carries a ₦${(5000 * PRICING.percent).toLocaleString("en-NG")} fee.`,
  },
  {
    q: "What about tax?",
    a: "As the seller, you're responsible for any tax on your tickets: VAT in Nigeria, and GST/HST (plus QST in Québec, or PST on qualifying Saskatchewan admissions) in Canada, where you're registered to collect it. Turnupz's fee is worked out on your ticket price before that tax, and where tax applies to our fee, it's added to the fee. We'll ask for your tax registration details before tax is added to your tickets.",
  },
  {
    q: "Are there setup or monthly fees?",
    a: "No. There's nothing to pay to sign up, create events or use the organiser tools. You only pay on paid tickets you sell.",
  },
];

const PricingPage = () => (
  <div>
    <section className="relative isolate overflow-hidden bg-secondary-950 pb-48">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="animate-landing-twinkle absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
          />
        ))}
        <div className="absolute -top-48 left-1/4 size-[32rem] rounded-full bg-secondary/25 blur-[120px]" />
        <div className="absolute -right-32 -bottom-40 size-[34rem] rounded-full bg-primary/25 blur-[130px]" />
      </div>
      <SectionContainer className="flex flex-col items-center gap-5 pt-36 text-center md:pt-44">
        <p className="text-sm font-semibold tracking-wider text-primary-300 uppercase">
          Pricing
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Free to list.{" "}
          <span className="bg-linear-to-r from-secondary-300 via-primary-300 to-primary bg-clip-text text-transparent">
            Pay only when you sell.
          </span>
        </h1>
        <p className="max-w-xl text-white/60">
          No setup fees and no subscriptions. Free events are free, and paid
          tickets carry one simple fee of {FEE_LABEL}.
        </p>
      </SectionContainer>
    </section>

    {/* The calculator rides up over the hero. */}
    <section className="bg-[#f7f9fc] pb-20 md:pb-28">
      <SectionContainer className="relative z-10 -mt-36 space-y-20 md:space-y-28">
        <Reveal>
          <FeeCalculator />
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 90}>
              <div
                className={cn(
                  "relative flex h-full flex-col gap-6 overflow-hidden rounded-[2rem] p-8 ring-1 transition-transform duration-300 hover:-translate-y-1",
                  plan.featured
                    ? "bg-secondary-950 text-white ring-white/10 shadow-[0_40px_80px_-40px_rgba(5,119,250,0.55)]"
                    : "bg-white text-secondary-950 ring-black/5",
                )}
              >
                {plan.featured && (
                  <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-primary/30 blur-[70px]" />
                )}
                <div className="relative space-y-2">
                  <p className={cn("font-semibold", plan.featured ? "text-primary-300" : "text-primary")}>
                    {plan.name}
                  </p>
                  <p className="text-4xl font-bold tracking-tight">{plan.price}</p>
                  <p className={cn("text-sm", plan.featured ? "text-white/55" : "text-secondary-950/55")}>
                    {plan.unit}
                  </p>
                </div>
                <p className={cn("relative", plan.featured ? "text-white/75" : "text-secondary-950/65")}>
                  {plan.body}
                </p>
                <Button
                  asChild
                  className={cn(
                    "group relative mt-auto h-11 rounded-full",
                    plan.featured
                      ? "bg-linear-to-r from-secondary to-primary text-white hover:opacity-95"
                      : "bg-secondary-950 text-white hover:bg-secondary-900",
                  )}
                >
                  <Link href={plan.cta.href}>
                    {plan.cta.label}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">
              Every event gets
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-secondary-950 md:text-4xl">
              All the tools, on every event.
            </h2>
            <p className="text-secondary-950/60">
              No plans to compare or features to unlock.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="size-4" aria-hidden />
                </span>
                <span className="font-medium text-secondary-950">{item}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mx-auto max-w-3xl space-y-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-secondary-950 md:text-4xl">
            Questions, answered
          </h2>
          <div className="divide-y divide-secondary-100 overflow-hidden rounded-[2rem] bg-white ring-1 ring-black/5">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-secondary-950">
                  {q}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-800 transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-7 text-secondary-950/65">{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </SectionContainer>
    </section>
  </div>
);

export default PricingPage;
