"use client";

import { useEffect, useState } from "react";
import { TLiveCodeDetails } from "./types";

/**
 * A ticket's live QR code, made in the browser from the ticket's secret and
 * the time. It changes every 30 seconds, so a screenshot stops working
 * within about 90 seconds. Must match the API's format exactly:
 *
 *   TZ1.<ticket code>.<30-second window>.<12 hex characters of HMAC-SHA256>
 */

const OFFSET_KEY = "turnupz-server-offset-ms";

/** How far this device's clock is from Turnupz's, learnt when tickets load. */
export const rememberServerTime = (serverTime: string, receivedAt = Date.now()) => {
  const offset = new Date(serverTime).getTime() - receivedAt;
  if (!Number.isFinite(offset) || Math.abs(offset) > 7 * 24 * 60 * 60 * 1000) return;
  try {
    localStorage.setItem(OFFSET_KEY, String(offset));
  } catch {
    // Private windows: the device clock is used as it is.
  }
};

/** Now, on Turnupz's clock: right even when the device's time is set wrong. */
export const serverNow = () => {
  try {
    return Date.now() + Number(localStorage.getItem(OFFSET_KEY) ?? 0);
  } catch {
    return Date.now();
  }
};

const encoder = new TextEncoder();
const keys = new Map<string, Promise<CryptoKey>>();
const keyFor = (secret: string) => {
  if (!keys.has(secret)) {
    keys.set(
      secret,
      crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]),
    );
  }
  return keys.get(secret)!;
};

export const liveCodeFor = async (secret: string, code: string, windowSeconds = 30, at = serverNow()) => {
  const window = Math.floor(at / 1000 / windowSeconds);
  const signature = await crypto.subtle.sign("HMAC", await keyFor(secret), encoder.encode(`${code}.${window}`));
  const mac = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12)
    .toUpperCase();
  return `TZ1.${code}.${window}.${mac}`;
};

/**
 * The code a ticket shows: live when it has a secret (re-made every second,
 * so it turns over on time), else its plain code. `secondsLeft` drives the
 * countdown.
 */
export const useLiveCode = (
  liveCode: TLiveCodeDetails | null | undefined,
  code: string,
  plain: string,
  running = true,
) => {
  const windowSeconds = liveCode?.windowSeconds ?? 30;
  const [state, setState] = useState({ value: plain, secondsLeft: windowSeconds });
  useEffect(() => {
    if (!liveCode?.secret || !running) {
      setState({ value: plain, secondsLeft: windowSeconds });
      return;
    }
    let cancelled = false;
    const tick = async () => {
      const at = serverNow();
      const value = await liveCodeFor(liveCode.secret, code, windowSeconds, at);
      if (!cancelled) {
        setState({ value, secondsLeft: windowSeconds - (Math.floor(at / 1000) % windowSeconds) });
      }
    };
    void tick();
    const timer = setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [code, liveCode?.secret, plain, running, windowSeconds]);
  return { ...state, live: !!liveCode?.secret, windowSeconds };
};
