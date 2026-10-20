"use client";

import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { LogoWhiteSVG } from "@/assets/svg";
import { LAUNCH_AT } from "@/lib/launch";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, PartyPopper } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { CSSProperties, memo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import styles from "./coming-soon.module.css";

type TShape = {
  kind: "ring" | "tube";
  /** Position in % of the screen; size in vw, so it scales with the screen. */
  left: string;
  top: string;
  size: number;
  /** Tubes are long: height = size / ratio. */
  ratio?: number;
  rot: number;
  tilt?: number;
  /** How strongly it follows the mouse (deeper = more). */
  depth: number;
  dur: number;
  delay: number;
  blur?: number;
  hideOnPhone?: boolean;
};

const SHAPES: TShape[] = [
  { kind: "ring", left: "-8%", top: "52%", size: 34, rot: -12, tilt: 52, depth: 1.2, dur: 14, delay: 0 },
  { kind: "tube", left: "58%", top: "-6%", size: 46, ratio: 3.2, rot: 28, depth: 0.7, dur: 16, delay: -3 },
  { kind: "ring", left: "70%", top: "58%", size: 22, rot: 18, tilt: 40, depth: 1, dur: 12, delay: -5 },
  { kind: "tube", left: "8%", top: "4%", size: 26, ratio: 2.6, rot: -24, depth: 0.5, dur: 13, delay: -7, blur: 2, hideOnPhone: true },
  { kind: "ring", left: "40%", top: "-14%", size: 16, rot: 0, tilt: 60, depth: 0.4, dur: 11, delay: -2, blur: 3, hideOnPhone: true },
  { kind: "tube", left: "34%", top: "80%", size: 30, ratio: 3.4, rot: -8, depth: 0.9, dur: 15, delay: -6, hideOnPhone: true },
  { kind: "ring", left: "88%", top: "20%", size: 9, rot: 30, tilt: 30, depth: 1.5, dur: 9, delay: -1 },
];

/** The neon tubes and rings drifting behind everything, leaning towards the pointer. */
const Scene = () => (
  <div className={styles.scene} aria-hidden>
    {SHAPES.map((shape, index) => {
      const width = `${shape.size}vw`;
      const height = shape.kind === "tube" ? `${shape.size / (shape.ratio ?? 3)}vw` : width;
      return (
        <div
          key={index}
          className={cn(styles.parallax, shape.hideOnPhone && "hidden md:block")}
          style={{ left: shape.left, top: shape.top, "--depth": shape.depth } as CSSProperties}
        >
          <div
            className={styles.float}
            style={
              {
                "--dur": `${shape.dur}s`,
                "--delay": `${shape.delay}s`,
                "--rot": `${shape.rot}deg`,
                "--tilt": `${shape.tilt ?? 0}deg`,
                filter: shape.blur ? `blur(${shape.blur}px)` : undefined,
              } as CSSProperties
            }
          >
            <div className={shape.kind === "ring" ? styles.ring : styles.tube} style={{ width, height }} />
          </div>
        </div>
      );
    })}
  </div>
);

const pad = (n: number) => String(n).padStart(2, "0");
const LABELS = ["Days", "Hours", "Minutes", "Seconds"];

/** Days, hours, minutes and seconds to launch; at zero the home page takes over. */
const Countdown = () => {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = now === null ? null : Math.max(0, LAUNCH_AT.getTime() - now);
  useEffect(() => {
    if (left === 0) window.location.href = "/";
  }, [left]);

  const values =
    left === null
      ? null
      : [
          Math.floor(left / 86_400_000),
          Math.floor(left / 3_600_000) % 24,
          Math.floor(left / 60_000) % 60,
          Math.floor(left / 1000) % 60,
        ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label="Time until Turnupz opens">
      {LABELS.map((label, index) => (
        <div key={label} className={cn(styles.glass, "rounded-2xl px-2 py-3 text-center sm:py-4")}>
          <div className="h-9 overflow-hidden text-3xl font-extrabold tabular-nums sm:h-12 sm:text-5xl">
            {values ? (
              <span key={values[index]} className={styles.tick}>
                {pad(values[index])}
              </span>
            ) : (
              "--"
            )}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-xs">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Coming soon: a living neon scene, the countdown to launch, and the waitlist.
 * The home page sends people here until launch (see src/proxy.ts).
 */
const ComingSoon = () => {
  const searchParams = useSearchParams();
  const page = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [interest, setInterest] = useState<"attendee" | "organiser">("attendee");
  const [city, setCity] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | { already: boolean }>(null);

  // The shapes lean towards the pointer (or a finger on phones).
  const follow = (x: number, y: number) => {
    const el = page.current;
    if (!el) return;
    el.style.setProperty("--mx", String(x / window.innerWidth - 0.5));
    el.style.setProperty("--my", String(y / window.innerHeight - 0.5));
  };

  // On Lagos time, so it reads 19 November wherever you are.
  const launchDay = LAUNCH_AT.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });

  const join = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      const { data } = await postData<
        Record<string, string>,
        { joined: boolean; alreadyOnList: boolean }
      >("/waitlist", {
        email: email.trim(),
        ...(name.trim() ? { name: name.trim() } : {}),
        interest,
        ...(city.trim() ? { city: city.trim() } : {}),
        // e.g. turnupz.com/?ref=instagram, to see which posts bring people in.
        source: searchParams.get("ref") || "coming-soon",
      });
      setDone({ already: !!data?.data?.alreadyOnList });
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "We couldn't add you just now. Please try again.",
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const input =
    "h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-base text-white placeholder:text-white/40 outline-none transition focus:border-white/50 focus:bg-white/15";

  return (
    <main
      ref={page}
      className={styles.page}
      onPointerMove={(event) => follow(event.clientX, event.clientY)}
    >
      <Scene />
      <div className={styles.grain} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-7 sm:px-8">
        <div className="flex items-center justify-between">
          <Image src={LogoWhiteSVG} alt="Turnupz" className="h-8 w-auto sm:h-9" priority />
          <span className="hidden text-sm font-semibold text-white/70 sm:block">Opening {launchDay}</span>
        </div>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <section>
            <span
              className={cn(
                styles.rise,
                styles.glass,
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em]",
              )}
            >
              <span className={cn(styles.pulse, "size-2 rounded-full bg-[#ff5fb6]")} />
              Coming soon
            </span>
            <h1
              className={cn(styles.rise, "mt-6 text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl")}
              style={{ "--delay": "120ms" } as CSSProperties}
            >
              Something big is about to <span className={styles.gradientText}>turn up.</span>
            </h1>
            <p
              className={cn(styles.rise, "mt-5 max-w-lg text-base text-white/75 sm:text-lg")}
              style={{ "--delay": "220ms" } as CSSProperties}
            >
              Find what&apos;s on, book in a few taps, and walk in with one scan. Turnupz opens on{" "}
              <span className="font-semibold text-white">{launchDay}</span>. Join the waitlist to be first in.
            </p>
            <div className={cn(styles.rise, "mt-8 max-w-lg")} style={{ "--delay": "320ms" } as CSSProperties}>
              <Countdown />
            </div>
          </section>

          <section
            className={cn(styles.rise, styles.glass, "rounded-3xl p-6 sm:p-8")}
            style={{ "--delay": "420ms" } as CSSProperties}
          >
            {done ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-white/15">
                  <PartyPopper className="size-8" />
                </div>
                <h2 className="mt-5 text-2xl font-extrabold">
                  {done.already ? "You're already on the list" : "You're on the list!"}
                </h2>
                <p className="mt-2 max-w-sm text-sm text-white/70">
                  We&apos;ll email <span className="font-semibold text-white">{email.trim()}</span> the moment
                  Turnupz opens on {launchDay}. Bring your friends along.
                </p>
              </div>
            ) : (
              <form onSubmit={join} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold">Join the waitlist</h2>
                  <p className="mt-1 text-sm text-white/60">One email when we open. No spam.</p>
                </div>

                <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1">
                  {(
                    [
                      { value: "attendee", label: "I go to events" },
                      { value: "organiser", label: "I host events" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setInterest(option.value)}
                      className={cn(
                        "h-10 rounded-lg text-sm font-semibold transition",
                        interest === option.value ? "bg-white text-[#0a0420]" : "text-white/70 hover:text-white",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  aria-label="Email"
                  autoComplete="email"
                  className={input}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name (optional)"
                    aria-label="Name"
                    autoComplete="given-name"
                    className={input}
                  />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (optional)"
                    aria-label="City"
                    autoComplete="address-level2"
                    className={input}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending || !email.trim()}
                  className={cn(
                    styles.cta,
                    "flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold text-white disabled:opacity-50",
                  )}
                >
                  {sending && <Loader2 className="size-5 animate-spin" />}
                  {sending ? "Adding you…" : "Notify me"}
                  {!sending && <ArrowRight className="size-5" />}
                </button>
                <p className="text-center text-xs text-white/45">
                  By joining you agree to hear from Turnupz about our launch.
                </p>
              </form>
            )}
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/50">
          <span>© {new Date().getFullYear()} Turnupz</span>
          <span className="sm:hidden">Opening {launchDay}</span>
        </div>
      </div>
    </main>
  );
};

export default memo(ComingSoon);
