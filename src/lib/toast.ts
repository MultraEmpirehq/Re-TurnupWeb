import { type ExternalToast, toast as sonner } from "sonner";

/**
 * How long a toast stays, the same as the app: errors a little longer, since they
 * usually say what to do next. The bar along its bottom runs down over this time.
 */
export const TOAST_DURATION = { error: 6000, warning: 6000, success: 4000, info: 4000 } as const;

type TMessage = Parameters<typeof sonner.success>[0];

/** Tells the toast's bar how long to run, from the time it was actually given. */
const timed = (fallback: number, options?: ExternalToast): ExternalToast => {
  const duration = options?.duration ?? fallback;
  return {
    ...options,
    duration,
    style: {
      ...options?.style,
      ...(Number.isFinite(duration)
        ? ({ "--toast-time": `${duration}ms` } as React.CSSProperties)
        : {}),
    },
  };
};

/** Use this rather than sonner directly, so every toast has the right time and bar. */
export const toast = Object.assign(
  (message: TMessage, options?: ExternalToast) =>
    sonner(message, timed(TOAST_DURATION.info, options)),
  sonner,
  {
    success: (message: TMessage, options?: ExternalToast) =>
      sonner.success(message, timed(TOAST_DURATION.success, options)),
    error: (message: TMessage, options?: ExternalToast) =>
      sonner.error(message, timed(TOAST_DURATION.error, options)),
    warning: (message: TMessage, options?: ExternalToast) =>
      sonner.warning(message, timed(TOAST_DURATION.warning, options)),
    info: (message: TMessage, options?: ExternalToast) =>
      sonner.info(message, timed(TOAST_DURATION.info, options)),
  },
);
