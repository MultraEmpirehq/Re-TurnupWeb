import type { Metadata } from "next";
import Link from "next/link";
import { memo } from "react";

// Written from what the website actually stores (as of 3 November 2026): the
// cookies below and the keys it keeps in the browser's local storage. Keep it
// in step when something new is stored. Counsel should review it before launch.

export const metadata: Metadata = {
  title: "Cookie Policy | Turnupz",
  description:
    "The cookies and browser storage Turnupz uses, why, how long they last, and how to clear them.",
};

const LAST_UPDATED = "3 November 2026";

type TRow = { name: string; what: string; lasts: string };

const COOKIES: TRow[] = [
  {
    name: "auth_token",
    what: "Keeps you signed in. Set by our server, unreadable by scripts, and only sent to Turnupz.",
    lasts: "Until you sign out, or 7 days",
  },
  {
    name: "sidebar_state",
    what: "Remembers whether you left the dashboard menu open or closed.",
    lasts: "7 days",
  },
  {
    name: "tz_preview",
    what: "Lets our team see the site before it opens to everyone.",
    lasts: "60 days",
  },
];

const STORAGE: TRow[] = [
  {
    name: "user-store",
    what: "Your session on this device: who's signed in, so pages load as you.",
    lasts: "Until you sign out",
  },
  {
    name: "vendor-workspace",
    what: "For organisers' team members: which organiser you're working for.",
    lasts: "Until you switch or sign out",
  },
  {
    name: "turnupz-event-form:…",
    what: "A copy of an event you're creating, so nothing is lost if the page closes.",
    lasts: "Until you publish or discard it",
  },
  {
    name: "turnupz-visitor",
    what: "A random number used to count visits, only if you allow visitor counting. It doesn't identify you.",
    lasts: "Until you clear it or turn counting off",
  },
  {
    name: "turnupz-visitor-counting-consent",
    what: "Your answer to whether visits may be counted.",
    lasts: "Until you clear it",
  },
  {
    name: "turnupz-share-refs, turnupz-invite, turnupz-event-arrivals",
    what: "Which shared link or invite brought you here, so the person who shared it can be credited.",
    lasts: "7 days",
  },
  {
    name: "turnupz-server-offset-ms",
    what: "The difference between your device's clock and ours, so live ticket codes change on time.",
    lasts: "Until you clear it",
  },
  {
    name: "Display settings",
    what: "Choices like hiding amounts in your wallet, your dashboard currency and period, the place you browse events in, and notifications you've seen.",
    lasts: "Until you change or clear them",
  },
];

const THIRD_PARTIES = [
  "Stripe: organisers in Canada set up and manage payouts in Stripe's own screens on our site, and Stripe sets cookies there to keep that secure and prevent fraud.",
  "Flutterwave and Stripe checkout: when you pay, you're on their page, under their cookie policies.",
  "Google: if you sign in with Google, Google's sign-in uses its own cookies.",
];

const Table = ({ rows }: { rows: TRow[] }) => (
  <dl className="mt-4 divide-y divide-secondary-100 overflow-hidden rounded-xl border border-secondary-100">
    {rows.map((row) => (
      <div key={row.name} className="grid gap-1 px-4 py-3 text-sm leading-6 md:grid-cols-[1.2fr_2.4fr_1.2fr] md:gap-6">
        <dt className="font-mono text-xs text-secondary-800 md:pt-0.5">{row.name}</dt>
        <dd className="text-secondary-600">{row.what}</dd>
        <dd className="text-muted-foreground">{row.lasts}</dd>
      </div>
    ))}
  </dl>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <article className="rounded-[1.6rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
    <h2 className="text-xl font-bold text-secondary-950">{title}</h2>
    {children}
  </article>
);

const CookiePolicyPage = () => (
  <main className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
    <section className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Turnupz Policies
      </p>
      <h1 className="text-4xl font-bold tracking-tight text-secondary-950 md:text-5xl">
        Cookie Policy
      </h1>
      <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
        The small files and browser storage our website uses, why, and how long
        they last. Last updated {LAST_UPDATED}.
      </p>
    </section>

    <section className="grid gap-5">
      <Card title="In short">
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-secondary-600">
          <li>We use cookies and browser storage to keep you signed in, remember your settings and keep your work safe.</li>
          <li>We don&apos;t use advertising cookies, and we don&apos;t let advertisers track you on Turnupz.</li>
          <li>We count visits only if you allow it, with a random number that doesn&apos;t identify you.</li>
        </ul>
      </Card>
      <Card title="Cookies">
        <p className="mt-3 text-sm leading-7 text-secondary-600">
          All of these are needed for the site to work, so they don&apos;t need your consent.
        </p>
        <Table rows={COOKIES} />
      </Card>
      <Card title="Browser storage">
        <p className="mt-3 text-sm leading-7 text-secondary-600">
          Your browser&apos;s local storage stays on your device and isn&apos;t sent to us
          unless a page needs it (for example, to load your account).
        </p>
        <Table rows={STORAGE} />
      </Card>
      <Card title="Other companies">
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-secondary-600">
          {THIRD_PARTIES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
      <Card title="Your choices">
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-secondary-600">
          <li>Turn visitor counting on or off when we ask, or by clearing this site&apos;s data.</li>
          <li>Clear cookies and site data in your browser settings at any time. You&apos;ll be signed out, and settings go back to how they started.</li>
          <li>Blocking the cookies above stops sign-in and some pages from working.</li>
        </ul>
      </Card>
    </section>

    <p className="text-sm text-muted-foreground">
      See also our{" "}
      <Link href="/privacy-policy" className="font-semibold text-primary underline">
        Privacy Policy
      </Link>
      . Questions? Use our{" "}
      <Link href="/contact" className="font-semibold text-primary underline">
        contact form
      </Link>
      .
    </p>
  </main>
);

export default memo(CookiePolicyPage);
