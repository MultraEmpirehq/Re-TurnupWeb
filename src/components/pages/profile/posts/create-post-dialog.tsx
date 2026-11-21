"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGalleryCrop } from "@/components/ui/image-crop-dialog";
import Notice from "@/components/ui/notice";
import SelectField from "@/components/ui/select-field";
import { Switch } from "@/components/ui/switch";
import TextareaField from "@/components/ui/textarea-field";
import { POST_LIMITS, useCreatePost } from "@/hooks/use-posts";
import { PeoplePicker, useMutualFollows } from "@/components/pages/app/messages/new-group-dialog";
import { ImagePlus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";

const NO_EVENT = "none";

/** Picked files with a preview each; previews are freed when the list changes. */
const usePreviews = (files: File[]) => {
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);
  return previews;
};

/**
 * New post: photos (cropped to 4:5, or kept as they are) and clips, a caption,
 * and, optionally, an event you had a ticket for that ended in the last two
 * weeks. Linked to an event, it shows in that event's highlights straight away;
 * the organiser can take it off there.
 */
const CreatePostDialog = ({
  open,
  onOpenChange,
  username,
  events,
  isPrivate,
  defaultEventId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string | null;
  /** Events they can post to: had a ticket, over, still open for photos. */
  events: { id: string; name: string }[];
  isPrivate?: boolean;
  defaultEventId?: string;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [eventId, setEventId] = useState(NO_EVENT);
  const [showName, setShowName] = useState(true);
  const [consent, setConsent] = useState(false);
  // People tagged in it: those who follow you back.
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tagging, setTagging] = useState(false);
  const mutuals = useMutualFollows();
  const tagNames = mutuals.people.filter((person) => tagIds.includes(person.id)).map((person) => person.name);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const previews = usePreviews(files);
  const create = useCreatePost(username);
  const gallery = useGalleryCrop(
    (picked) => setFiles((current) => [...current, ...picked].slice(0, POST_LIMITS.media)),
    "Posts show at 4:5. Drag and zoom to frame it.",
  );

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setCaption("");
    setEventId(defaultEventId ?? NO_EVENT);
    setShowName(true);
    setConsent(false);
    setTagIds([]);
    setTagging(false);
    setError("");
  }, [open, defaultEventId]);

  const linked = eventId !== NO_EVENT;
  const room = POST_LIMITS.media - files.length;

  const submit = () => {
    setError("");
    create.mutate(
      { files, caption, eventId: linked ? eventId : undefined, showName, consent, tagUserIds: tagIds },
      {
        onSuccess: () => {
          toast.success(linked ? "Posted. It's on your profile and the event page." : "Posted.");
          onOpenChange(false);
        },
        onError: (failure) =>
          setError(
            failure instanceof Error && !("response" in failure)
              ? failure.message
              : constructErrorMessage(failure as TApiErrorResponseType, "Couldn't post it. Try again."),
          ),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
          <DialogDescription>
            Up to {POST_LIMITS.media} photos or clips (clips up to {POST_LIMITS.clipSeconds} seconds).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
              {file.type.startsWith("video/") ? (
                <video src={previews[index]} className="size-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[index]} alt="" className="size-full object-cover" />
              )}
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          ))}
          {room > 0 && (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ImagePlus className="size-5" aria-hidden />
              Add
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
            gallery.start(Array.from(event.target.files ?? []).slice(0, room));
            event.target.value = "";
          }}
        />
        {gallery.dialog}

        <TextareaField
          label="Caption (optional)"
          placeholder="Say something about it"
          value={caption}
          maxLength={POST_LIMITS.caption}
          onChange={(event) => setCaption(event.target.value)}
        />

        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Tag people</p>
              <p className="truncate text-xs text-muted-foreground">
                {tagNames.length ? tagNames.join(", ") : "People who follow you back"}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" className="shrink-0 rounded-lg" onClick={() => setTagging((on) => !on)}>
              <UserPlus className="size-4" aria-hidden /> {tagging ? "Done" : tagIds.length ? "Change" : "Add"}
            </Button>
          </div>
          {tagging && (
            <PeoplePicker
              people={mutuals.people}
              loading={mutuals.isLoading}
              chosen={tagIds}
              onToggle={(id) => setTagIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))}
            />
          )}
        </div>

        {events.length > 0 && (
          <SelectField
            label="Event (optional)"
            value={eventId}
            setValue={setEventId}
            options={[{ label: "Not linked to an event", value: NO_EVENT }, ...events.map((event) => ({ label: event.name, value: event.id }))]}
            helperText="Linked, it also shows in the event's highlights. The organiser can remove it from there."
          />
        )}

        {linked && (
          <>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <span className="space-y-0.5">
                <span className="block text-sm font-semibold text-foreground">Show my username on the event page</span>
                <span className="block text-xs text-muted-foreground">Off: shown as &quot;Someone who was there&quot;</span>
              </span>
              <Switch checked={showName} onCheckedChange={setShowName} />
            </label>
            <label className="flex items-start gap-2.5 text-sm text-foreground">
              <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" />
              <span>I took these, and anyone clearly in them is happy to be shared.</span>
            </label>
            {isPrivate && (
              <Notice tone="info" title="Your profile is private">
                <p>Only your followers see it, so it won&apos;t show on the event page.</p>
              </Notice>
            )}
          </>
        )}

        {error && (
          <Notice tone="danger" title="Not posted">
            <p>{error}</p>
          </Notice>
        )}

        <Button
          className="w-full rounded-xl"
          disabled={!files.length || (linked && !consent) || create.isPending}
          loading={create.isPending}
          onClick={submit}
        >
          {files.length ? "Post" : "Pick photos or clips"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default memo(CreatePostDialog);
