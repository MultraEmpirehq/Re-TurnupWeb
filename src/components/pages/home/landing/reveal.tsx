"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

/** Fades its children up the first time they scroll into view. */
const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** Milliseconds to wait, for staggering siblings. */
  delay?: number;
  as?: "div" | "li" | "section";
}> = ({ children, className, delay = 0, as: Tag = "div" }) => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-visible={isVisible}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("landing-reveal", className)}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
