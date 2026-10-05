"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import useCategory from "@/hooks/use-category";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import { CATEGORY_TONES, categoryIconFor } from "../../explore/category-tiles";
import Reveal from "./reveal";

const MAX_TILES = 7;

/**
 * Categories as doorways into Explore, so the landing page invites browsing
 * without repeating Explore's event listings. Each tile opens Explore already
 * filtered to it.
 */
const VibeLinks = () => {
  const { data: categories, isLoading } = useCategory();
  const tiles = categories.slice(0, MAX_TILES);

  return (
    <section className="bg-[#f7f9fc] py-20 md:py-28">
      <SectionContainer className="space-y-10">
        <Reveal className="max-w-xl space-y-3">
          <p className="text-sm font-semibold tracking-wider text-primary uppercase">
            Pick a vibe
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-secondary-950 md:text-5xl">
            What are you in the mood for?
          </h2>
          <p className="text-secondary-950/60">
            Jump straight into the kind of event you&apos;re after.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading &&
            !tiles.length &&
            Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-3xl bg-secondary-100/60"
              />
            ))}

          {tiles.map((category, index) => {
            const Icon = categoryIconFor(category.name);
            return (
              <Reveal key={category.id} delay={index * 60}>
                <Link
                  href={`${ROUTES.EXPLORE.href}?category=${category.id}`}
                  className={cn(
                    "group relative flex h-36 flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br p-5 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-20px_rgba(2,6,23,0.5)]",
                    CATEGORY_TONES[index % CATEGORY_TONES.length],
                  )}
                >
                  <Icon
                    aria-hidden
                    className="absolute -right-4 -bottom-4 size-24 text-white/20 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
                  />
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="relative flex items-center gap-1.5 font-semibold">
                    <span className="truncate">{category.name}</span>
                    <ArrowRight
                      className="size-4 shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  </span>
                </Link>
              </Reveal>
            );
          })}

          {/* Always last: everything, for when no one vibe fits. */}
          <Reveal delay={tiles.length * 60}>
            <Link
              href={ROUTES.EXPLORE.href}
              className="group flex h-36 flex-col justify-between rounded-3xl border-2 border-dashed border-secondary-200 bg-white p-5 text-secondary-950 transition-all duration-300 hover:-translate-y-1 hover:border-secondary-400"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-800">
                <Compass className="size-5" aria-hidden />
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                See everything
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          </Reveal>
        </div>
      </SectionContainer>
    </section>
  );
};

export default memo(VibeLinks);
