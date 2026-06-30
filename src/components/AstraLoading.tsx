"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

function Stars() {
  const stars = useMemo(() => Array.from({ length: 55 }, (_, i) => ({
    x: Math.abs(Math.sin(i * 127.1 + 17.3) * 43758.5453) % 100,
    y: Math.abs(Math.sin(i * 311.7 + 53.1) * 43758.5453) % 100,
    size: Math.abs(Math.sin(i * 4.9)) * 0.7 + 0.2,
    opacity: Math.abs(Math.sin(i * 6.3)) * 0.25 + 0.04,
  })), []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: "50%",
          background: `rgba(190,215,255,${s.opacity})`,
        }} />
      ))}
    </div>
  );
}

export default function AstraLoading({ fullScreen = true }: { fullScreen?: boolean }) {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      ...(fullScreen ? { minHeight: "100vh", background: "#050508" } : { height: 260 }),
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      {fullScreen && <Stars />}

      {/* Concentric spinning rings */}
      <div style={{ position: "relative", width: 80, height: 80, marginBottom: 28, zIndex: 1 }}>
        {/* Outer ring */}
        <motion.div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "1px solid rgba(80,165,255,0.18)",
          }}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 9, ease: "linear", repeat: Infinity }}
        >
          <div style={{
            position: "absolute", top: -2.5, left: "calc(50% - 2.5px)",
            width: 5, height: 5, borderRadius: "50%",
            background: "rgba(80,165,255,0.75)",
            boxShadow: "0 0 8px rgba(80,165,255,0.65)",
          }} />
        </motion.div>

        {/* Middle ring */}
        <motion.div
          style={{
            position: "absolute", inset: 12, borderRadius: "50%",
            border: "1px solid rgba(80,165,255,0.28)",
          }}
          initial={{ rotate: 0 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 5, ease: "linear", repeat: Infinity }}
        >
          <div style={{
            position: "absolute", top: -2, left: "calc(50% - 2px)",
            width: 4, height: 4, borderRadius: "50%",
            background: "rgba(110,200,255,0.90)",
            boxShadow: "0 0 6px rgba(80,165,255,0.80)",
          }} />
        </motion.div>

        {/* Inner ring */}
        <motion.div
          style={{
            position: "absolute", inset: 24, borderRadius: "50%",
            border: "1px solid rgba(80,165,255,0.18)",
          }}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, ease: "linear", repeat: Infinity }}
        >
          <div style={{
            position: "absolute", top: -1.5, left: "calc(50% - 1.5px)",
            width: 3, height: 3, borderRadius: "50%",
            background: "rgba(160,220,255,0.95)",
            boxShadow: "0 0 4px rgba(80,165,255,0.85)",
          }} />
        </motion.div>

        {/* Core pulse */}
        <motion.div
          style={{
            position: "absolute", inset: 34, borderRadius: "50%",
            background: "rgba(80,165,255,0.08)",
          }}
          animate={{
            boxShadow: [
              "0 0 10px rgba(80,165,255,0.18)",
              "0 0 28px rgba(80,165,255,0.45)",
              "0 0 10px rgba(80,165,255,0.18)",
            ],
          }}
          transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
        />
      </div>

      {/* ASTRA triangle mark */}
      <div style={{ marginBottom: 18, opacity: 0.18, zIndex: 1 }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      </div>

      {/* LOADING with animated dots */}
      <p style={{
        zIndex: 1, margin: 0,
        fontSize: 10, fontWeight: 300,
        letterSpacing: "0.38em",
        fontFamily: "var(--font-body, sans-serif)",
        color: "rgba(255,255,255,0.22)",
        display: "flex", alignItems: "baseline",
      }}>
        <span>LOADING</span>
        <span style={{ display: "inline-block", width: "1.6em", textAlign: "left" }}>
          {"·".repeat(dots)}
        </span>
      </p>
    </div>
  );
}
