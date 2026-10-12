"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { IVerificationDocument } from "@/lib/types";
import { ExternalLink, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import React, { useEffect, useState } from "react";
import { isImageDocument } from "./verification-utils";

const ZOOMS = [1, 1.5, 2, 3];

/**
 * A document shown on the page, to read it against the application without
 * leaving it: images zoom and rotate (phone photos often arrive sideways),
 * PDFs open in the browser's own viewer.
 */
const DocumentViewer: React.FC<{
  label: string;
  document: IVerificationDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown beside the document, to compare against. */
  compare?: { label: string; value: string | null | undefined }[];
}> = ({ label, document, open, onOpenChange, compare }) => {
  const [zoom, setZoom] = useState(0);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (open) {
      setZoom(0);
      setRotation(0);
    }
  }, [open, document?.url]);

  if (!document?.url) return null;
  const isImage = isImageDocument(document);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-3 p-4 sm:max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
          <div>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription className="text-xs">
              Check it matches the details beside it.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-1">
            {isImage && (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Zoom out"
                  disabled={zoom === 0}
                  onClick={() => setZoom((current) => Math.max(current - 1, 0))}
                >
                  <ZoomOut className="size-4" />
                </Button>
                <span className="w-12 text-center text-xs tabular-nums">
                  {Math.round(ZOOMS[zoom] * 100)}%
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Zoom in"
                  disabled={zoom === ZOOMS.length - 1}
                  onClick={() =>
                    setZoom((current) =>
                      Math.min(current + 1, ZOOMS.length - 1),
                    )
                  }
                >
                  <ZoomIn className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Rotate"
                  onClick={() => setRotation((current) => (current + 90) % 360)}
                >
                  <RotateCw className="size-4" />
                </Button>
              </>
            )}
            <Button asChild size="sm" variant="ghost">
              <a href={document.url} target="_blank" rel="noopener noreferrer">
                Open <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-h-0 overflow-auto rounded-lg bg-muted">
            {isImage ? (
              <div className="flex min-h-full min-w-full items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- a private, signed document, not a page image */}
                <img
                  src={document.url}
                  alt={label}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    width: `${ZOOMS[zoom] * 100}%`,
                  }}
                  className="max-w-none origin-center object-contain transition-transform"
                />
              </div>
            ) : (
              <iframe
                src={document.url}
                title={label}
                className="size-full min-h-[60vh] rounded-lg bg-white"
              />
            )}
          </div>
          {!!compare?.length && (
            <dl className="space-y-3 overflow-auto rounded-lg border border-border p-3 text-sm">
              {compare.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="break-words">{item.value || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
