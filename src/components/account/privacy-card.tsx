"use client";

import { constructErrorMessage } from "@/api/functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  TMessagePolicy,
  TPersonSummary,
  useAnswerFollowRequest,
  useBlocks,
  useFollowRequests,
  usePrivacy,
  useUnblock,
  useUpdatePrivacy,
} from "@/hooks/use-privacy";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import React, { memo, useState } from "react";
import { toast } from "sonner";

const POLICIES: { value: TMessagePolicy; title: string; description: string }[] = [
  {
    value: "EVERYONE",
    title: "Everyone",
    description: "From people you don't follow back, messages arrive as requests.",
  },
  {
    value: "MUTUALS",
    title: "People who follow each other",
    description: "You both follow each other.",
  },
  {
    value: "NOBODY",
    title: "No one",
    description: "No one can start a chat with you. Event and organiser chats still work.",
  },
];

const errorText = (error: unknown, fallback: string) =>
  constructErrorMessage(error as TApiErrorResponseType, fallback);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const PersonLine = ({
  person,
  children,
}: {
  person: TPersonSummary;
  children: React.ReactNode;
}) => (
  <li className="flex items-center gap-3 rounded-2xl border border-secondary-100 bg-secondary-50/60 px-4 py-3">
    <Avatar className="size-10">
      {person.image && <AvatarImage src={person.image} alt="" />}
      <AvatarFallback>{initials(person.name)}</AvatarFallback>
    </Avatar>
    <span className="min-w-0 flex-1">
      <span className="block truncate font-semibold text-secondary-950">
        {person.name}
      </span>
      {person.username && (
        <span className="block truncate text-sm text-secondary-500">
          @{person.username}
        </span>
      )}
    </span>
    <span className="flex shrink-0 gap-2">{children}</span>
  </li>
);

const pill =
  "h-9 rounded-full px-4 text-sm font-semibold transition disabled:opacity-60";

/**
 * Privacy, saved as you change it: a private profile (and the follow requests
 * it brings), who can message you, and the people you've blocked. Blocking
 * someone is done from their profile in the app.
 */
const PrivacyCard = () => {
  const { data: privacy, isLoading } = usePrivacy();
  const update = useUpdatePrivacy();
  const requests = useFollowRequests(!!privacy?.isPrivate);
  const answer = useAnswerFollowRequest();
  const blocks = useBlocks();
  const unblock = useUnblock();
  const [toUnblock, setToUnblock] = useState<TPersonSummary | null>(null);

  const save = async (body: Parameters<typeof update.mutateAsync>[0]) => {
    try {
      await update.mutateAsync(body);
    } catch (error) {
      toast.error(errorText(error, "Couldn't save that setting."));
    }
  };

  const respond = async (userId: string, accept: boolean) => {
    try {
      await answer.mutateAsync({ userId, accept });
    } catch (error) {
      toast.error(errorText(error, "That didn't work. Please try again."));
    }
  };

  const confirmUnblock = async () => {
    if (!toUnblock) return;
    try {
      await unblock.mutateAsync(toUnblock.id);
      toast.success(`${toUnblock.name} is unblocked`);
      setToUnblock(null);
    } catch (error) {
      toast.error(errorText(error, "Couldn't unblock them. Please try again."));
    }
  };

  const heading = (text: string) => (
    <h3 className="text-xs font-bold tracking-[0.18em] text-secondary-400 uppercase">
      {text}
    </h3>
  );

  return (
    <section className="space-y-5 rounded-[1.5rem] border border-secondary-100 bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-secondary-50 p-2.5 text-secondary">
          <Lock className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-secondary-950">Privacy</h2>
          <p className="text-sm text-secondary-500">
            Who can follow you, who can message you, and who you&apos;ve
            blocked.
          </p>
        </div>
      </div>

      {isLoading || !privacy ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {heading("Account visibility")}
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-secondary-100 bg-secondary-50/60 px-4 py-3">
              <span>
                <span className="block font-semibold text-secondary-950">
                  Private profile
                </span>
                <span className="block text-sm text-secondary-500">
                  Only people you approve can follow you and see who you follow
                  and who follows you.
                </span>
              </span>
              <Switch
                checked={privacy.isPrivate}
                onCheckedChange={(value) => void save({ isPrivate: value })}
                aria-label="Private profile"
              />
            </label>
            <p className="px-1 text-xs text-secondary-500 italic">
              Going private doesn&apos;t remove the followers you already have.
            </p>
            {privacy.isPrivate && (requests.data?.length ?? 0) > 0 && (
              <div className="space-y-2 pt-1">
                <p className="px-1 text-sm font-semibold text-secondary-950">
                  Follow requests
                </p>
                <ul className="space-y-2">
                  {requests.data!.map((person) => (
                    <PersonLine key={person.id} person={person}>
                      <button
                        type="button"
                        onClick={() => void respond(person.id, true)}
                        disabled={answer.isPending}
                        className={cn(pill, "bg-primary text-white hover:bg-primary/90")}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void respond(person.id, false)}
                        disabled={answer.isPending}
                        className={cn(pill, "border border-secondary-200 bg-white text-secondary-950 hover:bg-secondary-50")}
                      >
                        Decline
                      </button>
                    </PersonLine>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="Who can message you">
            {heading("Who can message you")}
            {POLICIES.map((policy) => {
              const on = privacy.messagePolicy === policy.value;
              return (
                <button
                  key={policy.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => !on && void save({ messagePolicy: policy.value })}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition",
                    on
                      ? "border-primary bg-primary-50/60"
                      : "border-secondary-100 bg-secondary-50/60 hover:border-secondary-200",
                  )}
                >
                  <span>
                    <span className="block font-semibold text-secondary-950">
                      {policy.title}
                    </span>
                    <span className="block text-sm text-secondary-500">
                      {policy.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                      on ? "border-primary" : "border-secondary-300",
                    )}
                  >
                    {on && <span className="size-2.5 rounded-full bg-primary" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {heading("Blocked contacts")}
            {blocks.isLoading ? (
              <Skeleton className="h-16 rounded-2xl" />
            ) : !(blocks.data ?? []).length ? (
              <p className="rounded-2xl border border-dashed border-secondary-200 px-4 py-3 text-sm text-secondary-500">
                You haven&apos;t blocked anyone. To block someone, open their
                profile in the Turnupz app and tap ⋯.
              </p>
            ) : (
              <ul className="space-y-2">
                {blocks.data!.map((person) => (
                  <PersonLine key={person.id} person={person}>
                    <button
                      type="button"
                      onClick={() => setToUnblock(person)}
                      className={cn(pill, "border border-secondary-200 bg-white text-secondary-950 hover:bg-secondary-50")}
                    >
                      Unblock
                    </button>
                  </PersonLine>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!toUnblock}
        title={`Unblock ${toUnblock?.name ?? ""}?`}
        description="They'll be able to find you, follow you and message you again."
        confirmLabel="Unblock"
        busy={unblock.isPending}
        onCancel={() => setToUnblock(null)}
        onConfirm={() => void confirmUnblock()}
      />
    </section>
  );
};

export default memo(PrivacyCard);
