"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const RING_R = 72;
const RING_C = 2 * Math.PI * RING_R; // ≈ 452.4

const MESSAGES = [
  "MAPPING STELLAR COORDINATES",
  "CALIBRATING DARK MATTER",
  "INITIALIZING WARP DRIVE",
  "SCANNING DEEP SPACE",
  "SYNCHRONIZING ORBITAL PATHS",
  "PLOTTING TRAJECTORY",
];

export default function LoadingSequence({ onComplete }: { onComplete: () => void }) {
  const overlayRef  = useRef<HTMLDivElement>(null);
  const numberRef   = useRef<HTMLSpanElement>(null);
  const ringRef     = useRef<SVGCircleElement>(null);
  const dotRef      = useRef<SVGCircleElement>(null);
  const dotGlowRef  = useRef<SVGCircleElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);

  const [msgIdx,     setMsgIdx]     = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);

  // Twinkling star canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const stars = Array.from({ length: 220 }, () => ({
      x:          Math.random() * window.innerWidth,
      y:          Math.random() * window.innerHeight,
      r:          Math.random() * 0.75 + 0.15,
      alpha:      Math.random() * 0.45 + 0.05,
      dir:        Math.random() > 0.5 ? 1 : -1,
      speed:      Math.random() * 0.004 + 0.001,
    }));

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.alpha += s.speed * s.dir;
        if (s.alpha > 0.55 || s.alpha < 0.03) s.dir *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 215, 255, ${s.alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Cycling status messages
  useEffect(() => {
    const id = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % MESSAGES.length);
        setMsgVisible(true);
      }, 380);
    }, 1900);
    return () => clearInterval(id);
  }, []);

  // GSAP counter + ring animation
  useEffect(() => {
    const prog = { value: 0 };

    const tl = gsap.timeline({
      delay: 0.25,
      onComplete: () => {
        gsap.to(overlayRef.current, {
          opacity: 0,
          scale: 1.02,
          duration: 1.0,
          ease: "power2.inOut",
          onComplete,
        });
      },
    });

    tl.to(prog, {
      value: 100,
      duration: 3.5,
      ease: "power1.inOut",
      onUpdate: () => {
        const v = prog.value;

        if (numberRef.current) {
          numberRef.current.textContent = Math.round(v).toString();
        }

        if (ringRef.current) {
          const filled = (v / 100) * RING_C;
          ringRef.current.setAttribute("stroke-dasharray", `${filled} ${RING_C}`);
        }

        if (dotRef.current || dotGlowRef.current) {
          const angle = (v / 100) * Math.PI * 2;
          const dx = (100 + Math.cos(angle) * RING_R).toString();
          const dy = (100 + Math.sin(angle) * RING_R).toString();
          dotRef.current?.setAttribute("cx", dx);
          dotRef.current?.setAttribute("cy", dy);
          dotGlowRef.current?.setAttribute("cx", dx);
          dotGlowRef.current?.setAttribute("cy", dy);
        }
      },
    });

    tl.to({}, { duration: 0.45 }); // brief pause at 100%

    return () => { tl.kill(); };
  }, [onComplete]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050508]"
      role="progressbar"
      aria-label="Loading ASTRA"
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Twinkling star canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Radial vignette — pulls eye to center ring */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 22%, rgba(0,0,0,0.78) 100%)" }}
        aria-hidden="true"
      />

      {/* Top logo */}
      <div
        className="absolute top-7 left-1/2 -translate-x-1/2 flex items-center gap-3"
        style={{ opacity: 0.30 }}
        aria-hidden="true"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
        </svg>
        <span className="text-white text-[10px] font-light" style={{ letterSpacing: "0.45em" }}>
          ASTRA
        </span>
      </div>

      {/* Progress ring + number */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          {/* Outer soft glow halo */}
          <circle
            cx="100" cy="100" r={RING_R + 10}
            fill="none"
            stroke="rgba(50, 110, 255, 0.045)"
            strokeWidth="16"
          />
          {/* Track */}
          <circle
            cx="100" cy="100" r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          {/* Progress arc */}
          <circle
            ref={ringRef}
            cx="100" cy="100" r={RING_R}
            fill="none"
            stroke="rgba(130, 195, 255, 0.80)"
            strokeWidth="1.2"
            strokeDasharray={`0 ${RING_C}`}
            strokeLinecap="round"
          />
          {/* Moving dot at arc tip */}
          <circle
            ref={dotRef}
            cx={100 + RING_R}
            cy="100"
            r="2.8"
            fill="rgba(195, 232, 255, 0.95)"
          />
          {/* Dot glow */}
          <circle
            ref={dotGlowRef}
            cx={100 + RING_R}
            cy="100"
            r="6"
            fill="rgba(120, 190, 255, 0.18)"
          />
        </svg>

        {/* Number + label inside ring */}
        <div className="relative flex flex-col items-center select-none">
          <span
            ref={numberRef}
            className="font-display text-white"
            style={{
              fontSize: "3rem",
              fontWeight: 100,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            0
          </span>
          <span
            className="text-white/25 text-[8px] mt-1.5"
            style={{ letterSpacing: "0.5em" }}
          >
            PERCENT
          </span>
        </div>
      </div>

      {/* Status message */}
      <div className="mt-10 h-4 flex items-center justify-center">
        <p
          className="text-white/30 text-[9px] font-light text-center"
          style={{
            letterSpacing: "0.40em",
            opacity: msgVisible ? 1 : 0,
            transition: "opacity 0.38s ease",
          }}
        >
          {MESSAGES[msgIdx]}
        </p>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: "linear-gradient(to right, transparent, rgba(80,150,255,0.14), transparent)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
