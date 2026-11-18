import { useEffect } from "react";

const entrances = {
  fade: { opacity: 0 },
  rise: { opacity: 0, transform: "translateY(14px)" },
  photo: { opacity: 0, transform: "scale(.98)" },
};

export function useScrollReveals(main) {
  useEffect(() => {
    const root = main.current;
    if (!root || !window.IntersectionObserver || !Element.prototype.animate) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const running = new Map();
    const visited = new WeakSet();

    function animate(element, style, delay = 0) {
      if (element.contains(document.activeElement)) return;
      const animation = element.animate([entrances[style], { opacity: 1, transform: "none" }], {
        duration: style === "photo" ? 540 : 420,
        easing: "cubic-bezier(.2,.7,.25,1)",
        delay,
        fill: "backwards",
      });
      running.set(element, animation);
      animation.onfinish = () => running.delete(element);
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || preference.matches) continue;
        const element = entry.target;
        observer.unobserve(element);
        visited.add(element);
        if (element.dataset.reveal === "cards") {
          Array.from(element.children).forEach((card, index) => animate(card, "rise", index * 55));
        } else {
          animate(element, element.dataset.reveal);
        }
      }
    });
    function configure() {
      observer.disconnect();
      for (const animation of running.values()) animation.cancel();
      running.clear();
      if (preference.matches) return;
      for (const element of root.querySelectorAll("[data-reveal]")) {
        if (visited.has(element)) continue;
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) visited.add(element);
        else observer.observe(element);
      }
    }
    function revealFocused(event) {
      for (const [element, animation] of running) {
        if (element.contains(event.target)) animation.finish();
      }
    }
    configure();
    root.addEventListener("focusin", revealFocused);
    preference.addEventListener("change", configure);
    return () => {
      observer.disconnect();
      for (const animation of running.values()) animation.cancel();
      root.removeEventListener("focusin", revealFocused);
      preference.removeEventListener("change", configure);
    };
  }, [main]);
}
