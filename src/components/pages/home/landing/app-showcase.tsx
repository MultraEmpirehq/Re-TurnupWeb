"use client";

import { LogoWhiteSVG } from "@/assets/svg";
import SectionContainer from "@/components/layouts/section-container/section-container";
import CustomImageComponent from "@/components/ui/custom-image.component";
import StoreBadges from "@/components/ui/store-badges";
import { useEvents } from "@/hooks/use-event";
import { IEventDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";
import {
  Bell,
  Heart,
  Home,
  MessageCircle,
  Search,
  Ticket,
  User,
} from "lucide-react";
import Image from "next/image";
import React, { memo, useMemo, useRef } from "react";
import Reveal from "./reveal";
import usePointerTilt from "./use-pointer-tilt";

// Only what the app really does today.
const FEATURES = [
  {
    icon: Home,
    title: "A feed that knows what's on",
    body: "Happening today, trending and upcoming events, and featured venues, the moment you open it.",
  },
  {
    icon: Ticket,
    title: "Every ticket in one tab",
    body: "Your passes live on your phone, ready to scan at the door.",
  },
  {
    icon: MessageCircle,
    title: "Chat with who's going",
    body: "Each event has its own group chat, so you can link up before you arrive.",
  },
  {
    icon: Heart,
    title: "Save it for later",
    body: "Heart an event and find it again in favourites when you're ready to book.",
  },
];

const TABS = [Home, Search, Ticket, MessageCircle, User];

const dateLabel = (event?: IEventDetailsType) => {
  const date = event?.date ? new Date(event.date) : null;
  return date && !Number.isNaN(date.getTime()) ? formatDate(date, "EEE d MMM") : "Soon";
};

/** A phone with real depth: a back plate and edge sit behind the screen. */
const Phone: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  activeTab: number;
}> = ({ children, className, style, activeTab }) => (
  <div
    className={cn("absolute aspect-[9/19] [transform-style:preserve-3d]", className)}
    style={style}
  >
    <div className="absolute inset-0 rounded-[2.4rem] bg-secondary-900 shadow-[0_50px_90px_-35px_rgba(2,6,23,0.65)] [transform:translateZ(-14px)]" />
    <div className="absolute inset-0 rounded-[2.4rem] bg-linear-to-r from-secondary-800 via-secondary-950 to-secondary-800 [transform:translateZ(-7px)]" />
    <div className="absolute inset-0 rounded-[2.4rem] bg-secondary-950 p-2">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.9rem] bg-white">
        <div className="flex-1 overflow-hidden">{children}</div>
        <div className="flex items-center justify-around border-t border-secondary-50 px-3 py-2.5">
          {TABS.map((Icon, index) => (
            <Icon
              key={index}
              className={cn(
                "size-4",
                index === activeTab ? "text-primary" : "text-secondary-300",
              )}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const HomeScreen: React.FC<{ events: IEventDetailsType[] }> = ({ events }) => (
  <div className="space-y-3 p-3.5">
    <div className="flex items-center justify-between">
      <div className="rounded-lg bg-linear-to-r from-secondary to-primary px-2 py-1">
        <Image src={LogoWhiteSVG} alt="" className="h-3.5 w-auto" />
      </div>
      <Bell className="size-4 text-secondary-400" aria-hidden />
    </div>
    <div className="flex h-8 items-center gap-2 rounded-full bg-secondary-50 px-3 text-[10px] text-secondary-400">
      <Search className="size-3" aria-hidden />
      Search events
    </div>
    <p className="text-[11px] font-bold text-secondary-950">Happening today</p>
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-linear-to-br from-primary-200 to-primary-500">
      {events[0]?.image && (
        <CustomImageComponent
          fill
          src={events[0].image}
          alt=""
          className="size-full rounded-none"
          imageClassName="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
      <p className="absolute inset-x-3 bottom-2.5 truncate text-[11px] font-semibold text-white">
        {events[0]?.name ?? "Today's pick"}
      </p>
    </div>
    <p className="text-[11px] font-bold text-secondary-950">Trending</p>
    {[1, 2].map((index) => (
      <div key={index} className="flex items-center gap-2.5">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-secondary-200 to-secondary-500">
          {events[index]?.image && (
            <CustomImageComponent
              fill
              src={events[index].image}
              alt=""
              className="size-full rounded-none"
              imageClassName="object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-secondary-950">
            {events[index]?.name ?? "Trending event"}
          </p>
          <p className="text-[9px] text-secondary-950/50">{dateLabel(events[index])}</p>
        </div>
      </div>
    ))}
  </div>
);

const TicketsScreen: React.FC<{ event?: IEventDetailsType }> = ({ event }) => (
  <div className="flex h-full flex-col gap-3 bg-linear-to-b from-secondary-950 to-secondary-900 p-3.5 text-white">
    <p className="text-[11px] font-bold">My tickets</p>
    <div className="overflow-hidden rounded-2xl bg-white text-secondary-950">
      <div className="relative aspect-[16/9] bg-linear-to-br from-secondary-300 to-primary-400">
        {event?.image && (
          <CustomImageComponent
            fill
            src={event.image}
            alt=""
            className="size-full rounded-none"
            imageClassName="object-cover"
          />
        )}
      </div>
      <div className="relative border-t-2 border-dashed border-secondary-100 px-3 py-2.5">
        <span className="absolute -top-2 -left-2 size-4 rounded-full bg-secondary-950" />
        <span className="absolute -top-2 -right-2 size-4 rounded-full bg-secondary-950" />
        <p className="truncate text-[10px] font-semibold">{event?.name ?? "Your next event"}</p>
        <p className="text-[9px] text-secondary-950/50">{dateLabel(event)} · Admit one</p>
      </div>
    </div>
    <div className="mt-auto flex items-center gap-2 rounded-2xl bg-white/10 p-2.5">
      <div className="grid grid-cols-5 gap-[2px] rounded-md bg-white p-1.5">
        {Array.from({ length: 25 }, (_, index) => (
          <span
            key={index}
            className={cn("size-1.5", (index * 7) % 3 ? "bg-secondary-950" : "bg-transparent")}
          />
        ))}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-emerald-300">Ready to scan</p>
        <p className="text-[9px] text-white/55">Show this at the door</p>
      </div>
    </div>
  </div>
);

const AppShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  usePointerTilt(sectionRef, stageRef, { maxX: 6, maxY: 10 });
  // The same query as the hero, so it comes straight from the cache.
  const { data } = useEvents({ limit: 3, isTrending: true });
  const events = useMemo(
    () => (data?.pages?.flatMap((page) => page?.data || []) || []).slice(0, 3),
    [data],
  );

  return (
    <section
      ref={sectionRef}
      id="get-the-app"
      className="scroll-mt-[70px] overflow-hidden bg-white py-20 md:py-28"
    >
      <SectionContainer className="grid items-center gap-16 lg:grid-cols-2">
        <div className="space-y-8">
          <Reveal className="space-y-4">
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">
              The Turnupz app
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-secondary-950 md:text-5xl">
              Every plan, in your pocket.
            </h2>
            <p className="max-w-lg text-secondary-950/60">
              Turnupz is made for your phone. Find what&apos;s on, book in a few
              taps, chat with everyone going and walk in with one scan, all from
              the app.
            </p>
          </Reveal>

          <ul className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }, index) => (
              <Reveal as="li" key={title} delay={index * 80}>
                <div className="h-full rounded-3xl border border-secondary-100 bg-[#f7f9fc] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-linear-to-br from-secondary to-primary text-white">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <p className="mt-4 font-semibold text-secondary-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-secondary-950/60">{body}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={200}>
            <StoreBadges />
          </Reveal>
        </div>

        {/* Two phones at different depths that lean with the pointer. */}
        <Reveal delay={150} className="relative mx-auto h-[520px] w-full max-w-[460px] [perspective:1300px] sm:h-[600px]">
          <div
            aria-hidden
            className="absolute inset-8 -z-10 rounded-full bg-linear-to-br from-secondary-100 via-white to-primary-100 blur-3xl"
          />
          <div
            ref={stageRef}
            role="img"
            aria-label="The Turnupz app: the home feed and the tickets tab"
            className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(calc(6deg+var(--rx,0deg)))_rotateY(calc(-14deg+var(--ry,0deg)))]"
          >
            <Phone
              activeTab={2}
              className="top-[12%] right-0 w-[52%] sm:w-[46%]"
              style={{ transform: "translateZ(-90px) rotateZ(6deg)" }}
            >
              <TicketsScreen event={events[1] ?? events[0]} />
            </Phone>
            <div className="animate-landing-float absolute inset-0 [transform-style:preserve-3d]">
              <Phone
                activeTab={0}
                className="top-[4%] left-[4%] w-[56%] sm:w-[50%]"
                style={{ transform: "translateZ(40px) rotateZ(-4deg)" }}
              >
                <HomeScreen events={events} />
              </Phone>
            </div>
          </div>
        </Reveal>
      </SectionContainer>
    </section>
  );
};

export default memo(AppShowcase);
