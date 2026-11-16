"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InputField from "@/components/ui/input-field";
import Notice from "@/components/ui/notice";
import { Switch } from "@/components/ui/switch";
import { HIGHLIGHT_LIMITS, useSendCrowdPhotos } from "@/hooks/use-event-highlights";
import { CheckCircle2, Clock, ImagePlus, X } from "lucide-react";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";

/** Picked files with a preview each; previews are freed when the list changes. */
const usePreviews = (files: File[]) => {
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);
  return previews;
};

/**
 * "Were you there?": a ticket holder picks photos and clips, adds a caption,
 * chooses whether their username shows, confirms they may share them, and
 * sends them to the organiser for approval.
 */
const AddCrowdPhotos = ({
  eventId,
  eventName,
  remaining,
  open,
  onOpenChange,
}: {
  eventId: string;
  eventName: string;
  remaining: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [showName, setShowName] = useState(true);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const previews = usePreviews(files);
  const send = useSendCrowdPhotos(eventId);

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setCaption("");
    setConsent(false);
    setError("");
    setSent(0);
  }, [open]);

  const pick = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, remaining);
    if (files.length + list.length > remaining) setError(`You can add ${remaining} more.`);
    else setError("");
    setFiles(next);
  };

  const submit = () => {
    setError("");
    send.mutate(
      { files, caption, showName },
      {
        onSuccess: () => setSent(files.length),
        onError: (failure) =>
          setError(
            failure instanceof Error && !("response" in failure)
              ? failure.message
              : constructErrorMessage(failure as TApiErrorResponseType, "Couldn't send them. Try again."),
          ),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="size-10 text-success" aria-hidden />
            <DialogTitle className="text-xl">Sent to the organiser</DialogTitle>
            <DialogDescription>
              We&apos;ll let you know when they&apos;re up on the {eventName} page.
            </DialogDescription>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-line bg-warning-soft px-3 py-1 text-sm font-semibold text-warning">
              <Clock className="size-3.5" aria-hidden /> {sent} waiting for approval
            </span>
            <Button className="mt-2 rounded-xl" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add your photos</DialogTitle>
              <DialogDescription>
                {eventName}. You can add {remaining} more, and clips up to {HIGHLIGHT_LIMITS.clipSeconds} seconds.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
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
              {files.length < remaining && (
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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
                pick(event.target.files);
                event.target.value = "";
              }}
            />

            <InputField
              label="Caption (optional)"
              placeholder="Front row for this one"
              value={caption}
              maxLength={140}
              onChange={(event) => setCaption(event.target.value)}
            />

            <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <span className="space-y-0.5">
                <span className="block text-sm font-semibold text-foreground">Show my username</span>
                <span className="block text-xs text-muted-foreground">Off: posted as &quot;Someone who was there&quot;</span>
              </span>
              <Switch checked={showName} onCheckedChange={setShowName} />
            </label>

            <label className="flex items-start gap-2.5 text-sm text-foreground">
              <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" />
              <span>I took these, and anyone clearly in them is happy to be shared.</span>
            </label>

            {error && (
              <Notice tone="danger" title="Not sent">
                <p>{error}</p>
              </Notice>
            )}

            <div className="space-y-2">
              <Button
                className="w-full rounded-xl"
                disabled={!files.length || !consent || send.isPending}
                loading={send.isPending}
                onClick={submit}
              >
                {files.length ? `Send ${files.length} to the organiser` : "Pick photos or clips"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                They show on the event page once the organiser approves them.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default memo(AddCrowdPhotos);
