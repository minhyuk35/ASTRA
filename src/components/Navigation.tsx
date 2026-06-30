"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useScroll } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import MenuOverlay from "@/components/MenuOverlay";

export default function Navigation({ onReserve }: { onReserve?: () => void }) {
  const { scrollY } = useScroll();
  const { status }  = useSession();
  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread,   setUnread]   = useState(0);

  useEffect(() => scrollY.on("change", (v) => setScrolled(v > 60)), [scrollY]);

  useEffect(() => {
    if (menuOpen) {
      const y = window.scrollY;
      document.body.dataset.scrollY = String(y);
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
      document.body.style.width = "100%";
    } else {
      const y = parseInt(document.body.dataset.scrollY ?? "0", 10);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, y);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [menuOpen]);

  const fetchUnread = useCallback(() => {
    if (status !== "authenticated") return;
    fetch("/api/messenger/count")
      .then((r) => r.json())
      .then((d) => setUnread(d.unread ?? 0))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="fixed top-0 left-0 right-0 z-40 flex items-center px-8"
        style={{
          paddingTop:    scrolled ? "1.1rem" : "1.6rem",
          paddingBottom: scrolled ? "1.1rem" : "1.2rem",
          backgroundColor: scrolled ? "rgba(5,5,8,0.60)" : "transparent",
          backdropFilter:       scrolled ? "blur(24px) saturate(160%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px) saturate(160%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
          transition: "padding 0.6s ease, background-color 0.6s ease, backdrop-filter 0.6s ease, border-color 0.6s ease",
        }}
      >
        {/* Logo */}
        <div className="flex-1 flex items-center gap-3">
          <AstraIcon />
          <span className="text-white text-xs font-light" style={{ letterSpacing: "0.38em" }}>ASTRA</span>
        </div>

        {/* Dot grid — opens menu */}
        <button
          className="relative opacity-35 hover:opacity-70 transition-opacity duration-500 p-2"
          aria-label="Menu"
          onClick={() => setMenuOpen(true)}
        >
          {/* Pulse ring — white when idle, blue when unread */}
          <span
            className={unread > 0 ? "absolute inset-0 animate-menu-notify" : "absolute inset-0 animate-menu-ping"}
            aria-hidden="true"
          />
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            {[0, 8, 16].map((cx) =>
              [0, 6, 12].map((cy) => (
                <circle key={`${cx}-${cy}`} cx={cx + 1} cy={cy} r="1.2" fill="white" />
              ))
            )}
          </svg>
          {unread > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[8px] font-light min-w-[16px] h-4 px-1"
              style={{ background: "rgba(80,165,255,0.95)", color: "white", letterSpacing: 0 }}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {/* Right side */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {status === "authenticated" && (
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="text-white/35 hover:text-white/75 text-[10px] font-light transition-colors duration-400"
              style={{ letterSpacing: "0.26em" }}
            >
              SIGN OUT
            </button>
          )}

          <Link
            href={onReserve ? "#" : "/profile"}
            onClick={onReserve ? (e) => { e.preventDefault(); onReserve(); } : undefined}
            className="glass relative flex items-center gap-2.5 px-5 py-2.5 rounded-full group"
            style={{ transition: "background-color 0.4s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.09)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <span
              className="text-white/65 text-xs font-light group-hover:text-white/90"
              style={{ letterSpacing: "0.2em", transition: "color 0.4s ease" }}
            >
              PROFILE
            </span>
            <ArrowIcon />
          </Link>
        </div>
      </motion.nav>

      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} unread={unread} />
    </>
  );
}

function AstraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" className="opacity-45">
      <path d="M1 9L9 1M9 1H3M9 1V7" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
