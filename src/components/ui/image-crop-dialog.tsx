"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

type TCrop = { zoom: number; x: number; y: number };

/** The largest size we keep (wider images are scaled down to this). */
const OUTPUT_WIDTH = { banner: 1920, photo: 1440 } as const;

/**
 * Crop an image to a fixed shape before it's uploaded: drag to move it, the
 * slider (or buttons) to zoom. A banner also shows how it will look on a
 * phone (the event page and the Explore card) and on the website, live.
 * "Use as is" keeps the original (gallery photos only).
 */
const ImageCropDialog: React.FC<{
  file: File | null;
  /** Width over height, e.g. 16/9 for banners, 4/5 for gallery photos. */
  aspect: number;
  kind: "banner" | "photo";
  title: string;
  description?: string;
  onCancel: () => void;
  onDone: (file: File) => void;
  /** Gallery photos: keep the original instead. */
  onSkip?: () => void;
}> = ({ file, aspect, kind, title, description, onCancel, onDone, onSkip }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<TCrop>({ zoom: 1, x: 0, y: 0 });
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [frameWidth, setFrameWidth] = useState(560);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ zoom: 1, x: 0, y: 0 });
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setNatural({ w: image.naturalWidth, h: image.naturalHeight });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The frame follows the dialog's width.
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [src]);

  const frameHeight = frameWidth / aspect;
  // At zoom 1 the image just covers the frame.
  const base = natural ? Math.max(frameWidth / natural.w, frameHeight / natural.h) : 1;
  const scale = base * crop.zoom;
  const shown = natural ? { w: natural.w * scale, h: natural.h * scale } : { w: 0, h: 0 };

  /** Keeps the image covering the frame (no empty edges). */
  const clamp = useCallback(
    (next: TCrop): TCrop => {
      if (!natural) return next;
      const s = base * next.zoom;
      const maxX = Math.max(0, (natural.w * s - frameWidth) / 2);
      const maxY = Math.max(0, (natural.h * s - frameHeight) / 2);
      return {
        zoom: next.zoom,
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [base, frameHeight, frameWidth, natural],
  );

  /** The part of the original image inside the frame, in its own pixels. */
  const sourceRect = useMemo(() => {
    if (!natural) return null;
    const left = (shown.w - frameWidth) / 2 - crop.x;
    const top = (shown.h - frameHeight) / 2 - crop.y;
    return { sx: left / scale, sy: top / scale, sw: frameWidth / scale, sh: frameHeight / scale };
  }, [crop.x, crop.y, frameHeight, frameWidth, natural, scale, shown.h, shown.w]);

  const render = useCallback(
    (width: number) => {
      const image = imageRef.current;
      if (!image || !sourceRect) return null;
      const outWidth = Math.min(width, Math.round(sourceRect.sw));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, outWidth);
      canvas.height = Math.max(1, Math.round(outWidth / aspect));
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, sourceRect.sx, sourceRect.sy, sourceRect.sw, sourceRect.sh, 0, 0, canvas.width, canvas.height);
      return canvas;
    },
    [aspect, sourceRect],
  );

  // Live previews (small), redrawn as the crop changes.
  useEffect(() => {
    if (kind !== "banner") return;
    const frame = requestAnimationFrame(() => setPreview(render(640)?.toDataURL("image/jpeg", 0.85) ?? null));
    return () => cancelAnimationFrame(frame);
  }, [kind, render]);

  const zoomTo = (zoom: number) => setCrop((current) => clamp({ ...current, zoom: Math.min(3, Math.max(1, zoom)) }));

  const save = async () => {
    const canvas = render(OUTPUT_WIDTH[kind]);
    if (!canvas || !file) return;
    setSaving(true);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    setSaving(false);
    if (!blob) return;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    onDone(new File([blob], name, { type: "image/jpeg" }));
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className={cn("max-h-[94vh] overflow-y-auto", kind === "banner" ? "sm:max-w-4xl" : "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? "Drag to move it, and zoom to get the part you want."}</DialogDescription>
        </DialogHeader>

        <div className={cn("grid gap-5", kind === "banner" && "lg:grid-cols-[minmax(0,1fr)_260px]")}>
          <div className="space-y-3">
            <div
              ref={frameRef}
              className="relative w-full cursor-grab touch-none overflow-hidden rounded-2xl bg-secondary-900 select-none active:cursor-grabbing"
              style={{ aspectRatio: String(aspect) }}
              onPointerDown={(event) => {
                (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
                drag.current = { startX: event.clientX, startY: event.clientY, x: crop.x, y: crop.y };
              }}
              onPointerMove={(event) => {
                if (!drag.current) return;
                const { startX, startY, x, y } = drag.current;
                setCrop((current) => clamp({ ...current, x: x + event.clientX - startX, y: y + event.clientY - startY }));
              }}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              onWheel={(event) => zoomTo(crop.zoom - event.deltaY * 0.0015)}
            >
              {src && natural && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
                  style={{
                    width: shown.w,
                    height: shown.h,
                    transform: `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px))`,
                  }}
                />
              )}
              {/* Thirds, to help line things up. */}
              <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <span key={index} className="border border-white/15" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Zoom out" onClick={() => zoomTo(crop.zoom - 0.2)} className="text-secondary-500 hover:text-secondary-900">
                <Minus className="size-4" />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={crop.zoom}
                onChange={(event) => zoomTo(Number(event.target.value))}
                aria-label="Zoom"
                className="flex-1 accent-primary"
              />
              <button type="button" aria-label="Zoom in" onClick={() => zoomTo(crop.zoom + 0.2)} className="text-secondary-500 hover:text-secondary-900">
                <Plus className="size-4" />
              </button>
            </div>
            {natural && natural.w < OUTPUT_WIDTH[kind] * 0.6 && (
              <p className="text-xs text-warning">
                This image is small ({natural.w}×{natural.h}), so it may look soft on big screens. A wider one works
                better.
              </p>
            )}
          </div>

          {kind === "banner" && (
            <div className="space-y-4">
              <p className="text-xs font-bold tracking-wide text-secondary-400 uppercase">How it looks</p>
              {/* Phone: the app's event page, the banner across the top. */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-secondary-600">On a phone</p>
                <div className="mx-auto w-[180px] overflow-hidden rounded-[22px] border-4 border-secondary-900 bg-white shadow-lg">
                  <div className="w-full bg-secondary-100" style={{ aspectRatio: "16 / 9" }}>
                    {preview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="space-y-1.5 p-2.5">
                    <span className="block h-2.5 w-3/4 rounded bg-secondary-200" />
                    <span className="block h-2 w-1/2 rounded bg-secondary-100" />
                    <span className="block h-2 w-2/3 rounded bg-secondary-100" />
                    <span className="mt-2 block h-6 rounded-full bg-primary/80" />
                  </div>
                </div>
              </div>
              {/* The Explore card. */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-secondary-600">In Explore</p>
                <div className="overflow-hidden rounded-2xl border border-secondary-100 bg-white shadow-sm">
                  <div className="w-full bg-secondary-100" style={{ aspectRatio: "16 / 9" }}>
                    {preview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 p-2.5">
                    <span className="h-7 w-7 rounded-lg bg-primary/10" />
                    <span className="h-2.5 flex-1 rounded bg-secondary-200" />
                  </div>
                </div>
              </div>
              {/* The website's event page. */}
              <div>
                <p className="mb-1.5 text-xs font-semibold text-secondary-600">On the website</p>
                <div className="overflow-hidden rounded-xl border border-secondary-100 bg-white">
                  <div className="flex h-3 items-center gap-1 bg-secondary-50 px-1.5">
                    <span className="size-1.5 rounded-full bg-secondary-300" />
                    <span className="size-1.5 rounded-full bg-secondary-300" />
                  </div>
                  <div className="p-1.5">
                    <div className="w-full overflow-hidden rounded-md bg-secondary-100" style={{ aspectRatio: "16 / 9" }}>
                      {preview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="" className="size-full object-cover" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-secondary-500">
                Keep words and faces away from the edges: some screens trim a little.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" className="rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
          {onSkip && (
            <Button variant="outline" className="rounded-xl" onClick={onSkip}>
              Use as is
            </Button>
          )}
          <Button className="rounded-xl" loading={saving} disabled={!natural} onClick={save}>
            Use this crop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ImageCropDialog);

/**
 * Gallery photos, several at a time: each image is cropped to 4:5 in turn
 * ("Use as is" keeps it, Cancel drops it); videos go straight through. When
 * the last one is done, `onReady` gets them all, in the order picked.
 */
export const useGalleryCrop = (
  onReady: (files: File[]) => void,
  description = "Event photos show at 4:5 on phones. Drag and zoom to frame it.",
) => {
  const [queue, setQueue] = useState<File[]>([]);
  const done = useRef<File[]>([]);
  const order = useRef<File[]>([]);

  const finish = (rest: File[]) => {
    setQueue(rest);
    if (rest.length) return;
    // Back in the order they were picked (cropped ones in their originals' places).
    const picked = order.current
      .map((original) => done.current.find((file) => (file as File & { from?: File }).from === original || file === original))
      .filter((file): file is File => !!file);
    done.current = [];
    order.current = [];
    if (picked.length) onReady(picked);
  };

  const start = (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    order.current = files;
    done.current = files.filter((file) => !file.type.startsWith("image/"));
    if (!images.length) finish([]);
    else setQueue(images);
  };

  const current = queue[0] ?? null;
  const dialog = (
    <ImageCropDialog
      file={current}
      aspect={4 / 5}
      kind="photo"
      title={queue.length > 1 ? `Crop photo (${queue.length} to go)` : "Crop photo"}
      description={description}
      onCancel={() => finish(queue.slice(1))}
      onSkip={() => {
        if (current) done.current.push(current);
        finish(queue.slice(1));
      }}
      onDone={(cropped) => {
        // Remember which original it came from, to keep the order.
        done.current.push(Object.assign(cropped, { from: current }));
        finish(queue.slice(1));
      }}
    />
  );
  return { start, dialog };
};
