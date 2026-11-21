"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import Notice from "@/components/ui/notice";
import SegmentedControl from "@/components/ui/segmented-control";
import StatusBadge from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import TextareaField from "@/components/ui/textarea-field";
import {
  HIGHLIGHT_LIMITS,
  IManagedHighlight,
  useHighlightSettings,
  useManageHighlights,
  usePostHighlights,
  useRemoveHighlight,
  useReviewHighlight,
} from "@/hooks/use-event-highlights";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Flag, ImagePlus, Play, Star, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { memo, useEffect, useRef, useState } from "react";

const failed = (error: unknown, fallback: string) =>
  toast.error(
    error instanceof Error && !("response" in error)
      ? error.message
      : constructErrorMessage(error as TApiErrorResponseType, fallback),
  );

const Thumb = ({ item }: { item: IManagedHighlight }) => (
  <>
    {item.type === "video" ? (
      <video src={`${item.url}#t=0.1`} className="size-full object-cover" muted playsInline preload="metadata" />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.url} alt={item.caption || "Highlight"} className="size-full object-cover" loading="lazy" />
    )}
    {item.type === "video" && (
      <span className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-white/90 text-secondary-950">
        <Play className="size-3.5 fill-current" aria-hidden />
      </span>
    )}
  </>
);

type TTab = "approved" | "declined";

/**
 * The organiser's highlights for an event that's over: post their own photos
 * and clips, write the thank-you line, choose what shows, and look after
 * ticket holders' posts: they show straight away, and you can take any off
 * (it stays on the person's profile) or put it back.
 */
