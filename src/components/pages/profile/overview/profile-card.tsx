"use client";

import { getData, postData } from "@/api";
import { uploadAttachment } from "@/api/attachments";
import { constructErrorMessage } from "@/api/functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useAuth from "@/hooks/use-auth";
import {
  maskMoney,
  useCreditBalance,
  useHideBalance,
  usePerson,
} from "@/hooks/use-profile";
import { resolveAttachmentUrl } from "@/lib/functions";
import { inviteLink } from "@/lib/invite";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserRoles, TUserDetails } from "@/stores/user-store";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  Gift,
  Globe,
  Loader2,
  Pencil,
  Settings,
  Share2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import InviteFriendsCard from "../invite-friends-card";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

/** Their balance, which opens the wallet; the eye hides it on this browser. */
const CreditTile: React.FC = () => {
  const { data: balances = [], isLoading } = useCreditBalance();
  const { hidden, toggle } = useHideBalance();
  const main = balances.find((row) => row.available.amount > 0) ?? balances[0];
  const others = balances.filter(
    (row) => row !== main && row.available.amount > 0,
  ).length;
  return (
    <div className="relative overflow-hidden rounded-[1.4rem] bg-linear-to-br from-secondary-700 to-secondary-500 p-4 text-white">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80">
          <Wallet className="size-3.5" aria-hidden />
          Turnupz Credit
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={hidden ? "Show balance" : "Hide balance"}
          className="flex size-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
        >
          {hidden ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
        </button>
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">
        {isLoading
          ? "…"
          : maskMoney(main?.available.formatted.withCurrency ?? "0", hidden)}
      </p>
      <p className="text-xs text-white/75">
        {main && main.pending.amount > 0
          ? `${maskMoney(main.pending.formatted.withCurrency, hidden)} on the way`
          : others
            ? `+ ${others} more ${others === 1 ? "currency" : "currencies"}`
            : "Spend it on tickets at checkout"}
      </p>
      <Link
        href={ROUTES.PROFILE_WALLET.href}
        className="mt-3 inline-flex items-center gap-0.5 text-xs font-bold text-white hover:underline"
      >
        Open wallet <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
};

/** Their invite code; the full invite card opens in a dialog. */
const InviteTile: React.FC<{ code?: string | null }> = ({ code }) => {
  const [open, setOpen] = useState(false);
  const { data: referral } = useQuery({
    queryKey: ["referrals", "me"],
    queryFn: async () =>
      (
        await getData<{ code: string; counts: { rewarded: number } }>(
          "/referrals/me",
        )
      ).data?.data ?? null,
  });
  const shown = referral?.code ?? code;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col items-start rounded-[1.4rem] border border-secondary-100 bg-white p-4 text-left transition-colors hover:border-primary/40"
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-500">
          <Gift className="size-3.5" aria-hidden />
          Invite friends
        </span>
        <span className="mt-2 font-mono text-lg font-extrabold text-secondary-950">
          {shown ?? "—"}
        </span>
        <span className="text-xs text-secondary-500">
          {referral?.counts.rewarded
            ? `${referral.counts.rewarded} ${referral.counts.rewarded === 1 ? "friend" : "friends"} joined`
            : "Earn credit when friends buy"}
        </span>
        <span className="mt-3 inline-flex items-center gap-0.5 text-xs font-bold text-secondary-700">
          Share your code <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.6rem] p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Invite friends</DialogTitle>
          </DialogHeader>
          <InviteFriendsCard className="p-6" />
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Who they are, as others see it: photo (click to change), name, @username, the
 * country if they show it, bio and website, follower numbers, then Edit and
 * Share, their credit and their invite code.
 */
const ProfileCard: React.FC = () => {
  const user = useUserStore((state) => state.userDetails);
  const { performAuthOperation } = useAuth();
  const { data: person } = usePerson(user?.username);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    user?.username ||
    "Your profile";
  const photo =
    resolveAttachmentUrl(user?.profileImageDetails, user?.profileImage) ??
    user?.avatar;

  const changePhoto = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Pick a photo under 5MB");
      return;
    }
    setUploading(true);
    try {
      const attachment = await uploadAttachment(file, "AVATAR");
      const { data } = await postData<{ attachmentId: string }, TUserDetails>(
        "/user/avatar",
        {
          attachmentId: attachment.id,
        },
      );
      await performAuthOperation(data?.data);
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Couldn't change your photo.",
        ),
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const share = async () => {
    if (!user?.username) return;
    const link = inviteLink(user.username);
    const text = `Find me on Turnupz: @${user.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, text, url: link });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${link}`);
      toast.success("Profile link copied");
    } catch {
      // Closed the share sheet.
    }
  };

  const followers = person?.followers ?? 0;
  const following = person?.following ?? 0;
  const website = user?.website?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[1.75rem] border border-secondary-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div
          aria-hidden
          className="h-24 bg-linear-to-r from-secondary-400 via-primary-300 to-primary"
        />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between gap-3">
            <div className="relative -mt-12 w-fit shrink-0">
              <Avatar className="size-24 rounded-[1.75rem] shadow-md ring-4 ring-white">
                <AvatarImage src={photo} alt={name} className="object-cover" />
                <AvatarFallback className="rounded-[1.75rem] bg-secondary-800 text-2xl font-semibold text-white">
                  {initialsOf(name)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change profile photo"
                className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-secondary-500 text-white ring-4 ring-white hover:bg-secondary-600 disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void changePhoto(event.target.files?.[0])}
              />
            </div>
            <Link
              href={ROUTES.PROFILE_SETTINGS.href}
              aria-label="Settings"
              className="mb-1 flex size-10 items-center justify-center rounded-full border border-secondary-100 text-secondary-600 hover:bg-secondary-50"
            >
              <Settings className="size-4" />
            </Link>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-secondary-950">
            {name}
          </h1>
          <p className="text-sm text-secondary-500">
            {[
              user?.username ? `@${user.username}` : null,
              user?.showCountry ? user?.country : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {user?.bio ? (
            <p className="mt-2 text-sm leading-6 whitespace-pre-line text-secondary-800">
              {user.bio}
            </p>
          ) : (
            <Link
              href={ROUTES.PROFILE_EDIT.href}
              className="mt-2 inline-block text-sm font-semibold text-secondary-500 hover:text-secondary-800"
            >
              + Add a bio
            </Link>
          )}
          {website && (
            <a
              href={
                user!.website!.startsWith("http")
                  ? user!.website!
                  : `https://${user!.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-secondary-700 hover:underline"
            >
              <Globe className="size-3.5" aria-hidden />
              {website}
            </a>
          )}

          <div className="mt-3 flex gap-4 text-sm">
            <Link
              href={`${ROUTES.PROFILE_FOLLOWING.href}?tab=followers`}
              className="text-secondary-500 hover:text-secondary-900"
            >
              <b className="text-secondary-950">{followers.toLocaleString()}</b>{" "}
              {followers === 1 ? "follower" : "followers"}
            </Link>
            <Link
              href={ROUTES.PROFILE_FOLLOWING.href}
              className="text-secondary-500 hover:text-secondary-900"
            >
              <b className="text-secondary-950">{following.toLocaleString()}</b>{" "}
              following
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              asChild
              className="h-10 rounded-xl bg-secondary-700 font-semibold text-white hover:bg-secondary-800"
            >
              <Link href={ROUTES.PROFILE_EDIT.href}>
                <Pencil className="size-3.5" aria-hidden />
                Edit profile
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void share()}
              disabled={!user?.username}
              className="h-10 rounded-xl border-secondary-200 font-semibold"
            >
              <Share2 className="size-3.5" aria-hidden />
              Share profile
            </Button>
          </div>
        </div>
      </section>

      <div className={user?.role === EUserRoles.VENDOR ? "grid gap-3" : "grid grid-cols-2 gap-3"}>
        <CreditTile />
        {/* Invites are for attendees: an organiser's code no longer works. */}
        {user?.role !== EUserRoles.VENDOR && <InviteTile code={user?.username} />}
      </div>
    </div>
  );
};

export default memo(ProfileCard);
