"use client";

import { Loader2Icon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** The app's toast icons: a white mark in a soft white circle. */
const Mark = ({ path }: { path: string }) => (
  <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={path} stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

const INFO = "M12 11v6M12 7.5v.5";
const ALERT = "M12 7v6M12 16.5v.5";

/**
 * The same toast as the app: a solid card in the colour of what happened, with a
 * bar along the bottom that runs down until it closes (globals.css, "Toasts").
 * Toast through @/lib/toast, which gives each one its time.
 */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    // Solid colours in both light and dark, so it doesn't follow the theme.
    theme="light"
    className="toaster group"
    closeButton
    // Wider than sonner's 356px, so messages sit on one or two lines. Phones use their full width.
    style={{ "--width": "480px" } as React.CSSProperties}
    icons={{
      success: <Mark path="M5 12.5l4.5 4.5L19 7.5" />,
      info: <Mark path={INFO} />,
      warning: <Mark path={ALERT} />,
      error: <Mark path={ALERT} />,
      loading: (
        <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
          <Loader2Icon className="size-4 animate-spin text-white" />
        </span>
      ),
    }}
    {...props}
  />
);

export { Toaster };
