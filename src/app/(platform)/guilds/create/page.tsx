"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

const BANNER_PRESETS = ["#0d1528","#1a3a5c","#2a1a3a","#1a3a2a","#2a2a1a","#3a1a1a","#1a2a3a"];
const COST = 1000;

export default function CreateGuildPage() {
  const router              = useRouter();
  const { status }          = useSession();
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [bannerColor, setBannerColor] = useState("#0d1528");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [myPoints,    setMyPoints]    = useState<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/discord-points")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setMyPoints(d.sitePoints ?? 0); })
      .catch(() => {});
  }, [status]);

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const canAfford   = myPoints !== null && myPoints >= COST;
  const pointsKnown = myPoints !== null;

  const inputStyle = {
    border: "1px solid rgba(255,255,255,0.09)",
    background: "transparent",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: "0.03em",
    outline: "none",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/guilds", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, description, bannerColor }),
    });
    if (res.ok) {
      const g = await res.json();
      router.push(`/guilds/${g.slug}`);
    } else {
      const d = await res.json();
      setError(d.error ?? "오류가 발생했어요.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-8 md:px-14 py-14 max-w-xl">
      <div className="flex items-center gap-2 text-white/22 text-[10px] font-light mb-10" style={{ letterSpacing: "0.3em" }}>
        <Link href="/guilds" className="hover:text-white/50 transition-colors">GUILDS</Link>
        <span>/</span>
        <span className="text-white/45">CREATE</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="text-white font-light mb-3"
          style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.02em" }}>
          Found a constellation.
        </h1>
        <p className="text-white/28 text-sm font-light mb-10" style={{ letterSpacing: "0.04em" }}>
          당신만의 길드를 창설하세요.
        </p>

        {/* Cost notice */}
        <div className="mb-8 px-5 py-4 flex items-center justify-between"
          style={{ border: `1px solid ${canAfford || !pointsKnown ? "rgba(80,165,255,0.18)" : "rgba(255,100,100,0.20)"}`, background: `${canAfford || !pointsKnown ? "rgba(80,165,255,0.04)" : "rgba(255,100,100,0.04)"}` }}>
          <div>
            <p className="text-white/22 text-[9px] font-light mb-1" style={{ letterSpacing: "0.36em" }}>창설 비용</p>
            <p className="text-white font-light" style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.4rem", letterSpacing: "-0.01em" }}>
              1,000 pts
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/22 text-[9px] font-light mb-1" style={{ letterSpacing: "0.36em" }}>보유 포인트</p>
            <p className="font-light"
              style={{
                fontFamily: "var(--font-display, Georgia, serif)",
                fontSize: "1.4rem",
                letterSpacing: "-0.01em",
                color: !pointsKnown ? "rgba(255,255,255,0.40)" : canAfford ? "rgba(110,231,183,0.90)" : "rgba(252,165,165,0.90)",
              }}>
              {myPoints !== null ? myPoints.toLocaleString() : "—"}
            </p>
          </div>
        </div>

        {!canAfford && pointsKnown && (
          <p className="text-[9px] font-light mb-6" style={{ letterSpacing: "0.22em", color: "rgba(252,165,165,0.75)" }}>
            포인트가 부족합니다. MoneyLab에서 포인트를 획득하세요.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-white/22 text-[9px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>GUILD NAME *</p>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="예) NOVA" maxLength={30}
              className="w-full text-sm font-light px-4 py-3" style={inputStyle} />
          </div>

          <div>
            <p className="text-white/22 text-[9px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>DESCRIPTION</p>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="길드를 한 줄로 소개하세요" maxLength={80}
              className="w-full text-sm font-light px-4 py-3" style={inputStyle} />
          </div>

          <div>
            <p className="text-white/22 text-[9px] font-light mb-3" style={{ letterSpacing: "0.38em" }}>BANNER COLOR</p>
            <div className="flex items-center gap-3 flex-wrap">
              {BANNER_PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => setBannerColor(c)}
                  className="w-8 h-8 rounded-full transition-all duration-200"
                  style={{ background: c, boxShadow: bannerColor === c ? "0 0 0 2px rgba(255,255,255,0.55)" : "none" }} />
              ))}
              <input type="color" value={bannerColor} onChange={(e) => setBannerColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-none bg-transparent" />
            </div>
            <div className="mt-3 h-0.5 rounded-full" style={{ background: bannerColor, opacity: 0.6 }} />
          </div>

          {error && (
            <p className="text-[9px] font-light" style={{ letterSpacing: "0.22em", color: "rgba(255,100,100,0.75)" }}>{error}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link href="/guilds" className="text-white/25 hover:text-white/55 text-[10px] font-light transition-colors"
              style={{ letterSpacing: "0.28em" }}>← CANCEL</Link>
            <button type="submit" disabled={loading || (pointsKnown && !canAfford)}
              className="px-8 py-3 text-[10px] font-light transition-all duration-300"
              style={{
                letterSpacing: "0.38em",
                color:      canAfford || !pointsKnown ? "rgba(80,165,255,0.90)" : "rgba(255,255,255,0.20)",
                border:    `1px solid ${canAfford || !pointsKnown ? "rgba(80,165,255,0.32)" : "rgba(255,255,255,0.08)"}`,
                background: canAfford || !pointsKnown ? "rgba(80,165,255,0.06)" : "rgba(255,255,255,0.02)",
                opacity:    loading ? 0.5 : 1,
              }}>
              {loading ? "CREATING..." : "CREATE GUILD — 1,000 PTS"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
