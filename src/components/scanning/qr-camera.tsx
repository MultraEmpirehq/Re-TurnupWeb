"use client";

import { cn } from "@/lib/utils";
import jsQR from "jsqr";
import { CameraOff, Loader2 } from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";

type TBarcodeDetector = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};
type TBarcodeDetectorClass = new (options: { formats: string[] }) => TBarcodeDetector;

/** The same code read again this soon is the same ticket still in view. */
const REPEAT_WINDOW_MS = 3000;

/**
 * The back camera, reading QR codes. Uses the browser's own detector where there
 * is one (Chrome, Edge, Android) and jsQR elsewhere (Safari, Firefox). `paused`
 * stops reading without closing the camera, while a result is on screen.
 */
const QrCamera: React.FC<{
  paused?: boolean;
  onDetect: (code: string) => void;
  className?: string;
}> = ({ paused = false, onDetect, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const onDetectRef = useRef(onDetect);
  const lastRef = useRef<{ code: string; at: number } | null>(null);
  const [state, setState] = useState<"starting" | "on" | "blocked" | "none">(
    "starting",
  );

  useEffect(() => {
    pausedRef.current = paused;
    onDetectRef.current = onDetect;
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let cancelled = false;
    let busy = false;
    const Detector = (window as unknown as { BarcodeDetector?: TBarcodeDetectorClass })
      .BarcodeDetector;
    const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;

    const report = (code: string) => {
      const now = Date.now();
      const last = lastRef.current;
      if (last && last.code === code && now - last.at < REPEAT_WINDOW_MS) return;
      lastRef.current = { code, at: now };
      onDetectRef.current(code);
    };

    const read = async () => {
      const video = videoRef.current;
      if (cancelled || !video) return;
      if (!pausedRef.current && !busy && video.readyState >= 2) {
        busy = true;
        try {
          if (detector) {
            const [found] = await detector.detect(video);
            if (found?.rawValue) report(found.rawValue.trim());
          } else if (canvasRef.current) {
            const canvas = canvasRef.current;
            // A smaller frame reads just as well and keeps phones cool.
            const scale = Math.min(1, 640 / video.videoWidth);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const image = context.getImageData(0, 0, canvas.width, canvas.height);
              const found = jsQR(image.data, image.width, image.height, {
                inversionAttempts: "dontInvert",
              });
              if (found?.data) report(found.data.trim());
            }
          }
        } catch {
          // A frame that can't be read is skipped; the next one is tried.
        } finally {
          busy = false;
        }
      }
      frame = requestAnimationFrame(read);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("none");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setState("on");
        frame = requestAnimationFrame(read);
      } catch (error) {
        if (cancelled) return;
        setState(
          (error as DOMException)?.name === "NotAllowedError" ? "blocked" : "none",
        );
      }
    };
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-secondary-950",
        className,
      )}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label="Camera view for scanning ticket QR codes"
        className={cn(
          "size-full object-cover transition-opacity",
          state === "on" ? "opacity-100" : "opacity-0",
        )}
      />
      <canvas ref={canvasRef} className="hidden" aria-hidden />

      {state === "on" && (
        // The aiming frame; the corners are drawn by the borders.
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative size-[62%] max-w-[280px]">
            <span className="absolute top-0 left-0 size-8 rounded-tl-xl border-t-4 border-l-4 border-white" />
            <span className="absolute top-0 right-0 size-8 rounded-tr-xl border-t-4 border-r-4 border-white" />
            <span className="absolute bottom-0 left-0 size-8 rounded-bl-xl border-b-4 border-l-4 border-white" />
            <span className="absolute right-0 bottom-0 size-8 rounded-br-xl border-r-4 border-b-4 border-white" />
            {!paused && (
              <span className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse bg-primary shadow-[0_0_12px_2px] shadow-primary/70" />
            )}
          </div>
        </div>
      )}

      {state !== "on" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white/80">
          {state === "starting" ? (
            <>
              <Loader2 className="size-7 animate-spin" aria-hidden />
              <p className="text-sm">Starting the camera…</p>
            </>
          ) : (
            <>
              <CameraOff className="size-8" aria-hidden />
              <p className="max-w-xs text-sm leading-6">
                {state === "blocked"
                  ? "Camera access is blocked. Allow it in your browser's site settings, or type the ticket code below."
                  : "No camera is available here. Type the ticket code below instead."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(QrCamera);
