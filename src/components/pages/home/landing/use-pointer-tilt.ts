"use client";

import { RefObject, useEffect } from "react";

/**
 * Turns the pointer's position over `areaRef` into a gentle 3D lean, written as the
 * css variables `--rx` and `--ry` (degrees) on `targetRef`, plus `--mx` and `--my`
 * (-1 to 1, unitless) for parallax offsets. The values ease toward
 * the pointer each frame, so the motion feels weighted rather than twitchy, and
 * nothing re-renders. Touch screens and reduced motion get no lean at all.
 */
const usePointerTilt = (
  areaRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
  { maxX = 8, maxY = 12 }: { maxX?: number; maxY?: number } = {},
) => {
  useEffect(() => {
    const area = areaRef.current;
    const target = targetRef.current;
    if (!area || !target) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    let goalX = 0;
    let goalY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const step = () => {
      x += (goalX - x) * 0.08;
      y += (goalY - y) * 0.08;
      target.style.setProperty("--rx", `${x.toFixed(3)}deg`);
      target.style.setProperty("--ry", `${y.toFixed(3)}deg`);
      target.style.setProperty("--mx", (y / maxY).toFixed(4));
      target.style.setProperty("--my", (-x / maxX).toFixed(4));
      frame =
        Math.abs(goalX - x) > 0.01 || Math.abs(goalY - y) > 0.01
          ? requestAnimationFrame(step)
          : 0;
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };

    const handleMove = (event: PointerEvent) => {
      const box = area.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width - 0.5;
      const py = (event.clientY - box.top) / box.height - 0.5;
      goalX = -py * maxX * 2;
      goalY = px * maxY * 2;
      kick();
    };
    const handleLeave = () => {
      goalX = 0;
      goalY = 0;
      kick();
    };

    area.addEventListener("pointermove", handleMove);
    area.addEventListener("pointerleave", handleLeave);
    return () => {
      area.removeEventListener("pointermove", handleMove);
      area.removeEventListener("pointerleave", handleLeave);
      cancelAnimationFrame(frame);
    };
  }, [areaRef, targetRef, maxX, maxY]);
};

export default usePointerTilt;
