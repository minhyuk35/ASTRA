"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  alphaDir: number;
}

function make(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.22,
    vy: Math.random() * -0.18 - 0.04, // slow upward drift
    size: Math.random() * 1.1 + 0.25,
    alpha: Math.random() * 0.18 + 0.04,
    alphaDir: Math.random() < 0.5 ? 1 : -1,
  };
}

export default function ParticleOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = Array.from({ length: 55 }, () => make(canvas.width, canvas.height));
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Alpha breathe
        p.alpha += p.alphaDir * 0.0015;
        if (p.alpha > 0.22) { p.alpha = 0.22; p.alphaDir = -1; }
        if (p.alpha < 0.03) { p.alpha = 0.03; p.alphaDir =  1; }

        // Wrap edges
        if (p.x < -2)               p.x = canvas.width  + 2;
        if (p.x > canvas.width  + 2) p.x = -2;
        if (p.y < -2)               p.y = canvas.height + 2;
        if (p.y > canvas.height + 2) p.y = -2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 215, 255, ${p.alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
      aria-hidden="true"
    />
  );
}
