"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

type MenuItem = {
  num: string;
  title: string;
  sub: string;
  href: string;
  tag?: string;
};
type Section = { category: string; items: MenuItem[] };

const BASE_SECTIONS: Section[] = [
  {
    category: "COMMUNITY",
    items: [
      { num: "01", title: "BOARD",         sub: "게시판 & 토론",    href: "/board" },
      { num: "02", title: "GUILDS",        sub: "길드 & 팀",        href: "/guilds" },
      { num: "03", title: "COSMOS",        sub: "익명 우주 편지",   href: "/cosmos", tag: "NEW" },
      { num: "04", title: "ANNOUNCEMENTS", sub: "공지 & 이벤트",   href: "/announcements" },
      { num: "05", title: "MESSENGER",     sub: "쪽지함",           href: "/messenger" },
    ],
  },
  {
    category: "ECONOMY",
    items: [
      { num: "06", title: "MONEYLAB", sub: "포인트 & 코인",   href: "/moneylab", tag: "LIVE" },
      { num: "07", title: "SHOP",     sub: "아이템 & 꾸미기", href: "/moneylab/shop" },
    ],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export default function MenuOverlay({ open, onClose, unread = 0 }: { open: boolean; onClose: () => void; unread?: number }) {
  const [hov, setHov] = useState<string | null>(null);
  const { status } = useSession();
  const authed = status === "authenticated";

  const SECTIONS: Section[] = [
    ...BASE_SECTIONS,
    {
      category: "ACCOUNT",
      items: authed
        ? [{ num: "08", title: "PROFILE", sub: "프로필 설정", href: "/profile" }]
        : [{ num: "08", title: "SIGN IN", sub: "Enter the platform", href: "/auth/login" }],
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed inset-0 z-[85] flex flex-col"
          style={{
            background: "rgba(3, 5, 12, 0.97)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
          }}
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-8 md:px-14 pt-6 pb-0 shrink-0">
            <Link href="/" onClick={onClose} className="flex items-center gap-3 opacity-55 hover:opacity-90 transition-opacity duration-300">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
              </svg>
              <span className="text-white text-[11px] font-light" style={{ letterSpacing: "0.38em" }}>ASTRA</span>
            </Link>

            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/80 text-[11px] font-light transition-colors duration-300 flex items-center gap-2"
              style={{ letterSpacing: "0.32em" }}
            >
              <span>ESC</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* ── Divider ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="mx-8 md:mx-14 mt-6 mb-0 h-px origin-left"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />

          {/* ── Body ────────────────────────────────────────────────── */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: nav items */}
            <motion.div
              className="flex-1 overflow-y-auto px-8 md:px-14 py-10 space-y-12"
              style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" } as React.CSSProperties}
              variants={container}
              initial="hidden"
              animate="show"
            >
              {SECTIONS.map((sec) => (
                <div key={sec.category}>
                  {/* Category label */}
                  <div className="flex items-center gap-4 mb-7">
                    <span
                      className="text-white/22 text-[9px] font-light shrink-0"
                      style={{ letterSpacing: "0.48em" }}
                    >
                      {sec.category}
                    </span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.055)" }} />
                  </div>

                  {/* Grid of items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
                    {sec.items.map((mi) => (
                      <motion.div key={mi.href} variants={item}>
                        <Link
                          href={mi.href}
                          onClick={onClose}
                          className="group block py-4 border-b"
                          style={{ borderColor: hov === mi.href ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)" }}
                          onMouseEnter={() => setHov(mi.href)}
                          onMouseLeave={() => setHov(null)}
                        >
                          {/* Number */}
                          <span
                            className="text-[9px] font-light"
                            style={{ letterSpacing: "0.35em", color: "rgba(80,165,255,0.50)" }}
                          >
                            {mi.num}
                          </span>

                          {/* Title row */}
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-3">
                              <span
                                className="font-light transition-colors duration-300"
                                style={{
                                  fontFamily: "var(--font-display, Georgia, serif)",
                                  fontSize: "clamp(1.55rem, 2.4vw, 2.2rem)",
                                  letterSpacing: "-0.02em",
                                  lineHeight: 1,
                                  color: hov === mi.href ? "rgba(235,245,255,1)" : "rgba(215,232,255,0.85)",
                                }}
                              >
                                {mi.title}
                              </span>
                              {mi.tag && (
                                <span
                                  className="text-[8px] font-light px-1.5 py-[3px]"
                                  style={{
                                    letterSpacing: "0.28em",
                                    color: "rgba(110,231,183,0.78)",
                                    border: "1px solid rgba(110,231,183,0.28)",
                                  }}
                                >
                                  {mi.tag}
                                </span>
                              )}
                              {mi.href === "/messenger" && unread > 0 && (
                                <span
                                  className="text-[8px] font-light px-1.5 py-[3px]"
                                  style={{
                                    letterSpacing: "0.18em",
                                    color: "rgba(255,255,255,0.92)",
                                    background: "rgba(80,165,255,0.88)",
                                    border: "1px solid rgba(80,165,255,0.45)",
                                  }}
                                >
                                  {unread > 99 ? "99+" : unread}
                                </span>
                              )}
                            </div>

                            {/* Arrow */}
                            <motion.svg
                              width="10" height="10" viewBox="0 0 10 10" fill="none"
                              animate={{ x: hov === mi.href ? 3 : 0, opacity: hov === mi.href ? 0.75 : 0.25 }}
                              transition={{ duration: 0.2 }}
                            >
                              <path d="M1 9L9 1M9 1H3M9 1V7" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </motion.svg>
                          </div>

                          {/* Subtitle */}
                          <span
                            className="block mt-1 text-[10px] font-light transition-colors duration-300"
                            style={{
                              letterSpacing: "0.22em",
                              color: hov === mi.href ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.22)",
                            }}
                          >
                            {mi.sub}
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Right: decorative panel (hidden on small screens) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:flex w-64 xl:w-80 border-l flex-col justify-between py-10 px-10"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              {/* Decorative vertical text */}
              <div
                className="writing-mode-vertical text-white/08 font-light select-none"
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  fontSize: "11px",
                  letterSpacing: "0.42em",
                  transform: "rotate(180deg)",
                }}
              >
                ASTRA PLATFORM
              </div>

              {/* Bottom info */}
              <div className="space-y-1">
                <p className="text-white/15 text-[9px] font-light" style={{ letterSpacing: "0.35em" }}>ASTRA</p>
                <p className="text-white/08 text-[9px] font-light" style={{ letterSpacing: "0.25em" }}>v2026.05 · BETA</p>
              </div>
            </motion.div>
          </div>

          {/* ── Bottom bar ─────────────────────────────────────────── */}
          <div
            className="shrink-0 px-8 md:px-14 py-5 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
          >
            <p className="text-white/18 text-[9px] font-light" style={{ letterSpacing: "0.38em" }}>
              ASTRA COMMUNITY PLATFORM
            </p>
            {authed ? (
              <button
                onClick={() => { onClose(); signOut({ callbackUrl: "/auth/login" }); }}
                className="text-white/30 hover:text-white/70 text-[10px] font-light transition-colors duration-300 flex items-center gap-2"
                style={{ letterSpacing: "0.28em" }}
              >
                SIGN OUT
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <Link
                href="/auth/signup"
                onClick={onClose}
                className="text-white/30 hover:text-white/70 text-[10px] font-light transition-colors duration-300 flex items-center gap-2"
                style={{ letterSpacing: "0.28em" }}
              >
                CREATE ACCOUNT
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