const HighlightsManager = ({ eventId, eventName }: { eventId: string; eventName: string }) => {
  const { data } = useManageHighlights(eventId);
  const post = usePostHighlights(eventId);
  const settings = useHighlightSettings(eventId);
  const review = useReviewHighlight(eventId);
  const remove = useRemoveHighlight(eventId);
  const input = useRef<HTMLInputElement>(null);
  const section = useRef<HTMLElement>(null);
  const params = useSearchParams();
  const [notifyHolders, setNotifyHolders] = useState(true);
  const [recap, setRecap] = useState("");
  const [tab, setTab] = useState<TTab>("approved");

  useEffect(() => setRecap(data?.settings.recap ?? ""), [data?.settings.recap]);
  // From the "new photos from the crowd" notification.
  useEffect(() => {
    if (params.get("tab") === "highlights" && data) section.current?.scrollIntoView({ behavior: "smooth" });
  }, [params, data]);

  if (!data?.over) return null;
  const mine = data.items.filter((item) => item.fromOrganiser);
  const crowd = data.items.filter((item) => !item.fromOrganiser && item.status === tab);
  const room = data.counts.organiserLimit - data.counts.organiser;

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, room);
    post.mutate(
      { files: picked, notifyHolders: notifyHolders && data.counts.organiser === 0 },
      {
        onSuccess: () => toast.success(picked.length === 1 ? "It's up on the event page." : `${picked.length} are up on the event page.`),
        onError: (error) => failed(error, "Couldn't post them."),
      },
    );
  };

  const save = (body: Parameters<typeof settings.mutate>[0], done = "Saved") =>
    settings.mutate(body, { onSuccess: () => toast.success(done), onError: (error) => failed(error, "Couldn't save that.") });

  return (
    <section ref={section} id="highlights" aria-labelledby="highlights-title" className="scroll-mt-24 space-y-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="space-y-1">
        <h2 id="highlights-title" className="text-xl font-bold text-foreground">Highlights</h2>
        <p className="text-sm text-muted-foreground">
          {eventName} is over. Photos and clips you add show at the top of the event page, with your next event under them.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground">Your photos and clips</h3>
          <span className="text-sm text-muted-foreground">
            {data.counts.organiser} of {data.counts.organiserLimit} · clips up to {HIGHLIGHT_LIMITS.clipSeconds}s
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {mine.map((item) => (
            <div key={item.id} className={cn("group relative aspect-square overflow-hidden rounded-xl bg-muted", item.isCover && "ring-2 ring-primary")}>
              <Thumb item={item} />
              {item.isCover && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-2xs font-bold text-primary-foreground">Cover</span>
              )}
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                {item.type === "image" && !item.isCover && (
                  <button
                    type="button"
                    aria-label="Make this the cover"
                    title="Make this the cover"
                    onClick={() => review.mutate({ id: item.id, isCover: true }, { onError: (error) => failed(error, "Couldn't change the cover.") })}
                    className="flex size-7 items-center justify-center rounded-full bg-black/65 text-white"
                  >
                    <Star className="size-3.5" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => remove.mutate(item.id, { onError: (error) => failed(error, "Couldn't remove it.") })}
                  className="flex size-7 items-center justify-center rounded-full bg-black/65 text-white"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ))}
          {room > 0 && (
            <button
              type="button"
              disabled={post.isPending}
              onClick={() => input.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
            >
              <ImagePlus className="size-5" aria-hidden />
              {post.isPending ? "Uploading…" : "Add"}
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(event) => {
            upload(event.target.files);
            event.target.value = "";
          }}
        />
        {data.counts.organiser === 0 && (
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <span className="space-y-0.5">
              <span className="block text-sm font-semibold text-foreground">Tell ticket holders</span>
              <span className="block text-xs text-muted-foreground">One notification when your first highlights go up.</span>
            </span>
            <Switch checked={notifyHolders} onCheckedChange={setNotifyHolders} />
          </label>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <TextareaField
            label="A line for the people who came (optional)"
            placeholder="What a night. Thank you for turning up!"
            value={recap}
            maxLength={200}
            onChange={(event) => setRecap(event.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={recap === (data.settings.recap ?? "") || settings.isPending}
            onClick={() => save({ recap: recap.trim() || null })}
          >
            Save line
          </Button>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <span className="space-y-0.5">
              <span className="block text-sm font-semibold text-foreground">Show how many turned up</span>
              <span className="block text-xs text-muted-foreground">Rounded down, e.g. &quot;800+ turned up&quot;.</span>
            </span>
            <Switch
              checked={data.settings.showAttendance}
              onCheckedChange={(on) => save({ showAttendance: on })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <span className="space-y-0.5">
              <span className="block text-sm font-semibold text-foreground">Let ticket holders add photos</span>
              <span className="block text-xs text-muted-foreground">
                {data.settings.crowdPhotosOpen && new Date(data.crowdOpenUntil) > new Date()
                  ? `Open until ${format(new Date(data.crowdOpenUntil), "d MMM")}. They show straight away; take off any you don't want.`
                  : "Closed. Ticket holders can't add more."}
              </span>
            </span>
            <Switch
              checked={data.settings.crowdPhotosOpen}
              onCheckedChange={(on) => save({ crowdPhotosOpen: on })}
            />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-foreground">From the crowd</h3>
          <SegmentedControl
            label="Fans' photos"
            value={tab}
            onChange={setTab}
            options={[
              { value: "approved", label: `Showing (${data.counts.approved})` },
              { value: "declined", label: `Taken off (${data.counts.declined})` },
            ]}
          />
        </div>

        {crowd.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {tab === "approved" ? "No posts from ticket holders yet. They show here and on the event page as they come in." : "None taken off."}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {crowd.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-2xl border border-border bg-background">
                <div className="relative aspect-[4/3] bg-muted">
                  <Thumb item={item} />
                </div>
                <div className="space-y-2.5 p-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.by}</span>
                    {item.checkedIn ? " · checked in" : " · had a ticket"}
                    {item.caption ? ` · "${item.caption}"` : ""}
                  </p>
                  {item.reports > 0 && (
                    <StatusBadge tone="danger" icon={Flag}>
                      Reported {item.reports} {item.reports === 1 ? "time" : "times"}
                    </StatusBadge>
                  )}
                  <div className="flex gap-2">
                    {item.status !== "approved" && (
                      <Button
                        size="sm"
                        className="flex-1 rounded-lg"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: item.id, status: "approved" }, { onError: (error) => failed(error, "Couldn't put it back.") })}
                      >
                        Put back
                      </Button>
                    )}
                    {item.status !== "declined" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: item.id, status: "declined" }, { onError: (error) => failed(error, "Couldn't take it off.") })}
                      >
                        Take off event
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!data.crowdOpen && data.counts.approved === 0 && (
          <Notice tone="neutral" title="Fan photos are closed">
            <p>Turn on &quot;Let ticket holders add photos&quot; to open it again.</p>
          </Notice>
        )}
      </div>
    </section>
  );
};

export default memo(HighlightsManager);
