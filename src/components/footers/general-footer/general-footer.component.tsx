import { LogoWhiteSVG } from "@/assets/svg";
import SectionContainer from "@/components/layouts/section-container/section-container";
import StoreBadges from "@/components/ui/store-badges";
import { ROUTES } from "@/lib/variables";
import Image from "next/image";
import Link from "next/link";
import React, { memo } from "react";

// Only pages that exist. Add a link here once its page does.
const COLUMNS = [
  {
    title: "Discover",
    links: [
      { label: "Explore events", href: ROUTES.EXPLORE.href },
      { label: "Venues", href: `${ROUTES.EXPLORE.href}?tab=venues` },
      { label: "Pricing", href: ROUTES.PRICING.href },
    ],
  },
  {
    title: "Organisers",
    links: [
      { label: "Host an event", href: ROUTES.SIGNUP.href },
      { label: "Log in", href: ROUTES.LOGIN.href },
      { label: "FAQs", href: ROUTES.FAQS.href },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: ROUTES.ABOUT_US.href },
      { label: "Contact us", href: ROUTES.CONTACT.href },
      { label: "Terms of Service", href: ROUTES.TERMS_OF_SERVICE.href },
      { label: "Privacy Policy", href: ROUTES.PRIVACY_POLICY.href },
    ],
  },
];

const GeneralFooterComponent = () => (
  <footer className="relative isolate overflow-hidden bg-secondary-950 text-white">
    <div
      aria-hidden
      className="pointer-events-none absolute -top-40 left-1/3 -z-10 size-[30rem] rounded-full bg-primary/10 blur-[120px]"
    />
    <SectionContainer className="grid gap-12 py-16 md:grid-cols-[1.2fr_2fr] md:gap-16">
      <div className="space-y-5">
        <Link
          href={ROUTES.HOME.href}
          aria-label="Turnupz home"
          className="inline-block"
        >
          <Image src={LogoWhiteSVG} alt="Turnupz" className="h-9 w-auto" />
        </Link>
        <p className="max-w-xs text-sm leading-6 text-white/60">
          Find what&apos;s on, book in a few taps and walk in with one scan.
          Made for your phone.
        </p>
        <StoreBadges tone="light" />
      </div>

      <nav
        aria-label="Footer"
        className="grid grid-cols-2 gap-8 sm:grid-cols-3"
      >
        {COLUMNS.map((column) => (
          <div key={column.title} className="space-y-4">
            <h3 className="text-xs font-semibold tracking-[0.2em] text-white/45 uppercase">
              {column.title}
            </h3>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </SectionContainer>

    <SectionContainer className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
      <p>
        &copy; {new Date().getFullYear()} Turnupz. All rights reserved.
        {/* Kept quiet: it's for staff, not visitors. */}
        <span className="mx-2 text-white/20">·</span>
        <Link
          href={ROUTES.ADMIN_LOGIN.href}
          className="transition-colors hover:text-white"
        >
          Admin login
        </Link>
      </p>
      <p>
        <span className="bg-linear-to-r from-secondary-300 to-primary-300 bg-clip-text font-semibold text-transparent">
          Turning up
        </span>{" "}
        since day one.
      </p>
    </SectionContainer>
  </footer>
);

export default memo(GeneralFooterComponent);
