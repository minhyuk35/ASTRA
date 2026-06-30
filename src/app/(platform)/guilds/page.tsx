"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import AstraLoading from "@/components/AstraLoading";

type Guild = {
  id: string; slug: string; name: string; description: string | null;
  level: number; xp: number; xpMax: number; capacity: number;
  bannerColor: string; memberCount: number;
};
type MyGuild = Guild & { myRole: string };

function LevelBar({ level }: { level: number }) {
  const pct = Math.min((level / 20) * 100, 100);
  return (
    <div className="h-px mt-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "rgba(80,165,255,0.55)" }} />
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = { LEADER: "길드장", SUBLEADER: "부길드장", MEMBER: "멤버" };
const ROLE_COLOR: Record<string, string> = {
  LEADER:    "rgba(251,191,36,0.80)",
  SUBLEADER: "rgba(80,165,255,0.80)",
  MEMBER:    "rgba(255,255,255,0.40)",
};

const stagger = { show: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const CACHE_KEY = "astra_guilds_v1";
const CACHE_TTL = 30_000;

export default function GuildsPage() {
  const [guilds,  setGuilds]  = useState<Guild[]>([]);
  const [myGuild, setMyGuild] = useState<MyGuild | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applyData = (data: { guilds?: Guild[]; myGuild?: MyGuild | null }) => {
      setGuilds(Array.isArray(data.guilds) ? data.guilds : []);
      setMyGuild(data.myGuild ?? null);
    };
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: { guilds: Guild[]; myGuild: MyGuild | null }; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          applyData(data); setLoading(false);
          fetch("/api/guilds").then((r) => r.json()).then((d) => {
            applyData(d);
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
          }).catch(() => {});
          return;
        }
      }
    } catch {}
    fetch("/api/guilds")
      .then((r) => r.json())
      .then((data) => {
        applyData(data);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-8 md:px-14 py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-14"
      >
        <p className="text-white/25 text-[10px] font-light mb-3" style={{ letterSpacing: "0.45em" }}>02 — GUILDS</p>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1 className="text-white font-light leading-none"
            style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2.4rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}>
            Constellations<br />in the void.
          </h1>
          {!myGuild && (
            <Link href="/guilds/create"
              className="flex items-center gap-2 px-5 py-2.5 text-white/60 hover:text-white/90 text-xs font-light transition-colors duration-300"
              style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.12)" }}>
              + CREATE
            </Link>
          )}
        </div>
        <div className="mt-8 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </motion.div>

      {/* My Guild */}
      {myGuild && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mb-12">
          <p className="text-white/18 text-[9px] font-light mb-4" style={{ letterSpacing: "0.45em" }}>MY GUILD</p>
          <Link href={`/guilds/${myGuild.slug}`} className="block">
            <div className="relative overflow-hidden p-6 transition-all duration-300"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.018)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.032)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.018)"; }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: myGuild.bannerColor }} />
              <div className="flex items-start justify-between mb-3">
                <span className="text-[9px] font-light px-2 py-0.5"
                  style={{ letterSpacing: "0.28em", color: ROLE_COLOR[myGuild.myRole], border: `1px solid ${ROLE_COLOR[myGuild.myRole].replace("0.80", "0.22")}` }}>
                  {ROLE_LABEL[myGuild.myRole] ?? myGuild.myRole}
                </span>
                <span className="text-[9px] font-light px-2 py-0.5"
                  style={{ letterSpacing: "0.28em", color: "rgba(80,165,255,0.70)", border: "1px solid rgba(80,165,255,0.20)" }}>
                  LV.{myGuild.level}
                </span>
              </div>
              <h2 className="text-white font-light mb-1"
                style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.8rem", letterSpacing: "-0.01em" }}>
                {myGuild.name}
              </h2>
              <p className="text-white/30 text-xs font-light mb-4">{myGuild.description ?? "—"}</p>
              <LevelBar level={myGuild.level} />
              <div className="flex items-center gap-5 mt-4 text-white/22 text-[9px] font-light" style={{ letterSpacing: "0.22em" }}>
                <span>{myGuild.memberCount} / {myGuild.capacity} members</span>
                <span className="ml-auto">{myGuild.xp.toLocaleString()} XP</span>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-white/18 text-[9px] font-light mb-6" style={{ letterSpacing: "0.45em" }}>
        TOP GUILDS BY LEVEL
      </motion.p>

      {loading ? (
        <AstraLoading fullScreen={false} />
      ) : guilds.length === 0 ? (
        <p className="text-white/25 text-sm font-light" style={{ letterSpacing: "0.08em" }}>
          아직 길드가 없어요. 첫 번째 길드를 만들어보세요.
        </p>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px"
          variants={stagger} initial="hidden" animate="show"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          {guilds.map((guild, i) => (
            <motion.div key={guild.id} variants={fadeUp}>
              <Link href={`/guilds/${guild.slug}`} className="group block h-full">
                <div className="h-full p-6 transition-all duration-300 relative overflow-hidden"
                  style={{ background: "#050508" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#050508"; }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: guild.bannerColor }} />
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-white/18 text-[10px] font-light" style={{ letterSpacing: "0.38em" }}>
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] font-light px-2 py-0.5"
                      style={{ letterSpacing: "0.28em", color: "rgba(80,165,255,0.70)", border: "1px solid rgba(80,165,255,0.20)" }}>
                      LV.{guild.level}
                    </span>
                  </div>
                  <h2 className="text-white font-light mb-1"
                    style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.5rem", letterSpacing: "-0.01em" }}>
                    {guild.name}
                  </h2>
                  <p className="text-white/30 text-xs font-light mb-4" style={{ letterSpacing: "0.08em" }}>
                    {guild.description ?? "—"}
                  </p>
                  <LevelBar level={guild.level} />
                  <div className="flex items-center gap-5 mt-4 text-white/22 text-[9px] font-light" style={{ letterSpacing: "0.22em" }}>
                    <span>{guild.memberCount} / {guild.capacity} members</span>
                    <span className="ml-auto">{guild.xp.toLocaleString()} XP</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
