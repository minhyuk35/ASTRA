"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import AstraLoading from "@/components/AstraLoading";

type Ann = {
  id: string; category: "NOTICE" | "EVENT" | "UPDATE";
  title: string; summary: string; createdAt: string; pinned: boolean;
};

const CAT_COLORS: Record<Ann["category"], string> = {
  NOTICE: "rgba(251,191,36,0.72)",
  EVENT:  "rgba(110,231,183,0.72)",
  UPDATE: "rgba(80,165,255,0.72)",
};

const FILTERS = ["ALL", "NOTICE", "EVENT", "UPDATE"] as const;
const stagger = { show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } };

const CACHE_KEY = "astra_anns_v1";
const CACHE_TTL = 60_000;

export default function AnnouncementsPage() {
  const [filter,  setFilter]  = useState<typeof FILTERS[number]>("ALL");
  const [all,     setAll]     = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // show cached data instantly, then refresh in background
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: Ann[]; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          setAll(data);
          setLoading(false);
          // still refresh silently
          fetch("/api/announcements")
            .then((r) => r.json())
            .then((d) => {
              if (!Array.isArray(d)) return;
              setAll(d);
              sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: d, ts: Date.now() }));
            }).catch(() => {});
          return;
        }
      }
    } catch {}
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setAll(list);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: list, ts: Date.now() })); } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  const anns   = filter === "ALL" ? all : all.filter((a) => a.category === filter);
  const pinned = anns.filter((a) => a.pinned);
  const rest   = anns.filter((a) => !a.pinned);

  return (
    <div className="min-h-screen px-8 md:px-14 py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-14">
        <p className="text-white/25 text-[10px] font-light mb-3" style={{ letterSpacing: "0.45em" }}>03 — ANNOUNCEMENTS</p>
        <h1 className="text-white font-light leading-none"
          style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2.4rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}>
          Transmissions<br />from command.
        </h1>
        <div className="mt-8 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </motion.div>

      <div className="flex gap-1 mb-10">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-[10px] font-light transition-all duration-200"
            style={{ letterSpacing: "0.3em",
              color: filter === f ? "rgba(210,235,255,0.95)" : "rgba(255,255,255,0.28)",
              borderBottom: `1px solid ${filter === f ? "rgba(80,165,255,0.55)" : "transparent"}` }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <AstraLoading fullScreen={false} />
      ) : anns.length === 0 ? (
        <p className="text-white/25 text-sm font-light" style={{ letterSpacing: "0.08em" }}>공지사항이 없어요.</p>
      ) : (
        <>
          {pinned.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
              <p className="text-white/18 text-[9px] font-light mb-4" style={{ letterSpacing: "0.42em" }}>PINNED</p>
              {pinned.map((a) => <AnnRow key={a.id} a={a} />)}
            </motion.div>
          )}
          {rest.length > 0 && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="mt-6">
              {pinned.length > 0 && <p className="text-white/18 text-[9px] font-light mb-4" style={{ letterSpacing: "0.42em" }}>ALL</p>}
              {rest.map((a) => (
                <motion.div key={a.id} variants={fadeUp}><AnnRow a={a} /></motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

function AnnRow({ a }: { a: Ann }) {
  return (
    <Link href={`/announcements/${a.id}`} className="group block">
      <div className="flex items-start gap-4 py-5 transition-all duration-300"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        onMouseEnter={(e) => { e.currentTarget.style.paddingLeft = "10px"; e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.10)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.paddingLeft = "0"; e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.05)"; }}>
        <span className="shrink-0 text-[8px] font-light px-2 py-1 mt-0.5"
          style={{ letterSpacing: "0.28em", color: CAT_COLORS[a.category], border: `1px solid ${CAT_COLORS[a.category].replace("0.72", "0.22")}` }}>
          {a.category}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white/85 font-light group-hover:text-white transition-colors truncate"
            style={{ fontSize: "1.02rem", letterSpacing: "-0.01em" }}>{a.title}</p>
          <p className="text-white/28 text-xs font-light mt-1 truncate" style={{ letterSpacing: "0.03em" }}>{a.summary}</p>
        </div>
        <span className="shrink-0 text-white/18 text-[9px] font-light mt-1" style={{ letterSpacing: "0.15em" }}>
          {a.createdAt.slice(0, 10)}
        </span>
      </div>
    </Link>
  );
}
