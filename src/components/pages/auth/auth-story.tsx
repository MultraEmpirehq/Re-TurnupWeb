"use client";

import { cn } from "@/lib/utils";
import { Check, Heart, Search, Send, Ticket } from "lucide-react";
import React, { memo, useEffect, useState } from "react";

const CHAPTER_MS = 4800;

const CHAPTERS = [
  {
    title: "Find it",
    line: "Browse what's on tonight and heart the ones you like.",
  },
  { title: "Book it", line: "Pick a ticket and pay in a few taps." },
  { title: "Link up", line: "Chat with everyone going before you arrive." },
  { title: "Turn up", line: "One scan at the door and you're in." },
] as const;

// Each element enters on its own beat; the chapter's key remounts them so the
// animations replay every time the chapter comes round.
const enter = (delay: number) => ({ animationDelay: `${delay}ms` });
const IN =
  "animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-500";

const FindScreen = () => (
  <div className="space-y-3 p-4">
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-full bg-secondary-50 px-3 text-[11px] text-secondary-400",
        IN,
      )}
    >
      <Search className="size-3.5" aria-hidden />
      What&apos;s on tonight?
    </div>
    {[
      {
        name: "Afrobeats Live",
        tone: "from-secondary-300 to-secondary-600",
        when: "Tonight · 9pm",
      },
      {
        name: "Rooftop Sessions",
        tone: "from-primary-200 to-primary-500",
        when: "Fri · 8pm",
        liked: true,
      },
      {
        name: "Laugh Out Loud",
        tone: "from-amber-200 to-orange-400",
        when: "Sat · 7pm",
      },
    ].map((event, index) => (
      <div
        key={event.name}
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-secondary-50",
          IN,
        )}
        style={enter(250 + index * 220)}
      >
        <div
          className={cn(
            "size-12 shrink-0 rounded-xl bg-linear-to-br",
            event.tone,
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-secondary-950">
            {event.name}
          </p>
          <p className="text-[10px] text-secondary-950/50">{event.when}</p>
        </div>
        <Heart
          aria-hidden
          className={cn(
            "size-4",
            event.liked
              ? "animate-landing-pop fill-primary text-primary"
              : "text-secondary-200",
          )}
          style={event.liked ? enter(1500) : undefined}
        />
      </div>
    ))}
  </div>
);

const BookScreen = () => (
  <div className="flex h-full flex-col gap-2.5 p-4">
    <div
      className={cn(
        "h-24 rounded-2xl bg-linear-to-br from-primary-200 to-primary-500",
        IN,
      )}
    />
    <p
      className={cn("text-[12px] font-bold text-secondary-950", IN)}
      style={enter(150)}
    >
      Rooftop Sessions
    </p>
    {["Regular", "VIP", "Table for 4"].map((tier, index) => (
      <div
        key={tier}
        className={cn(
          "flex items-center justify-between rounded-xl border px-3 py-2 text-[11px] font-semibold transition-colors duration-500",
          index === 1
            ? "border-primary bg-primary-50 text-primary-700"
            : "border-secondary-100 text-secondary-800",
          IN,
        )}
        style={enter(300 + index * 150)}
      >
        {tier}
        <span
          className={cn(
            "size-3.5 rounded-full border-2",
            index === 1
              ? "animate-landing-pop border-primary bg-primary"
              : "border-secondary-200",
          )}
          style={index === 1 ? enter(1000) : undefined}
        />
      </div>
    ))}
    <div
      className={cn(
        "mt-auto rounded-full bg-secondary-950 py-2.5 text-center text-[11px] font-semibold text-white",
        IN,
      )}
      style={enter(1300)}
    >
      Pay and get ticket
    </div>
  </div>
);

