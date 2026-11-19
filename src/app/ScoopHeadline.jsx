"use client";

import { useEffect, useRef } from "react";
import styles from "./ScoopHeadline.module.css";

export default function ScoopHeadline() {
  const stage = useRef(null);

  useEffect(() => {
    const element = stage.current;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || !window.IntersectionObserver) return;

    let active = true;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      try {
        await Promise.all(Array.from(element.querySelectorAll("img"), image => image.decode()));
        if (active) element.dataset.phase = "playing";
      } catch {
        finish();
      }
    }, { threshold: 0.65 });

    function finish() {
      active = false;
      observer.disconnect();
      delete element.dataset.phase;
    }

    element.dataset.phase = "waiting";
    observer.observe(element);
    // Only the last spoon's arrival completes the two-line sequence.
    const lastSpoon = element.lastElementChild.querySelector("[data-last-pass]");
    lastSpoon.addEventListener("animationend", finishLast);
    function finishLast(event) {
      if (event.target === lastSpoon) finish();
    }
    motion.addEventListener("change", finish);
    return () => {
      finish();
      lastSpoon.removeEventListener("animationend", finishLast);
      motion.removeEventListener("change", finish);
    };
  }, []);

  return (
    <div ref={stage} className={styles.stage}>
      <h2 id="erdbeer-title" aria-label="Zeit für eine Erdbeerpause.">
        {["Zeit für eine", "Erdbeerpause."].map((text, index) => (
          <span key={text} className={styles.line}>
            <span className={styles.words}>{text}</span>
            <img className={styles.ribbon} src={`/images/berry-ribbon-${index + 1}.webp`} alt="" />
            <span className={styles.tool} aria-hidden="true" data-last-pass={index === 1 ? "" : undefined}>
              <span className={styles.utensil}>
                <img src="/images/berry-spoon.webp" alt="" />
                <img className={styles.ball} src="/images/berry-scoop.webp" alt="" />
              </span>
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
}
