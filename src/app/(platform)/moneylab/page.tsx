"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

function generatePriceHistory(points = 60) {
  const history: number[] = [1000];
  for (let i = 1; i < points; i++) {
    const change = (Math.random() - 0.46) * 40;
    history.push(Math.max(200, history[i - 1] + change));
  }
  return history;
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;

    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color.replace("1)", "0.18)"));
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 8) - 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 8) - 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  }, [data, color]);

  return <canvas ref={canvasRef} width={320} height={80} className="w-full" />;
}

const PRICE_DATA    = generatePriceHistory(60);
const CURRENT_PRICE = PRICE_DATA[PRICE_DATA.length - 1];
const PREV_PRICE    = PRICE_DATA[PRICE_DATA.length - 2];
const CHANGE_PCT    = ((CURRENT_PRICE - PREV_PRICE) / PREV_PRICE * 100).toFixed(2);
const IS_UP         = CURRENT_PRICE >= PREV_PRICE;
const CONVERT_RATE  = 100; // 100 Discord = 1 ASTRA

type RankUser = {
  id: string; nickname: string | null; handle: string | null;
  image: string | null; points: number; role: string;
};

export default function MoneyLabPage() {
  const [mode,   setMode]   = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [ranking, setRanking] = useState<RankUser[]>([]);

  const [sitePoints,    setSitePoints]    = useState<number | null>(null);
  const [discordPoints, setDiscordPoints] = useState<number | null>(null);
  const [convertAmt,    setConvertAmt]    = useState("");
  const [converting,    setConverting]    = useState(false);
  const [convertMsg,    setConvertMsg]    = useState("");

  const fetchPoints = useCallback(() => {
    fetch("/api/discord-points")
      .then((r) => r.json())
      .then((d) => { setSitePoints(d.sitePoints ?? 0); setDiscordPoints(d.discordPoints ?? null); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  useEffect(() => {
    const key = "astra_ranking_v1";
    const ttl = 60_000;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: RankUser[]; ts: number };
        if (Date.now() - ts < ttl) {
          setRanking(data);
          fetch("/api/ranking").then((r) => r.ok ? r.json() : []).then((d) => {
            setRanking(d);
            try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
          }).catch(() => {});
          return;
        }
      }
    } catch {}
    fetch("/api/ranking").then((r) => r.ok ? r.json() : []).then((d) => {
      setRanking(d);
      try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
    });
  }, []);

  const convertPreview = convertAmt ? Math.floor(parseInt(convertAmt, 10) / CONVERT_RATE) : null;

  const handleConvert = async () => {
    const n = parseInt(convertAmt, 10);
    if (!n || n < 1) return;
    setConverting(true); setConvertMsg("");
    const res = await fetch("/api/discord-points", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ amount: n }),
    });
    const data = await res.json();
    setConverting(false);
    if (res.ok) {
      setSitePoints(data.sitePoints);
      setDiscordPoints((prev) => (prev !== null ? prev - n : null));
      setConvertAmt("");
      setConvertMsg(`✓ Discord ${n.toLocaleString()} pts → ASTRA ${data.astraReceived} pts 전환 완료`);
    } else {
      setConvertMsg(data.error ?? "오류가 발생했어요.");
    }
    setTimeout(() => setConvertMsg(""), 4000);
  };

  return (
    <div className="min-h-screen px-8 md:px-14 py-14">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-14"
      >
        <div className="flex items-center gap-3 mb-3">
          <p className="text-white/25 text-[10px] font-light" style={{ letterSpacing: "0.45em" }}>05 — MONEYLAB</p>
          <span className="text-[8px] font-light px-2 py-0.5"
            style={{ letterSpacing: "0.28em", color: "rgba(110,231,183,0.75)", border: "1px solid rgba(110,231,183,0.25)" }}>
            LIVE
          </span>
        </div>
        <h1 className="text-white font-light leading-none"
          style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2.4rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}>
          The frequency<br />of the market.
        </h1>
        <div className="mt-8 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </motion.div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>

        {/* SGC Market card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 p-6" style={{ background: "#050508" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/22 text-[9px] font-light mb-1" style={{ letterSpacing: "0.38em" }}>SGC · ASTRA COIN</p>
              <div className="flex items-baseline gap-3">
                <span className="font-light"
                  style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "2.4rem", color: "rgba(225,240,255,0.95)", letterSpacing: "-0.02em" }}>
                  {CURRENT_PRICE.toFixed(0)}
                </span>
                <span className="text-sm font-light"
                  style={{ color: IS_UP ? "rgba(110,231,183,0.85)" : "rgba(252,165,165,0.85)", letterSpacing: "0.08em" }}>
                  {IS_UP ? "▲" : "▼"} {CHANGE_PCT}%
                </span>
              </div>
            </div>
            <Link href="/moneylab/shop" className="text-white/25 hover:text-white/60 text-[10px] font-light transition-colors"
              style={{ letterSpacing: "0.28em" }}>
              SHOP →
            </Link>
          </div>
          <MiniChart data={PRICE_DATA} color={IS_UP ? "rgba(110,231,183,1)" : "rgba(252,165,165,1)"} />
        </motion.div>

        {/* Stats column */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex flex-col gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
          {/* ASTRA POINTS */}
          <div className="p-5" style={{ background: "#050508" }}>
            <p className="text-white/20 text-[9px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>ASTRA POINTS</p>
            <p className="text-white/85 font-light"
              style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.5rem", letterSpacing: "-0.01em" }}>
              {sitePoints !== null ? sitePoints.toLocaleString() : "—"}
            </p>
            <p className="text-white/25 text-[9px] mt-1" style={{ letterSpacing: "0.2em" }}>사이트 포인트</p>
          </div>

          {/* DISCORD POINTS */}
          <div className="p-5" style={{ background: "#050508" }}>
            <p className="text-white/20 text-[9px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>DISCORD POINTS</p>
            <p className="text-white/85 font-light"
              style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.5rem", letterSpacing: "-0.01em" }}>
              {discordPoints !== null ? discordPoints.toLocaleString() : "—"}
            </p>
            <p className="text-white/25 text-[9px] mt-1" style={{ letterSpacing: "0.2em" }}>
              {discordPoints === null ? "Discord 미연결" : "디스코드 포인트"}
            </p>
          </div>

          {/* SGC HOLDING + Conversion */}
          <div className="flex-1 p-5 flex flex-col" style={{ background: "#050508" }}>
            <p className="text-white/20 text-[9px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>SGC HOLDING</p>
            <p className="text-white/85 font-light mb-1"
              style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.5rem", letterSpacing: "-0.01em" }}>
              —
            </p>
            <p className="text-white/25 text-[9px] mb-5" style={{ letterSpacing: "0.2em" }}>추후 업데이트</p>

            {/* Divider */}
            <div className="h-px mb-5" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Conversion */}
            <div className="flex-1">
              <p className="text-white/20 text-[9px] font-light mb-1" style={{ letterSpacing: "0.38em" }}>DISCORD → ASTRA</p>
              <p className="text-white/18 text-[9px] mb-4" style={{ letterSpacing: "0.18em" }}>
                1,000 Discord = 10 ASTRA
              </p>

              {discordPoints === null ? (
                <p className="text-white/28 text-xs font-light" style={{ letterSpacing: "0.08em" }}>
                  Discord 계정을 연결하면 사용할 수 있어요.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      value={convertAmt}
                      onChange={(e) => setConvertAmt(e.target.value)}
                      placeholder="Discord 수량"
                      min={CONVERT_RATE}
                      max={discordPoints}
                      step={CONVERT_RATE}
                      className="flex-1 bg-transparent text-white/65 text-xs font-light outline-none px-3 py-2"
                      style={{ border: "1px solid rgba(255,255,255,0.09)", letterSpacing: "0.03em" }}
                    />
                    <button
                      onClick={handleConvert}
                      disabled={converting || !convertPreview || convertPreview < 1}
                      className="text-[9px] font-light px-3 py-2 transition-colors whitespace-nowrap"
                      style={{
                        letterSpacing: "0.28em",
                        color:   "rgba(80,165,255,0.85)",
                        border:  "1px solid rgba(80,165,255,0.22)",
                        opacity: converting || !convertPreview || convertPreview < 1 ? 0.4 : 1,
                      }}>
                      CONVERT
                    </button>
                  </div>

                  {convertPreview !== null && convertPreview > 0 && (
                    <p className="text-white/35 text-[9px] mb-2" style={{ letterSpacing: "0.18em" }}>
                      → ASTRA {convertPreview} pts 획득
                    </p>
                  )}

                  {convertMsg && (
                    <p className="text-[9px] font-light"
                      style={{ letterSpacing: "0.15em", color: convertMsg.startsWith("✓") ? "rgba(110,231,183,0.80)" : "rgba(255,100,100,0.75)" }}>
                      {convertMsg}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Trade panel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="p-6" style={{ background: "#050508" }}>
          <p className="text-white/22 text-[9px] font-light mb-4" style={{ letterSpacing: "0.38em" }}>TRADE SGC</p>
          <div className="flex gap-1 mb-5">
            {(["buy", "sell"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 text-[10px] font-light uppercase transition-all duration-200"
                style={{
                  letterSpacing: "0.3em",
                  color:        mode === m ? (m === "buy" ? "rgba(110,231,183,0.90)" : "rgba(252,165,165,0.90)") : "rgba(255,255,255,0.28)",
                  borderBottom: `1px solid ${mode === m ? (m === "buy" ? "rgba(110,231,183,0.50)" : "rgba(252,165,165,0.50)") : "rgba(255,255,255,0.06)"}`,
                }}>
                {m}
              </button>
            ))}
          </div>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (SGC)"
            className="w-full bg-transparent text-white/70 text-sm font-light outline-none placeholder:text-white/18 px-4 py-3 mb-3"
            style={{ border: "1px solid rgba(255,255,255,0.08)", letterSpacing: "0.04em" }} />
          <button className="w-full py-2.5 text-[10px] font-light uppercase transition-all duration-300"
            style={{
              letterSpacing: "0.32em",
              color:       mode === "buy" ? "rgba(110,231,183,0.85)" : "rgba(252,165,165,0.85)",
              border:     `1px solid ${mode === "buy" ? "rgba(110,231,183,0.28)" : "rgba(252,165,165,0.28)"}`,
              background:  mode === "buy" ? "rgba(110,231,183,0.05)" : "rgba(252,165,165,0.05)",
            }}>
            {mode === "buy" ? "BUY SGC" : "SELL SGC"}
          </button>
        </motion.div>

        {/* Attendance */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
          className="lg:col-span-2 p-6 flex items-center justify-between gap-6" style={{ background: "#050508" }}>
          <div>
            <p className="text-white/22 text-[9px] font-light mb-1" style={{ letterSpacing: "0.38em" }}>DAILY ATTENDANCE</p>
            <p className="text-white/60 text-sm font-light">출석 체크로 포인트를 획득하세요.</p>
            <p className="text-white/22 text-[9px] mt-2" style={{ letterSpacing: "0.2em" }}>연속 출석 7일 → +150 pts 보너스</p>
          </div>
          <button className="shrink-0 px-6 py-2.5 text-[10px] font-light transition-all duration-300"
            style={{ letterSpacing: "0.32em", color: "rgba(110,231,183,0.80)", border: "1px solid rgba(110,231,183,0.28)", background: "rgba(110,231,183,0.05)" }}>
            CHECK IN ✓
          </button>
        </motion.div>
      </div>

      {/* Points Ranking */}
      {ranking.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12">
          <p className="text-white/22 text-[9px] font-light mb-5" style={{ letterSpacing: "0.45em" }}>
            ASTRA POINTS RANKING
          </p>
          <div className="space-y-px" style={{ background: "rgba(255,255,255,0.04)" }}>
            {ranking.map((user, i) => (
              <Link key={user.id} href={user.handle ? `/profile/${user.handle}` : "#"}
                className="group flex items-center gap-5 px-5 py-4 transition-colors duration-200"
                style={{ background: "#050508" }}>
                <span className="text-white/18 text-[10px] font-light w-5 shrink-0" style={{ letterSpacing: "0.15em" }}>
                  #{i + 1}
                </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {user.image
                    ? <img src={user.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    : <span className="text-white/35 text-[10px]">{(user.nickname ?? "?")[0]}</span>
                  }
                </div>
                <span className="flex-1 text-white/65 text-sm font-light group-hover:text-white/90 transition-colors truncate"
                  style={{ letterSpacing: "0.06em" }}>
                  {user.nickname ?? "—"}
                </span>
                <span className="text-white/35 text-xs font-light shrink-0" style={{ letterSpacing: "0.12em" }}>
                  {user.points.toLocaleString()} pts
                </span>
                {user.handle && (
                  <span className="text-white/18 text-[9px] font-light shrink-0 group-hover:text-white/40 transition-colors"
                    style={{ letterSpacing: "0.2em" }}>→</span>
                )}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