const ChatScreen = () => (
  <div className="flex h-full flex-col">
    <div className={cn("border-b border-secondary-50 px-4 py-3", IN)}>
      <p className="text-[12px] font-bold text-secondary-950">
        Rooftop Sessions
      </p>
      <p className="text-[10px] text-emerald-600">248 going · 31 online</p>
    </div>
    <div className="flex-1 space-y-2.5 p-4">
      {[
        {
          from: "Tolu",
          text: "Who's pulling up early? 👀",
          mine: false,
          tone: "bg-amber-300",
        },
        { from: "You", text: "Me! Getting there at 8", mine: true },
        {
          from: "Kemi",
          text: "Same, see you at the bar 🍹",
          mine: false,
          tone: "bg-sky-300",
        },
        {
          from: "Dayo",
          text: "This DJ line-up is mad 🔥",
          mine: false,
          tone: "bg-pink-300",
        },
      ].map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex items-end gap-2",
            message.mine && "justify-end",
            IN,
          )}
          style={enter(300 + index * 520)}
        >
          {!message.mine && (
            <span
              className={cn("size-5 shrink-0 rounded-full", message.tone)}
            />
          )}
          <p
            className={cn(
              "max-w-[75%] rounded-2xl px-3 py-2 text-[11px]",
              message.mine
                ? "rounded-br-sm bg-linear-to-r from-secondary to-primary text-white"
                : "rounded-bl-sm bg-secondary-50 text-secondary-950",
            )}
          >
            {message.text}
          </p>
        </div>
      ))}
    </div>
    <div
      className={cn(
        "m-3 flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-2 text-[10px] text-secondary-400",
        IN,
      )}
    >
      <span className="flex-1">Message the group</span>
      <Send className="size-3.5 text-primary" aria-hidden />
    </div>
  </div>
);

const QR = Array.from({ length: 49 }, (_, index) =>
  (index * 5 + Math.floor(index / 7) * 3) % 4 < 2 ? 1 : 0,
);

const ScanScreen = () => (
  <div className="relative flex h-full flex-col items-center justify-center gap-4 bg-linear-to-b from-secondary-950 to-secondary-900 p-5">
    <p
      className={cn(
        "text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase",
        IN,
      )}
    >
      Your pass
    </p>
    <div
      className={cn("relative overflow-hidden rounded-2xl bg-white p-3", IN)}
      style={enter(150)}
    >
      <div className="grid grid-cols-7 gap-[3px]">
        {QR.map((on, index) => (
          <span
            key={index}
            className={cn(
              "size-3 rounded-[2px]",
              on ? "bg-secondary-950" : "bg-transparent",
            )}
          />
        ))}
      </div>
      <span className="animate-landing-scan absolute inset-x-0 h-1 rounded-full bg-emerald-400 shadow-[0_0_16px_4px_rgba(52,211,153,0.7)]" />
    </div>
    {/* The scan lands: the pass turns green. */}
    <div
      className="animate-landing-pop absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-500"
      style={enter(1900)}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-white text-emerald-600">
        <Check className="size-8" strokeWidth={3} aria-hidden />
      </span>
      <p className="text-lg font-bold text-white">You&apos;re in!</p>
      <p className="text-[11px] text-white/80">Enjoy the night</p>
    </div>
  </div>
);

const CONFETTI = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2;
  const reach = 110 + (index % 3) * 30;
  return {
    dx: `${Math.round(Math.cos(angle) * reach)}px`,
    dy: `${Math.round(Math.sin(angle) * reach)}px`,
    color: ["#f472b6", "#7dd3fc", "#fcd34d", "#a78bfa", "#34d399"][index % 5],
    round: index % 2 === 0,
  };
});

const SCREENS = [FindScreen, BookScreen, ChatScreen, ScanScreen];

// Where each stop sits around the ticket, in reading order: down the left, along
// the bottom and up the right, ending back at the ticket.
const STOPS = [
  "top-[3%] left-[4%]",
  "bottom-[3%] left-[8%]",
  "bottom-[3%] right-[8%]",
  "top-[3%] right-[4%]",
];

