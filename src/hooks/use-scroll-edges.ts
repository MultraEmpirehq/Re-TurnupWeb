"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks whether a sideways-scrolling box has more to show on either side, and
 * scrolls it by most of its width for the arrow buttons.
 */
const useScrollEdges = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setEdges({ left: node.scrollLeft > 2, right: node.scrollLeft < max - 2 });
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, [measure]);

  const scrollBy = useCallback((direction: -1 | 1) => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    node.scrollBy({
      left: direction * Math.max(120, node.clientWidth * 0.7),
      behavior: reduce ? "auto" : "smooth",
    });
  }, []);

  return { ref, edges, measure, scrollBy };
};

export default useScrollEdges;
