"use client";

import React, { memo } from "react";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { IEventDetailsType } from "@/lib/types";

type GuestItem = IEventDetailsType["eventGuestsOfHonour"] extends
  | (infer U)[]
  | undefined
  ? U
  : never;

function getGuestName(guest: GuestItem): string {
  if (!guest) return "Guest";
  if ("name" in guest && typeof guest.name === "string") return guest.name;
  if ("firstName" in guest || "lastName" in guest) {
    const first = (guest as { firstName?: string }).firstName;
    const last = (guest as { lastName?: string }).lastName;
    const joined = [first, last].filter(Boolean).join(" ");
    const username = (guest as { username?: string }).username;
    return joined || username || "Guest";
  }
  return (guest as { username?: string }).username ?? "Guest";
}

function getGuestAvatar(guest: GuestItem): string | undefined {
  return guest && "avatar" in guest
    ? (guest as { avatar?: string }).avatar
    : undefined;
}

interface EventDetailGuestsProps {
  guests: NonNullable<IEventDetailsType["eventGuestsOfHonour"]>;
}

const EventDetailGuests = ({ guests }: EventDetailGuestsProps) => (
  <section className="space-y-3">
    <h3 className="text-lg font-semibold">Guests of Honour</h3>
    <div className="flex flex-row flex-wrap gap-2">
      {guests.map((guest, index) => {
        const name = getGuestName(guest);
        const avatar = getGuestAvatar(guest);
        return (
          <div
            key={index}
            className="flex flex-row items-center gap-2 px-2 py-1.5 rounded-md border bg-card text-card-foreground shrink-0"
          >
            {avatar ? (
              <div className="size-8 rounded-full overflow-hidden bg-muted shrink-0 relative">
                <CustomImageComponent
                  src={avatar}
                  alt={name}
                  fill
                  className="size-full"
                  imageClassName="object-cover"
                />
              </div>
            ) : (
              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                {(name || "G").charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium line-clamp-1 max-w-[120px]">
              {name}
            </span>
          </div>
        );
      })}
    </div>
  </section>
);

export default memo(EventDetailGuests);