/**
 * The night out as a journey around the login ticket: four stops, each a small
 * phone, joined by a dashed route that ends at the ticket. One stop lights up at
 * a time and plays its moment; the rest wait dimmed, so the form stays the focus.
 */
const AuthStory = () => {
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(
      () => setChapter((current) => (current + 1) % CHAPTERS.length),
      CHAPTER_MS,
    );
    return () => clearTimeout(timer);
  }, [chapter]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* The route. Stretched to the stage, with strokes kept even. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id="journey-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <path
          d="M 13 24 C 4 42, 6 60, 15 76 C 34 98, 66 98, 85 76 C 94 60, 96 42, 87 24 C 78 8, 62 6, 54 16"
          fill="none"
          stroke="url(#journey-route)"
          strokeWidth="2"
          strokeDasharray="2 10"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="animate-landing-dash opacity-40"
        />
      </svg>

      {STOPS.map((position, index) => {
        const Screen = SCREENS[index];
        const isActive = index === chapter;
        const { title, line } = CHAPTERS[index];
        return (
          <div
            key={title}
            className={cn(
              "absolute flex w-[220px] flex-col items-center gap-2.5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              position,
              isActive
                ? "scale-100 opacity-100"
                : "scale-[0.88] opacity-35 saturate-50",
            )}
          >
            <div className="text-center">
              <p
                className={cn(
                  "text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors duration-500",
                  isActive ? "text-primary-300" : "text-white/50",
                )}
              >
                0{index + 1} · {title}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs text-white/60 transition-opacity duration-500",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              >
                {line}
              </p>
            </div>

            <div className="relative">
              {/* The phone, drawn at full size and shrunk, so the screens keep
                  their proportions. */}
              <div className="h-[259px] w-[126px]">
                <div className="relative aspect-[9/18.5] w-[210px] origin-top-left scale-[0.6] rounded-[2.2rem] bg-secondary-950 p-2.5 shadow-[0_40px_70px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
                  <div className="absolute top-3.5 left-1/2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-secondary-950" />
                  <div
                    // A fresh key each time this stop comes round replays its moment.
                    key={isActive ? `play-${chapter}` : "rest"}
                    className={cn(
                      "relative h-full overflow-hidden rounded-[1.8rem] bg-white",
                      // Resting stops show their finished frame, not a replay.
                      !isActive && "[&_*]:[animation:none!important]",
                    )}
                  >
                    <Screen />
                  </div>
                </div>
              </div>

              {/* The ticket flies out on Book it; confetti bursts on Turn up. */}
              {isActive && index === 1 && (
                <div
                  key={`ticket-${chapter}`}
                  className="animate-landing-ticket-out absolute top-[40%] right-0 z-20 flex w-[110px] overflow-hidden rounded-xl bg-linear-to-br from-secondary to-primary text-white shadow-[0_18px_30px_-12px_rgba(236,72,153,0.6)] [--out-x:80px]"
                  style={enter(1700)}
                >
                  <div className="flex-1 p-2.5">
                    <Ticket className="size-3.5" />
                    <p className="mt-1.5 text-[8px] font-semibold tracking-[0.2em] text-white/75 uppercase">
                      Admit one
                    </p>
                    <p className="text-[10px] font-bold">VIP · Rooftop</p>
                  </div>
                  <div className="w-6 border-l-2 border-dashed border-white/40" />
                </div>
              )}
              {isActive &&
                index === 3 &&
                CONFETTI.map((piece, confettiIndex) => (
                  <span
                    key={`${chapter}-${confettiIndex}`}
                    className={cn(
                      "animate-landing-confetti absolute top-1/2 left-1/2",
                      piece.round
                        ? "size-2 rounded-full"
                        : "h-2 w-3 rounded-[2px]",
                    )}
                    style={
                      {
                        background: piece.color,
                        animationDelay: `${2000 + (confettiIndex % 4) * 40}ms`,
                        "--dx": piece.dx,
                        "--dy": piece.dy,
                      } as React.CSSProperties
                    }
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(AuthStory);
