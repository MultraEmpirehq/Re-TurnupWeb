"use client";

import VerifiedTick from "@/components/discovery/verified-tick";
import { constructErrorMessage } from "@/api/functions";
import FollowButton from "@/components/discovery/follow-button";
import EventsGrid from "@/components/discovery/events-grid";
import PerformerAvatar from "@/components/discovery/performer-avatar";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { PERFORMER_TYPE_LABELS, usePerformer } from "@/hooks/use-discovery";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { Globe, Instagram, MapPin, Pencil, Twitter } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { memo } from "react";

const socialHref = (kind: "instagram" | "twitter", handle: string) => {
  if (/^https?:\/\//i.test(handle)) return handle;
  const name = handle.replace(/^@/, "");
  return kind === "instagram"
    ? `https://instagram.com/${name}`
    : `https://x.com/${name}`;
};

/** A performer's page: who they are, where to find them, and their events. */
const PerformerPage = () => {
  const params = useParams();
  const id = params?.id?.toString() ?? "";
  const { data: performer, isLoading, error, refetch } = usePerformer(id);
  const role = useUserStore((state) => state.userDetails?.role);
  const canEdit = !!performer?.isOwner || role === EUserRoles.ADMIN;

  if (isLoading) {
    return (
      <SectionContainer className="space-y-8 py-16">
        <div className="flex items-center gap-5">
          <Skeleton className="size-28 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-full max-w-2xl" />
      </SectionContainer>
    );
  }

  if (error || !performer) {
    return (
      <SectionContainer className="flex min-h-[500px] items-center justify-center py-16">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "We couldn't find this performer",
          )}
          retryFunction={() => void refetch()}
        />
      </SectionContainer>
    );
  }

  const links = [
    performer.instagram && {
      href: socialHref("instagram", performer.instagram),
      label: "Instagram",
      icon: Instagram,
    },
    performer.twitter && {
      href: socialHref("twitter", performer.twitter),
      label: "X",
      icon: Twitter,
    },
    performer.website && {
      href: /^https?:\/\//i.test(performer.website)
        ? performer.website
        : `https://${performer.website}`,
      label: "Website",
      icon: Globe,
    },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Globe }[];

  return (
    <SectionContainer className="space-y-12 py-16">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <PerformerAvatar
            name={performer.name}
            image={performer.image}
            className="size-24 text-2xl sm:size-28"
          />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
              {PERFORMER_TYPE_LABELS[performer.type] ?? "Performer"}
            </p>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-secondary-950">
              {performer.name}
              {performer.isVerified && <VerifiedTick className="size-6" />}
            </h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary-500">
              {performer.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {performer.country}
                </span>
              )}
              <span>
                {performer.upcomingEventsCount} upcoming{" "}
                {performer.upcomingEventsCount === 1 ? "event" : "events"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FollowButton
            type="PERFORMER"
            id={performer.id}
            name={performer.name}
          />
          {canEdit && (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`${ROUTES.PERFORMERS.href}?edit=${performer.id}`}>
                <Pencil className="size-4" aria-hidden />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </header>

      {(performer.bio || links.length > 0) && (
        <section className="max-w-3xl space-y-4">
          {performer.bio && (
            <p className="text-base leading-7 whitespace-pre-line text-secondary-700">
              {performer.bio}
            </p>
          )}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-secondary-700 ring-1 ring-black/10 hover:text-secondary"
                >
                  <link.icon className="size-4" aria-hidden />
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-5">
        <h2 className="text-xl font-bold text-secondary-950">
          Upcoming events
        </h2>
        <EventsGrid
          params={{ performerId: performer.id }}
          emptyText={`${performer.name} has nothing coming up on Turnupz yet. Follow to hear when they do.`}
        />
      </section>
    </SectionContainer>
  );
};

export default memo(PerformerPage);
