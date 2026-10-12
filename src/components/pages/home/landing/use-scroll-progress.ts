"use client";

import { RefObject, useEffect } from "react";

/**
 * How far the page has scrolled through `areaRef`, from 0 (its top at the top
 * of the screen) to 1 (done), written as the css variable
 * `--p` on `targetRef`. Updated once per frame while scrolling, so nothing
 * re-renders. Reduced motion leaves it at 0.
 */
const useScrollProgress = (
  areaRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
) => {
  useEffect(() => {
    const area = areaRef.current;
    const target = targetRef.current;
    if (!area || !target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const box = area.getBoundingClientRect();
      // A section taller than the screen pins its scene: progress runs over
      // the extra height, while it holds still. Otherwise, over its own height.
      const travel =
        box.height > window.innerHeight * 1.1
          ? box.height - window.innerHeight
          : box.height;
      const progress = Math.min(Math.max(-box.top / Math.max(travel, 1), 0), 1);
      target.style.setProperty("--p", progress.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [areaRef, targetRef]);
};

export default useScrollProgress;
