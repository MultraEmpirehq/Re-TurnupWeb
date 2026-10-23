"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { LogoWhiteSVG } from "@/assets/svg";
import { Country } from "country-state-city";
import { cn } from "@/lib/utils";
import {
  getVisitorCountingConsent,
  setVisitorCountingConsent,
} from "@/lib/visitor-id";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Cookie,
  Loader2,
  Megaphone,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { CSSProperties, memo, useEffect, useState } from "react";
import styles from "./coming-soon.module.css";

const PRIORITY_COUNTRY_CODES = ["CA", "GB", "NG", "US"];
const COUNTRIES = Country.getAllCountries().sort((a, b) => {
  const aPriority = PRIORITY_COUNTRY_CODES.indexOf(a.isoCode);
  const bPriority = PRIORITY_COUNTRY_CODES.indexOf(b.isoCode);
  if (aPriority !== -1 || bPriority !== -1) {
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    return aPriority - bPriority;
  }
  return a.name.localeCompare(b.name);
});

const FEATURES = [
  { icon: Compass, label: "Find events worth turning up for" },
  { icon: Users, label: "Plan it with your people" },
  { icon: Ticket, label: "Host and sell tickets" },
];

const ROLES = [
  { value: "attendee", label: "Attendee", icon: Ticket },
  { value: "organiser", label: "Organizer", icon: Megaphone },
  { value: "both", label: "Both", icon: Sparkles },
] as const;

/** An oversized, extruded logo framed by a single blue orbit. */
const LogoLoop = () => (
  <div className={styles.logoLoop} aria-hidden="true">
    <Image src={LogoWhiteSVG} alt="" width={137} height={43} priority />
  </div>
);

/**
 * Coming soon: the waitlist landing page and signup form.
 * The home page sends people here until launch (see src/proxy.ts).
 */
