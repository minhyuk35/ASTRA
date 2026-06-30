"use client";
import { useState, useEffect, useRef } from "react";

export function useMouseParallax() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const pending = useRef<{ x: number; y: number } | null>(null);
  const raf     = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pending.current = {
        x:  (e.clientX / window.innerWidth  - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
      // Throttle state updates to one per animation frame
      if (raf.current === undefined) {
        raf.current = requestAnimationFrame(() => {
          if (pending.current) setMouse(pending.current);
          raf.current = undefined;
        });
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, []);

  return mouse;
}
