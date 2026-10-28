import { useLayoutEffect } from "react";

let locks = 0;
let unlock: (() => void) | undefined;

// overflow:hidden alone does not keep the background stationary on iOS.
export function usePageScrollLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return;
    if (locks++ === 0) {
      const body = document.body;
      const left = window.scrollX;
      const top = window.scrollY;
      const href = window.location.href;
      const properties = ["position", "top", "left", "width", "overflow"];
      const previous = properties.map((property) => ({
        property,
        value: body.style.getPropertyValue(property),
        priority: body.style.getPropertyPriority(property),
      }));
      body.style.position = "fixed";
      body.style.top = `${-top}px`;
      body.style.left = `${-left}px`;
      body.style.width = "100%";
      body.style.overflow = "hidden";

      unlock = () => {
        for (const { property, value, priority } of previous) {
          if (value) body.style.setProperty(property, value, priority);
          else body.style.removeProperty(property);
        }
        const restore = () => {
          // Never overwrite a new route's scroll reset or a newly opened modal.
          if (locks === 0 && window.location.href === href)
            window.scrollTo({ left, top, behavior: "instant" });
        };
        restore();
        requestAnimationFrame(restore);
        const viewport = window.visualViewport;
        if (viewport && viewport.height < window.innerHeight - 80) {
          // Safari may finish dismissing the keyboard after the modal unmounts.
          const stop = () => {
            viewport.removeEventListener("resize", restore);
            window.removeEventListener("pointerdown", stop);
          };
          viewport.addEventListener("resize", restore);
          window.addEventListener("pointerdown", stop, { once: true });
          window.setTimeout(stop, 500);
        }
      };
    }
    return () => {
      if (--locks === 0) {
        unlock?.();
        unlock = undefined;
      }
    };
  }, [locked]);
}
