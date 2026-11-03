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

const CreateScreen = () => (
  <div className="flex h-full flex-col gap-2.5 p-4">
    <p className={cn("text-[10px] font-semibold tracking-[0.2em] text-secondary-400 uppercase", IN)}>
      New event
    </p>
    <div className={cn("h-20 rounded-2xl bg-linear-to-br from-primary-200 to-primary-500", IN)} style={enter(150)} />
    <p className={cn("text-[13px] font-bold text-secondary-950", IN)} style={enter(300)}>
      Lagos Tech Fest
    </p>
    <div className={cn("flex gap-1.5 text-[10px] text-secondary-950/60", IN)} style={enter(450)}>
      <span className="flex items-center gap-1 rounded-full bg-secondary-50 px-2 py-1">
        <CalendarDays className="size-3" aria-hidden /> Fri 9am
      </span>
      <span className="flex items-center gap-1 rounded-full bg-secondary-50 px-2 py-1">
        <MapPin className="size-3" aria-hidden /> Lekki
      </span>
    </div>
    {[
      { tier: "Regular", price: "₦5,000" },
      { tier: "VIP", price: "₦15,000" },
    ].map((row, index) => (
      <div
        key={row.tier}
        className={cn(
          "flex items-center justify-between rounded-xl border border-secondary-100 px-3 py-2 text-[11px] font-semibold text-secondary-800",
          IN,
        )}
        style={enter(650 + index * 180)}
      >
        {row.tier}
        <span className="text-secondary-950">{row.price}</span>
      </div>
    ))}
    <div
      className="animate-landing-pop mt-auto rounded-full bg-linear-to-r from-secondary to-primary py-2.5 text-center text-[11px] font-semibold text-white"
      style={enter(1400)}
    >
      Publish event
    </div>
  </div>
);

const SellScreen = () => (
  <div className="flex h-full flex-col gap-3 p-4">
    <div className={cn("rounded-2xl bg-secondary-950 p-3.5 text-white", IN)}>
      <p className="text-[10px] text-white/60">Tickets sold</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold">248</p>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
          <TrendingUp className="size-3" aria-hidden /> +36 today
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div
          className="animate-in slide-in-from-left fill-mode-backwards h-full w-[83%] rounded-full bg-linear-to-r from-primary-300 to-primary duration-1000"
          style={enter(300)}
        />
      </div>
      <p className="mt-1 text-[9px] text-white/50">248 of 300</p>
    </div>
    <p className={cn("text-[10px] font-semibold text-secondary-950/50", IN)} style={enter(400)}>
      Just now
    </p>
    {[
      { who: "Tolu A.", what: "VIP", tone: "bg-secondary-300" },
      { who: "Kemi O.", what: "Regular × 2", tone: "bg-sky-300" },
      { who: "Dayo F.", what: "VIP", tone: "bg-primary-300" },
    ].map((sale, index) => (
      <div
        key={sale.who}
        className={cn("flex items-center gap-2.5 rounded-xl bg-white p-2 shadow-sm ring-1 ring-secondary-50", IN)}
        style={enter(700 + index * 450)}
      >
        <span className={cn("size-6 shrink-0 rounded-full", sale.tone)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-secondary-950">{sale.who}</p>
          <p className="text-[9px] text-secondary-950/50">{sale.what}</p>
        </div>
        <span className="text-[10px] font-semibold text-emerald-600">Paid</span>
      </div>
    ))}
  </div>
);

const DoorScreen = () => (
  <div className="relative flex h-full flex-col items-center justify-center gap-4 bg-linear-to-b from-secondary-950 to-secondary-900 p-5">
    <p className={cn("text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase", IN)}>
      Scanning · Main door
    </p>
    {/* The camera's view, with its corner guides. */}
    <div className={cn("relative size-32", IN)} style={enter(150)}>
      {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map(
        (corner) => (
          <span key={corner} className={cn("absolute size-6 rounded-sm border-white/80", corner)} />
        ),
      )}
      <span className="animate-landing-scan absolute inset-x-3 h-1 rounded-full bg-emerald-400 shadow-[0_0_16px_4px_rgba(52,211,153,0.7)]" />
    </div>
    <p className={cn("text-[11px] text-white/60", IN)} style={enter(300)}>
      142 of 248 in
    </p>
    {/* The scan lands: one more guest in. */}
    <div
      className="animate-landing-pop absolute inset-x-4 bottom-6 flex items-center gap-2.5 rounded-2xl bg-emerald-500 p-3 text-white"
      style={enter(1900)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600">
        <Check className="size-4" strokeWidth={3} aria-hidden />
      </span>
      <div>
        <p className="text-[12px] font-bold">Admitted</p>
        <p className="text-[10px] text-white/85">Kemi O. · VIP</p>
      </div>
    </div>
  </div>
);

const PaidScreen = () => (
  <div className="flex h-full flex-col gap-3 p-4">
    <div className={cn("rounded-2xl bg-linear-to-br from-secondary to-primary p-4 text-white", IN)}>
      <p className="text-[10px] text-white/70">Your earnings</p>
      <p className="mt-1 text-xl font-bold">₦3,720,000</p>
      <p className="text-[9px] text-white/60">Lagos Tech Fest · 248 tickets</p>
    </div>
    {[
      { label: "Ticket sales", value: "₦4,000,000" },
      { label: "Turnupz fee", value: "−₦280,000" },
    ].map((row, index) => (
      <div
        key={row.label}
        className={cn("flex justify-between px-1 text-[11px] text-secondary-950/70", IN)}
        style={enter(400 + index * 200)}
      >
        {row.label}
        <span className="font-semibold text-secondary-950">{row.value}</span>
      </div>
    ))}
    <div
      className="animate-landing-pop mt-auto flex items-center gap-2.5 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100"
      style={enter(1500)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Banknote className="size-4" aria-hidden />
      </span>
      <div>
        <p className="text-[11px] font-bold text-secondary-950">Paid out</p>
        <p className="text-[9px] text-secondary-950/55">To your bank ••42</p>
      </div>
    </div>
  </div>
);

export const ORGANISER_SCREENS: React.FC[] = [CreateScreen, SellScreen, DoorScreen, PaidScreen];
