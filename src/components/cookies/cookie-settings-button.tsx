"use client";

import React from "react";
import { OPEN_COOKIE_CHOICE } from "./cookie-gate";

/** Opens the cookie choice again, to change it. */
const CookieSettingsButton = ({ className }: { className?: string }) => (
  <button
    type="button"
    onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_CHOICE))}
    className={className}
  >
    Cookie settings
  </button>
);

export default CookieSettingsButton;
