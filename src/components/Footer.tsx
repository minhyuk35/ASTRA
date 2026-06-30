"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/cosmos") return null;

  return (
    <footer className="relative px-8 lg:px-24 py-12">
      <div className="absolute top-0 left-8 lg:left-24 right-8 lg:right-24 h-[1px] bg-white/5" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 opacity-40">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5L14.5 14H1.5L8 1.5Z"
              stroke="white"
              strokeWidth="1"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span
            className="text-white text-xs font-light"
            style={{ letterSpacing: "0.38em" }}
          >
            ASTRA
          </span>
        </div>

        {/* Tagline */}
        <p
          className="text-white/20 text-xs font-light text-center"
          style={{ letterSpacing: "0.12em", fontFamily: "var(--font-korean)" }}
        >
          별을 올려다보는 사람들을 위해.
        </p>

        {/* Legal */}
        <p
          className="text-white/15 text-[10px] font-light"
          style={{ letterSpacing: "0.1em" }}
        >
          © 2026 ASTRA. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