const ComingSoon = () => {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"attendee" | "organiser" | "both">("attendee");
  const [country, setCountry] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [launchEmails, setLaunchEmails] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [personalizationConsent, setPersonalizationConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [showCookieNotice, setShowCookieNotice] = useState(false);
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [allowVisitorCounting, setAllowVisitorCounting] = useState(false);

  useEffect(() => {
    const consent = getVisitorCountingConsent();
    setAllowVisitorCounting(consent === true);
    setShowCookieNotice(consent === null);
  }, []);

  const saveCookieChoice = (allowVisitorCounting: boolean) => {
    setVisitorCountingConsent(allowVisitorCounting);
    setAllowVisitorCounting(allowVisitorCounting);
    setShowCookieNotice(false);
    setShowCookieSettings(false);
  };

  const join = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedCountry = COUNTRIES.find(
      (item) => item.name.toLocaleLowerCase() === country.trim().toLocaleLowerCase(),
    );
    if (!selectedCountry) {
      setSubmitError("Choose a country from the suggestions so we can record the correct country.");
      return;
    }
    setSubmitError("");
    setSending(true);
    try {
      const { data } = await postData<
        Record<string, string | boolean>,
        { joined: boolean; alreadyOnList: boolean }
      >("/waitlist", {
        email: email.trim().toLowerCase(),
        ...(name.trim() ? { name: name.trim() } : {}),
        interest: role,
        role,
        country: selectedCountry.name,
        countryCode: selectedCountry.isoCode,
        termsAccepted,
        launchEmails,
        marketingConsent,
        newsletterConsent,
        researchConsent,
        personalizationConsent,
        privacyNoticeVersion: "1.2",
        // e.g. turnupz.com/?ref=instagram, to see which posts bring people in.
        source: searchParams.get("ref") || "coming-soon",
      });
      if (!data?.data?.joined && !data?.data?.alreadyOnList) {
        throw new Error("The signup could not be confirmed. Please try again.");
      }
      setDone(true);
    } catch (error) {
      setSubmitError(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "We couldn't submit your request just now. Your entries are still here—please try again.",
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const input =
    "h-12 w-full rounded-xl border border-white/20 bg-[#061a36]/75 px-4 text-base text-white placeholder:text-white/50 outline-none transition focus:border-[#00b2ff] focus:ring-2 focus:ring-[#00b2ff]/30";

  return (
    <main className={styles.page}>
      <LogoLoop />

      <div className={cn(styles.layout, "relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 sm:py-7")}>
        <header className="flex items-center justify-between gap-5">
          <a href="#top" aria-label="TurnUpz home">
            <Image src={LogoWhiteSVG} alt="TurnUpz" className="h-8 w-auto sm:h-9" priority />
          </a>
        </header>

        <div id="top" className={cn(styles.contentGrid, "grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14")}>
          <section className={styles.hero} aria-labelledby="hero-heading">
            <span
              className={cn(
                styles.rise,
                styles.glass,
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm",
              )}
            >
              <span className={cn(styles.pulse, "size-2 rounded-full bg-[#00b2ff]")} />
              Coming soon
            </span>
            <h1
              id="hero-heading"
              className={cn(styles.rise, "mt-6 max-w-3xl text-[3.25rem] font-extrabold leading-[0.98] tracking-tight sm:text-7xl xl:text-[5.75rem]")}
              style={{ "--delay": "120ms" } as CSSProperties}
            >
              Your next great experience <span className={styles.gradientText}>starts here.</span>
            </h1>
            <p
              className={cn(styles.rise, "mt-6 max-w-xl text-lg leading-8 text-white/80 sm:text-xl")}
              style={{ "--delay": "220ms" } as CSSProperties}
            >
              Discover events, make plans with your people, and find your next reason to turn up.
            </p>
            <ul
              className={cn(styles.rise, styles.features)}
              style={{ "--delay": "320ms" } as CSSProperties}
            >
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <section
            id="waitlist"
            aria-labelledby="waitlist-heading"
            className={cn(styles.rise, styles.glass, styles.ticket, "scroll-mt-6")}
            style={{ "--delay": "420ms" } as CSSProperties}
          >
            {/* The stub at the top; the notches in .ticket line up with its bottom edge. */}
            <div className={styles.ticketStub} aria-hidden="true">
              <span className="flex items-center gap-2">
                <Ticket size={15} />
                Waitlist pass
              </span>
              <span>{done ? "Confirmed" : "Admit one"}</span>
            </div>

            <div className={styles.ticketBody}>
              {done ? (
                <div className="flex flex-col items-center py-6 text-center" role="status" aria-live="polite">
                  <div className="flex size-14 items-center justify-center rounded-full bg-[#00b2ff]/15 text-[#66d1ff]">
                    <BadgeCheck className="size-8" aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">You&apos;re on the list</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">
                    One last step: open the email we just sent to confirm your pass.
                  </p>
                  <div className={styles.barcode} aria-hidden="true" />
                </div>
              ) : (
                <form onSubmit={join} className={styles.form} aria-describedby="collection-notice">
                  <div>
                    <h2 id="waitlist-heading" className="text-2xl font-extrabold sm:text-3xl">Save your spot</h2>
                    <p className="mt-1 text-sm leading-6 text-white/70">Be first in when TurnUpz opens its doors.</p>
                  </div>

                  <div className={cn(styles.formFields, "grid gap-4 sm:grid-cols-2")}>
                    <div className={styles.formField}>
                      <label htmlFor="waitlist-email" className="mb-1.5 block text-sm font-semibold">Email address <span aria-hidden="true">*</span></label>
                      <input
                        id="waitlist-email"
                        type="email"
                        required
                        maxLength={254}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={input}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="waitlist-name" className="mb-1.5 block text-sm font-semibold">First name <span className="font-normal text-white/55">(optional)</span></label>
                      <input
                        id="waitlist-name"
                        value={name}
                        maxLength={100}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your first name"
                        autoComplete="given-name"
                        className={input}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="waitlist-country" className="mb-1.5 block text-sm font-semibold">Country <span aria-hidden="true">*</span></label>
                      <input
                        id="waitlist-country"
                        list="waitlist-countries"
                        required
                        value={country}
                        onChange={(event) => setCountry(event.target.value)}
                        placeholder="Search countries"
                        autoComplete="country-name"
                        className={input}
                      />
                      <datalist id="waitlist-countries">
                        {COUNTRIES.map((item) => <option key={item.isoCode} value={item.name} />)}
                      </datalist>
                    </div>
                    <div className={styles.formField}>
                      <fieldset>
                        <legend className="mb-1.5 text-sm font-semibold">I&apos;m here as <span aria-hidden="true">*</span></legend>
                        <div className={styles.roles}>
                          {ROLES.map(({ value, label, icon: Icon }) => (
                            <label key={value}>
                              <input
                                type="radio"
                                name="waitlist-role"
                                value={value}
                                checked={role === value}
                                onChange={() => setRole(value)}
                                className="peer sr-only"
                              />
                              <span>
                                <Icon size={15} aria-hidden="true" />
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </div>

                  <fieldset className={styles.requiredChoices}>
                    <legend className="sr-only">Before you join</legend>
                    <label className={styles.requiredChoice}>
                      <input
                        type="checkbox"
                        required
                        checked={termsAccepted}
                        onChange={(event) => setTermsAccepted(event.target.checked)}
                      />
                      <span>I&apos;m 18 or older and agree to the{" "}
                        <a href="/terms" target="_blank" rel="noreferrer">Waitlist Terms<span className="sr-only"> (opens in a new tab)</span></a> and{" "}
                        <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy<span className="sr-only"> (opens in a new tab)</span></a>.
                      </span>
                    </label>
                    <label className={styles.requiredChoice}>
                      <input
                        type="checkbox"
                        required
                        checked={launchEmails}
                        onChange={(event) => setLaunchEmails(event.target.checked)}
                      />
                      <span>Email me when TurnUpz launches and about early access. Unsubscribe anytime.</span>
                    </label>
                  </fieldset>

                  <details className={styles.optionalPrefs}>
                    <summary>
                      <Sparkles size={15} aria-hidden="true" />
                      More from TurnUpz <span className="font-normal text-white/55">(optional)</span>
                    </summary>
                    <div className="mt-4 space-y-4 text-xs leading-5 text-white/75">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-[#00b2ff]" />
                        <span>I would like Turnupz Inc to email me TurnUpz event recommendations, product updates, discounts, giveaways, referral campaigns, promotional codes and selected partner offers. Multra Innovation Empire Ltd may prepare or send these TurnUpz communications on its behalf. This does not subscribe me to unrelated Multra promotions or give partners permission to contact me directly.</span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={newsletterConsent} onChange={(event) => setNewsletterConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-[#00b2ff]" />
                        <span>I would like TurnUpz email newsletters with event inspiration, community stories and company news. Newsletters may contain promotional content.</span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={researchConsent} onChange={(event) => setResearchConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-[#00b2ff]" />
                        <span>I agree that TurnUpz may use my contact details, country, role and any interests I provide to select and email me invitations to surveys, interviews, focus groups, usability tests and product or market research. Participation is voluntary and each study will explain any further collection and use.</span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={personalizationConsent} onChange={(event) => setPersonalizationConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-[#00b2ff]" />
                        <span>I agree that TurnUpz may use my country, role and stated event interests to group me with people with similar preferences and personalize the promotional emails I have chosen to receive.</span>
                      </label>
                    </div>
                  </details>

                  {submitError && (
                    <p className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
                      {submitError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className={cn(
                      styles.cta,
                      "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  >
                    {sending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                    {sending ? "Saving your spot…" : "Claim my pass"}
                    {!sending && <ArrowRight className="size-5" aria-hidden="true" />}
                  </button>
                  <p id="collection-notice" className={styles.finePrint}>
                    Turnupz Inc uses your email, country and role only for the waitlist.
                  </p>
                </form>
              )}
            </div>
          </section>
        </div>

        <footer className="border-t border-white/10 py-5 text-sm text-white/65">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-semibold text-white">© {new Date().getFullYear()} TurnUpz</p>
              <p className="mt-1">Turnupz Inc operates TurnUpz.</p>
            </div>
            <nav aria-label="Footer links" className="flex flex-wrap gap-x-5 gap-y-3">
              <a className="underline-offset-4 hover:text-white hover:underline" href="mailto:support@turnupz.com">Contact</a>
              <a className="underline-offset-4 hover:text-white hover:underline" href="/terms">Waitlist Terms</a>
              <a className="underline-offset-4 hover:text-white hover:underline" href="/privacy-policy">Privacy Policy</a>
              <a className="underline-offset-4 hover:text-white hover:underline" href="mailto:support@turnupz.com?subject=TurnUpz%20email%20preferences">Manage email preferences</a>
              <button
                className="underline-offset-4 hover:text-white hover:underline"
                type="button"
                onClick={() => {
                  setAllowVisitorCounting(getVisitorCountingConsent() === true);
                  setShowCookieSettings(true);
                  setShowCookieNotice(true);
                }}
              >
                Cookie settings
              </button>
            </nav>
          </div>
        </footer>
      </div>

      {showCookieNotice && (
        <aside className={cn(styles.cookieNotice, styles.glass)} aria-labelledby="cookie-notice-title">
          <span className={styles.cookieIcon} aria-hidden="true">
            <Cookie size={20} />
          </span>
          <div className={styles.cookieText}>
            <p id="cookie-notice-title" className="font-bold text-white">Cookies, kept simple</p>
            <p className="mt-0.5 text-white/75">
              Essential cookies keep this page working. With your OK, a random ID also counts visits, never who you are. No ads, no third-party trackers.
            </p>
            {showCookieSettings && (
              <label className={styles.cookiePreference}>
                <input
                  type="checkbox"
                  checked={allowVisitorCounting}
                  onChange={(event) => setAllowVisitorCounting(event.target.checked)}
                />
                <span>Allow the random visit counter</span>
              </label>
            )}
          </div>
          <div className={styles.cookieActions}>
            {showCookieSettings ? (
              <button className={styles.cookieButton} type="button" onClick={() => saveCookieChoice(allowVisitorCounting)}>
                Save
              </button>
            ) : (
              <>
                <button className={styles.cookieButton} type="button" onClick={() => saveCookieChoice(true)}>
                  Allow
                </button>
                <button className={styles.cookieGhostButton} type="button" onClick={() => saveCookieChoice(false)}>
                  Essential only
                </button>
              </>
            )}
          </div>
          {/* Closing without choosing saves nothing, so visitor counting stays off and we ask again next visit. */}
          <button
            type="button"
            className={styles.cookieClose}
            aria-label="Close cookie notice"
            onClick={() => {
              setShowCookieNotice(false);
              setShowCookieSettings(false);
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </aside>
      )}
    </main>
  );
};

export default memo(ComingSoon);
