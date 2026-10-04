import { RefObject, useEffect, useState } from "react";

/**
 * Whether a scrollable element has more content above or below what is in view,
 * for fading its edges when its scrollbar is hidden. Rechecks on scroll, on resize
 * and when the content changes (a section opening or closing).
 */
const useScrollFade = (ref: RefObject<HTMLElement | null>) => {
  const [edges, setEdges] = useState({ top: false, bottom: false });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const next = {
        top: scrollTop > 1,
        bottom: scrollTop + clientHeight < scrollHeight - 1,
      };
      setEdges((current) =>
        current.top === next.top && current.bottom === next.bottom
          ? current
          : next,
      );
    };

    update();
    element.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(element, { childList: true, subtree: true });

    return () => {
      element.removeEventListener("scroll", update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [ref]);

  return edges;
};

export default useScrollFade;
