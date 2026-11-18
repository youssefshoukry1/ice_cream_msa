"use client";

import { useEffect, useRef } from "react";

// A coarse velocity field carries the dye. Pressure projection lets a fast
// stroke spread sideways and roll back into the wake as it dissipates.
function makeFluid(canvas, width, height) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cols = canvas.width = Math.min(220, Math.ceil(width / 5));
  const rows = canvas.height = Math.max(8, Math.round(height * cols / width));
  const size = cols * rows;
  const field = () => new Float32Array(size);
  let u = field(), v = field(), nextU = field(), nextV = field();
  let dye = field();
  let nextDye = field();
  const divergence = field();
  let pressure = field(), scratch = field();
  const pixels = ctx.createImageData(cols, rows);
  const pistachio = [171, 205, 126];
  const vanilla = [255, 242, 208];

  function inject(point, dx, dy) {
    const x = point.x / width * cols, y = point.y / height * rows;
    const radius = Math.max(3, cols * 0.035);
    const reach = Math.ceil(2.5 * radius);
    for (let j = Math.max(1, Math.floor(y - reach)); j < Math.min(rows - 1, y + reach); j++) {
      for (let i = Math.max(1, Math.floor(x - reach)); i < Math.min(cols - 1, x + reach); i++) {
        const index = j * cols + i;
        const influence = Math.exp(-((i - x) ** 2 + (j - y) ** 2) / (radius * radius));
        u[index] += dx * cols / width * influence * 0.29;
        v[index] += dy * rows / height * influence * 0.29;
        dye[index] += (1 - dye[index]) * influence * 0.8;
      }
    }
  }

  function step(dt) {
    const fade = 0.95 ** dt, drag = 0.92 ** dt;
    for (let j = 1; j < rows - 1; j++) {
      for (let i = j * cols + 1; i < (j + 1) * cols - 1; i++) {
        divergence[i] = (u[i + 1] - u[i - 1] + v[i + cols] - v[i - cols]) * 0.5;
        pressure[i] *= 0.81;
      }
    }
    for (let pass = 0; pass < 8; pass++) {
      for (let j = 1; j < rows - 1; j++) {
        for (let i = j * cols + 1; i < (j + 1) * cols - 1; i++) {
          scratch[i] = (pressure[i - 1] + pressure[i + 1] + pressure[i - cols] + pressure[i + cols] - divergence[i]) / 4;
        }
      }
      [scratch, pressure] = [pressure, scratch];
    }
    for (let j = 1; j < rows - 1; j++) {
      for (let i = j * cols + 1; i < (j + 1) * cols - 1; i++) {
        u[i] -= (pressure[i + 1] - pressure[i - 1]) * 0.5;
        v[i] -= (pressure[i + cols] - pressure[i - cols]) * 0.5;
      }
    }
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = y * cols + x;
        const sx = Math.max(0, Math.min(cols - 1.01, x - u[i] * dt));
        const sy = Math.max(0, Math.min(rows - 1.01, y - v[i] * dt));
        const left = Math.floor(sx), top = Math.floor(sy);
        const k = top * cols + left, fx = sx - left, fy = sy - top;
        const sample = a => (a[k] * (1-fx) + a[k+1] * fx) * (1-fy)
          + (a[k+cols] * (1-fx) + a[k+cols+1] * fx) * fy;
        nextU[i] = sample(u) * drag;
        nextV[i] = sample(v) * drag;
        const density = sample(dye) * fade;
        nextDye[i] = density;
        for (let c = 0; c < 3; c++) {
          pixels.data[i * 4 + c] = vanilla[c] + (pistachio[c] - vanilla[c]) * density;
        }
        pixels.data[i * 4 + 3] = 128 * density;
      }
    }
    [u,nextU] = [nextU,u]; [v,nextV] = [nextV,v]; [dye,nextDye] = [nextDye,dye];
    ctx.putImageData(pixels, 0, 0);
  }
  return { inject, step };
}

export default function HeroHover() {
  const layer = useRef(null);
  useEffect(() => {
    const overlay = layer.current;
    const hero = document.querySelector(".hero");
    const header = document.querySelector("header");
    const canvas = overlay.querySelector("canvas");
    const sprite = overlay.querySelector("img");
    const media = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let fluid, frame = 0, target, follower, previous, lastMove = 0, lastFrame = 0;

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      target = follower = previous = null;
      overlay.hidden = true;
      canvas.width = canvas.width;
      fluid = null;
    }
    function resize() {
      reset();
      overlay.style.height = (hero.getBoundingClientRect().bottom + window.scrollY) + "px";
    }
    function draw(time) {
      frame = 0;
      const dt = Math.min(3, Math.max(0.1, (time - lastFrame) / 16.67));
      lastFrame = time;
      if (previous && (previous.x !== target.x || previous.y !== target.y)) {
        fluid.inject(target, target.x - previous.x, target.y - previous.y);
      }
      previous = target;
      const ease = 1 - Math.exp(-dt / 4);
      follower.x += (target.x - follower.x) * ease;
      follower.y += (target.y - follower.y) * ease;
      sprite.style.transform = `translate3d(${follower.x}px,${follower.y}px,0) translate(-50%,-50%)`;
      fluid.step(dt);
      if (time - lastMove < 2200) frame = requestAnimationFrame(draw);
    }
    function move(e) {
      if (!media.matches || e.pointerType === "touch" || document.querySelector("dialog[open]")) return resetIfVisible();
      const x = e.clientX, y = e.clientY + window.scrollY;
      const height = parseFloat(overlay.style.height);
      if (y < 0 || y >= height) return resetIfVisible();
      overlay.hidden = false;
      target = { x, y };
      lastMove = performance.now();
      if (!fluid) {
        fluid = makeFluid(canvas, overlay.clientWidth, height);
        if (!fluid) return reset();
        sprite.src ||= "/images/pistachio-spoon.webp";
        follower = { ...target };
        fluid.inject(target, 0, 0);
      }
      if (!frame) { lastFrame = lastMove; frame = requestAnimationFrame(draw); }
    }
    function resetIfVisible() { if (!overlay.hidden) reset(); }
    function leave(e) { if (!e.relatedTarget) resetIfVisible(); }
    const observer = new ResizeObserver(resize);
    observer.observe(hero);
    observer.observe(header);
    resize();
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", leave);
    window.addEventListener("scroll", resetIfVisible, { passive: true });
    window.addEventListener("blur", resetIfVisible);
    media.addEventListener("change", reset);
    return () => {
      observer.disconnect();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      window.removeEventListener("scroll", resetIfVisible);
      window.removeEventListener("blur", resetIfVisible);
      media.removeEventListener("change", reset);
      reset();
    };
  }, []);
  return <div ref={layer} className="hero-hover" hidden aria-hidden="true"><canvas/><img alt=""/></div>;
}
