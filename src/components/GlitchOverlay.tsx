"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ─── Types ───────────────────────────────────────────────────────
type Kind = "dark" | "blue" | "border" | "rgb";

interface Block {
  x: number; y: number;
  w: number; h: number;
  life: number; maxLife: number;
  kind: Kind;
  dx: number;       // horizontal displacement
  flicker: number;  // probability per frame to skip (0 = stable)
}

// ─── Constants ───────────────────────────────────────────────────
const ZONE      = 200; // px radius around cursor
const GRID      = 2;   // snap all coords to 2-px grid → "system" pixel feel
const MAX_BLOCKS = 90;

// Snap value to nearest N
const snap = (v: number, n = GRID) => Math.round(v / n) * n;

// ─── Block factory ───────────────────────────────────────────────
function spawnBlock(mx: number, my: number): Block {
  const angle = Math.random() * Math.PI * 2;
  const r     = Math.random() * ZONE;

  const px = snap(mx + Math.cos(angle) * r);
  const py = snap(my + Math.sin(angle) * r);

  const t = Math.random();
  const kind: Kind =
    t < 0.36 ? "dark" :
    t < 0.60 ? "blue" :
    t < 0.80 ? "border" : "rgb";

  // Slices = wide + very thin  |  Blocks = more square
  const isSlice = kind !== "rgb" && Math.random() < 0.55;
  const w = snap(isSlice
    ? Math.random() * 88 + 12    // 12–100 px wide
    : Math.random() * 22 +  6);  // 6–28  px wide
  const h = snap(isSlice
    ? Math.random() *  4 +  1    // 1–5 px tall (thin slice)
    : Math.random() * 18 +  4);  // 4–22 px tall (block)

  const maxLife = Math.floor(Math.random() * 13 + 4);

  return {
    x: px, y: py, w, h,
    life: maxLife, maxLife,
    kind,
    dx: snap((Math.random() - 0.5) * 6),   // snapped displacement
    flicker: kind === "rgb"    ? 0.50 :     // RGB tears flicker most
             kind === "dark"   ? 0.20 :     // dark blocks sometimes blink
             kind === "border" ? 0.06 : 0.08,
  };
}

// ─── Component ───────────────────────────────────────────────────
export default function GlitchOverlay() {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    let raf: number;
    const mouse = { x: -999, y: -999 };
    const prev  = { x: -999, y: -999 };
    let speed   = 0;
    const blocks: Block[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const onMove = (e: MouseEvent) => {
      speed  = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
      prev.x = mouse.x = e.clientX;
      prev.y = mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Spawn ──────────────────────────────────────────
      const n = Math.floor(speed * 0.32) + (Math.random() < 0.15 ? 1 : 0);
      for (let i = 0; i < n && blocks.length < MAX_BLOCKS; i++) {
        blocks.push(spawnBlock(mouse.x, mouse.y));
      }
      speed *= 0.82; // velocity decay

      // ── Draw + age ─────────────────────────────────────
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        b.life--;
        if (b.life <= 0) { blocks.splice(i, 1); continue; }

        // Skip this frame (flicker)
        if (Math.random() < b.flicker) continue;

        // Fade envelope: fast in, gradual out
        const t    = b.life / b.maxLife; // 1→0
        const fade = Math.min(1, t * 2.5);

        const bx = b.x + b.dx;
        const by = b.y;

        switch (b.kind) {

          // Dark corruption block — digital dead pixels
          case "dark":
            ctx.fillStyle = `rgba(3, 5, 14, ${0.78 * fade})`;
            ctx.fillRect(bx, by, b.w, b.h);
            // Occasional bright top-edge scanline
            if (Math.random() < 0.25) {
              ctx.fillStyle = `rgba(80, 160, 255, ${0.35 * fade})`;
              ctx.fillRect(bx, by, b.w, 1);
            }
            break;

          // Blue system glow block
          case "blue":
            ctx.fillStyle = `rgba(40, 130, 255, ${0.14 * fade})`;
            ctx.fillRect(bx, by, b.w, b.h);
            // Sharp bright top edge — looks like an active system rect
            ctx.fillStyle = `rgba(140, 210, 255, ${0.60 * fade})`;
            ctx.fillRect(bx, by, b.w, 1);
            // Right-edge line occasionally
            if (Math.random() < 0.4) {
              ctx.fillStyle = `rgba(100, 180, 255, ${0.35 * fade})`;
              ctx.fillRect(bx + b.w - 1, by, 1, b.h);
            }
            break;

          // Wireframe / circuit border
          case "border":
            ctx.strokeStyle = `rgba(80, 170, 255, ${0.50 * fade})`;
            ctx.lineWidth   = 0.5;
            ctx.strokeRect(bx + 0.5, by + 0.5, b.w - 1, b.h - 1);
            // Corner dots
            if (b.w > 14 && b.h > 8) {
              ctx.fillStyle = `rgba(140, 220, 255, ${0.70 * fade})`;
              ctx.fillRect(bx, by, 2, 2);
              ctx.fillRect(bx + b.w - 2, by, 2, 2);
            }
            break;

          // RGB chromatic aberration tear
          case "rgb":
            // Red channel — offset left
            ctx.fillStyle = `rgba(255, 50, 80,  ${0.30 * fade})`;
            ctx.fillRect(bx - 3, by, b.w, b.h);
            // Blue channel — offset right
            ctx.fillStyle = `rgba(50, 110, 255, ${0.30 * fade})`;
            ctx.fillRect(bx + 3, by, b.w, b.h);
            // Green centre (faint)
            ctx.fillStyle = `rgba(80, 255, 180, ${0.10 * fade})`;
            ctx.fillRect(bx,     by, b.w, b.h);
            break;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 20 }}
      aria-hidden="true"
    />
  );
}
