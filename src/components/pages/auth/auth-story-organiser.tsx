import { cn } from "@/lib/utils";
import { Banknote, CalendarDays, Check, MapPin, TrendingUp } from "lucide-react";
import React from "react";

// The organiser's side of the story the sign-in stage tells (see AuthStory):
// the same four-stop journey, from posting an event to getting paid for it.

export const ORGANISER_CHAPTERS = [
  { title: "Create it", line: "Post your event and its tickets in minutes." },
  { title: "Sell it", line: "Watch tickets sell as it happens." },
  { title: "Run the door", line: "Your team scans guests in with their phones." },
  { title: "Get paid", line: "Your share is paid out to your bank." },
] as const;

const enter = (delay: number) => ({ animationDelay: `${delay}ms` });
const IN =
  "animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-500";

/** A neutral stand-in for text: the story shows the shape of each screen, not made-up details. */
const Bar = ({ className }: { className?: string }) => (
  <span aria-hidden className={cn("block h-2 rounded-full bg-secondary-100", className)} />
);

const CreateScreen = () => (
  <div className="flex h-full flex-col gap-2.5 p-4">
    <p className={cn("text-2xs font-semibold tracking-[0.2em] text-secondary-400 uppercase", IN)}>
      New event
    </p>
    <div className={cn("h-20 rounded-2xl bg-linear-to-br from-primary-200 to-primary-500", IN)} style={enter(150)} />
    <div className={IN} style={enter(300)}>
      <Bar className="h-3 w-3/4 bg-secondary-200" />
    </div>
    <div className={cn("flex gap-1.5 text-2xs text-secondary-950/60", IN)} style={enter(450)}>
      <span className="flex items-center gap-1 rounded-full bg-secondary-50 px-2 py-1">
        <CalendarDays className="size-3" aria-hidden /> <Bar className="w-8" />
      </span>
      <span className="flex items-center gap-1 rounded-full bg-secondary-50 px-2 py-1">
        <MapPin className="size-3" aria-hidden /> <Bar className="w-8" />
      </span>
    </div>
    {["w-14", "w-10"].map((width, index) => (
      <div
        key={width}
        className={cn(
          "flex items-center justify-between rounded-xl border border-secondary-100 px-3 py-3",
          IN,
        )}
        style={enter(650 + index * 180)}
      >
        <Bar className={width} />
        <Bar className="w-10 bg-secondary-200" />
      </div>
    ))}
    <div
      className="animate-landing-pop mt-auto rounded-full bg-linear-to-r from-secondary to-primary py-2.5 text-center text-2xs font-semibold text-white"
      style={enter(1400)}
    >
      Publish event
    </div>
  </div>
);

const SellScreen = () => (
  <div className="flex h-full flex-col gap-3 p-4">
    <div className={cn("rounded-2xl bg-secondary-950 p-3.5 text-white", IN)}>
      <p className="text-2xs text-white/60">Tickets sold</p>
      <div className="flex items-end justify-between">
        <Bar className="mt-2 h-5 w-14 bg-white/30" />
        <span className="flex items-center gap-1 text-emerald-400">
          <TrendingUp className="size-3" aria-hidden /> <Bar className="w-8 bg-success-solid/40" />
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div
          className="animate-in slide-in-from-left fill-mode-backwards h-full w-[83%] rounded-full bg-linear-to-r from-primary-300 to-primary duration-1000"
          style={enter(300)}
        />
      </div>
      <Bar className="mt-2 h-1.5 w-12 bg-white/20" />
    </div>
    <p className={cn("text-2xs font-semibold text-secondary-950/50", IN)} style={enter(400)}>
      Just now
    </p>
    {[
      { who: "w-16", what: "w-8", tone: "bg-secondary-300" },
      { who: "w-12", what: "w-12", tone: "bg-info-solid/70" },
      { who: "w-20", what: "w-8", tone: "bg-primary-300" },
    ].map((sale, index) => (
      <div
        key={index}
        className={cn("flex items-center gap-2.5 rounded-xl bg-card p-2 shadow-sm ring-1 ring-secondary-50", IN)}
        style={enter(700 + index * 450)}
      >
        <span className={cn("size-6 shrink-0 rounded-full", sale.tone)} />
        <div className="min-w-0 flex-1">
          <Bar className={cn("bg-secondary-200", sale.who)} />
          <Bar className={cn("mt-1.5 h-1.5", sale.what)} />
        </div>
        <span className="text-2xs font-semibold text-success">Paid</span>
      </div>
    ))}
  </div>
);

const DoorScreen = () => (
  <div className="relative flex h-full flex-col items-center justify-center gap-4 bg-linear-to-b from-secondary-950 to-secondary-900 p-5">
    <p className={cn("text-2xs font-semibold tracking-[0.2em] text-white/50 uppercase", IN)}>
      Scanning · Main door
    </p>
    {/* The camera's view, with its corner guides. */}
    <div className={cn("relative size-32", IN)} style={enter(150)}>
      {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map(
        (corner) => (
          <span key={corner} className={cn("absolute size-6 rounded-sm border-white/80", corner)} />
        ),
      )}
      <span className="animate-landing-scan absolute inset-x-3 h-1 rounded-full bg-success-solid/70 shadow-[0_0_16px_4px_rgba(52,211,153,0.7)]" />
    </div>
    <div className={IN} style={enter(300)}>
      <Bar className="w-20 bg-white/20" />
    </div>
    {/* The scan lands: one more guest in. */}
    <div
      className="animate-landing-pop absolute inset-x-4 bottom-6 flex items-center gap-2.5 rounded-2xl bg-success-solid p-3 text-white"
      style={enter(1900)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-success">
        <Check className="size-4" strokeWidth={3} aria-hidden />
      </span>
      <div>
        <p className="text-xs font-bold">Admitted</p>
        <Bar className="mt-1 h-1.5 w-16 bg-white/50" />
      </div>
    </div>
  </div>
);

const PaidScreen = () => (
  <div className="flex h-full flex-col gap-3 p-4">
    <div className={cn("rounded-2xl bg-linear-to-br from-secondary to-primary p-4 text-white", IN)}>
      <p className="text-2xs text-white/70">Your earnings</p>
      <Bar className="mt-2 h-5 w-28 bg-white/35" />
      <Bar className="mt-2 h-1.5 w-20 bg-white/20" />
    </div>
    {["Ticket sales", "Turnupz fee"].map((label, index) => (
      <div
        key={label}
        className={cn("flex items-center justify-between px-1 text-2xs text-secondary-950/70", IN)}
        style={enter(400 + index * 200)}
      >
        {label}
        <Bar className="w-14 bg-secondary-200" />
      </div>
    ))}
    <div
      className="animate-landing-pop mt-auto flex items-center gap-2.5 rounded-2xl bg-success-soft p-3 ring-1 ring-success-line"
      style={enter(1500)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-solid text-white">
        <Banknote className="size-4" aria-hidden />
      </span>
      <div>
        <p className="text-2xs font-bold text-secondary-950">Paid out</p>
        <p className="text-2xs text-secondary-950/55">To your bank</p>
      </div>
    </div>
  </div>
);

export const ORGANISER_SCREENS: React.FC[] = [CreateScreen, SellScreen, DoorScreen, PaidScreen];
