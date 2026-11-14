"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Smooth, eased scrolling for the whole site. Off for anyone who's asked their
 * device for less motion; touch scrolling stays native (phones already glide).
 * It pauses while a dialog, sheet or menu holds the page still, and anything
 * that scrolls on its own (chats, sidebars, lists in pop-ups) keeps scrolling
 * normally.
 */
const SmoothScroll = () => {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      // In-page links (#section) glide too.
      anchors: true,
      allowNestedScroll: true,
      prevent: (node) =>
        !!node.closest?.(
          '[role="dialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper], [data-lenis-prevent]',
        ),
    });
    lenisRef.current = lenis;

    // Radix locks the page (data-scroll-locked on <body>) while a dialog or
    // sheet is open: stop with it, so the page behind can't drift.
    const syncLock = () =>
      document.body.hasAttribute("data-scroll-locked")
        ? lenis.stop()
        : lenis.start();
    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
    });

    return () => {
      observer.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // A new page starts where Next put it, not where the last glide was heading.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    lenis.resize();
  }, [pathname]);

  return null;
};

export default SmoothScroll;
