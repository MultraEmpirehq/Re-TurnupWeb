"use client";

import { siteHref } from "@/lib/domains";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { ComponentProps, useCallback } from "react";

/**
 * A link that knows which domain its page lives on (lib/domains): within the
 * same domain it moves like any link; across to the other one it loads the
 * page there. It renders the plain path, so the server and browser agree.
 */
const SiteLink = ({ href, onClick, ...props }: ComponentProps<typeof Link> & { href: string }) => (
  <Link
    href={href}
    onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const target = siteHref(href);
      if (target !== href) {
        event.preventDefault();
        window.location.assign(target);
      }
    }}
    {...props}
  />
);

/** router.push, but across to the other domain when the page lives there. */
export const useSiteNavigate = () => {
  const router = useRouter();
  return useCallback(
    (href: string) => {
      const target = siteHref(href);
      if (target !== href) window.location.assign(target);
      else router.push(href);
    },
    [router],
  );
};

export default SiteLink;
