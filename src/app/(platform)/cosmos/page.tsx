"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

const NOTE_COST   = 30;
const MAX_CHARS   = 150;
const CANVAS_MIN  = 5000;

type Note = { id: string; content: string; posX: number; posY: number; createdAt: string };

/* Deterministic star field — same positions every render */
function useStars(height: number) {
  return useMemo(() => {
    const count = Math.floor(height / 8);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x:  ((Math.sin(i * 13.37 + 1) * 0.5 + 0.5) * 96 + 2),
      y:  ((Math.sin(i * 7.91  + 2) * 0.5 + 0.5) * height),
      r:  ((Math.sin(i * 3.14  + 3) * 0.5 + 0.5) * 1.2 + 0.2),
      o:  ((Math.sin(i * 5.67  + 4) * 0.5 + 0.5) * 0.35 + 0.08),
    }));
  }, [height]);
}

export default function CosmosPage() {
  const { data: session, status } = useSession();
  const [notes,      setNotes]      = useState<Note[]>([]);
  const [active,     setActive]     = useState<Note | null>(null);
  const [creating,   setCreating]   = useState(false);
  const [draft,      setDraft]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [msg,        setMsg]        = useState("");
  const [points,     setPoints]     = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const canvasH = useMemo(() => {
    if (!notes.length) return CANVAS_MIN;
    const maxY = Math.max(...notes.map((n) => n.posY));
    return Math.max(CANVAS_MIN, maxY + 1200);
  }, [notes]);

  const stars = useStars(canvasH);

  const NOTES_CACHE_KEY = "astra_cosmos_v1";
  const NOTES_CACHE_TTL = 60_000;

  const loadNotes = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(NOTES_CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: Note[]; ts: number };
        if (Date.now() - ts < NOTES_CACHE_TTL) {
          setNotes(data);
          // silent refresh
          fetch("/api/space-notes").then((r) => r.json()).then((d) => {
            if (!Array.isArray(d)) return;
            setNotes(d);
            try { sessionStorage.setItem(NOTES_CACHE_KEY, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
          }).catch(() => {});
          return;
        }
      }
    } catch {}
    fetch("/api/space-notes").then((r) => r.json()).then((d) => {
      if (!Array.isArray(d)) return;
      setNotes(d);
      try { sessionStorage.setItem(NOTES_CACHE_KEY, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
    }).catch(() => {});
  }, []);

  const loadPoints = useCallback(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile").then((r) => r.json()).then((d) => setPoints(d.points ?? null)).catch(() => {});
  }, [status]);

  useEffect(() => { loadNotes(); }, [loadNotes]);
  useEffect(() => { loadPoints(); }, [loadPoints]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true); setMsg("");
    const res = await fetch("/api/space-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft.trim() }),
    });
    setSending(false);
    if (res.ok) {
      const note: Note = await res.json();
      setNotes((prev) => {
        const next = [note, ...prev];
        try { sessionStorage.removeItem("astra_cosmos_v1"); } catch {}
        return next;
      });
      setDraft(""); setCreating(false);
      loadPoints();
      setTimeout(() => {
        wrapRef.current?.scrollTo({ top: note.posY - 200, behavior: "smooth" });
      }, 300);
    } else {
      const d = await res.json();
      setMsg(d.error ?? "오류가 발생했어요.");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "#020204" }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 pt-6 pb-4 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(2,2,4,0.92) 0%, transparent 100%)" }}>
        <div>
          <p className="text-white/18 text-[9px] font-light" style={{ letterSpacing: "0.45em" }}>COSMOS</p>
          <p className="text-white/10 text-[8px] font-light mt-0.5" style={{ letterSpacing: "0.28em", fontFamily: "var(--font-korean)" }}>우주를 떠도는 익명의 흔적들</p>
        </div>
        {points !== null && (
          <p className="text-white/22 text-[9px] font-light pointer-events-auto" style={{ letterSpacing: "0.28em" }}>
            {points} <span className="text-white/12">pts</span>
          </p>
        )}
      </div>

      {/* Scroll container */}
      <div ref={wrapRef} className="absolute inset-0 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="relative w-full" style={{ height: canvasH }}>

          {/* Stars */}
          {stars.map((s) => (
            <div
              key={s.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left:    `${s.x}%`,
                top:     s.y,
                width:   s.r * 2,
                height:  s.r * 2,
                background: "white",
                opacity: s.o,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

          {/* Notes */}
          {notes.map((note) => (
            <NoteOrb
              key={note.id}
              note={note}
              isActive={active?.id === note.id}
              onClick={() => setActive(active?.id === note.id ? null : note)}
            />
          ))}

          {/* Empty hint */}
          {notes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-white/12 text-xs font-light text-center" style={{ letterSpacing: "0.28em", fontFamily: "var(--font-korean)" }}>
                아직 아무도 흔적을 남기지 않았어요.<br />
                <span className="text-white/8">첫 번째 별이 되어보세요.</span>
              </p>
            </div>
          )}
        </div>

        {/* Scroll fade bottom */}
        <div className="sticky bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(2,2,4,0.85) 0%, transparent 100%)", marginTop: -96 }} />
      </div>

      {/* Note count */}
      <div className="absolute bottom-8 left-8 pointer-events-none z-20">
        <p className="text-white/10 text-[8px] font-light" style={{ letterSpacing: "0.38em" }}>
          {notes.length} DRIFTS
        </p>
      </div>

      {/* Active note popup (backdrop dismiss) */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 z-20"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setActive(null)}
          />
        )}
      </AnimatePresence>

      {/* Compose button */}
      <AnimatePresence>
        {status === "authenticated" && !creating && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => { setCreating(true); setMsg(""); }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-5 py-3"
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(5,5,10,0.88)",
              backdropFilter: "blur(20px)",
              letterSpacing: "0.28em",
              color: "rgba(255,255,255,0.45)",
              fontSize: "10px",
              fontWeight: 300,
            }}
            whileHover={{ borderColor: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.72)" }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ fontSize: 14, lineHeight: 1, marginBottom: 1, opacity: 0.6 }}>+</span>
            <span style={{ fontFamily: "var(--font-korean)" }}>편지 남기기</span>
            <span className="text-white/18" style={{ fontSize: 8, letterSpacing: "0.2em" }}>{NOTE_COST}pts</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Compose modal */}
      <AnimatePresence>
        {creating && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end justify-center pb-8 px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md"
              style={{
                background: "rgba(4,5,12,0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(28px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/22 text-[9px] font-light" style={{ letterSpacing: "0.4em" }}>NEW DRIFT</p>
                  <div className="flex items-center gap-3">
                    <span className="text-white/14 text-[8px] font-light" style={{ letterSpacing: "0.22em", fontFamily: "var(--font-korean)" }}>
                      {NOTE_COST}pts 소모
                    </span>
                    <button type="button" onClick={() => setCreating(false)}
                      className="text-white/22 hover:text-white/55 transition-colors text-[9px] font-light"
                      style={{ letterSpacing: "0.22em" }}>
                      취소
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="우주 어딘가에 남겨질 흔적을 작성하세요..."
                    rows={4}
                    autoFocus
                    className="w-full resize-none text-sm font-light outline-none px-0 py-0"
                    style={{
                      background: "transparent",
                      color: "rgba(255,255,255,0.65)",
                      border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      lineHeight: 1.8,
                      letterSpacing: "0.02em",
                      paddingBottom: "12px",
                      fontFamily: "var(--font-korean)",
                      fontSize: "0.875rem",
                    }}
                  />
                  <span className="absolute bottom-3 right-0 text-white/18 text-[8px] font-light" style={{ letterSpacing: "0.18em" }}>
                    {draft.length}/{MAX_CHARS}
                  </span>
                </div>

                {msg && (
                  <p className="text-[9px] font-light" style={{ letterSpacing: "0.22em", color: "rgba(255,100,100,0.75)", fontFamily: "var(--font-korean)" }}>
                    {msg}
                  </p>
                )}

                <div className="flex items-center gap-4 pt-1">
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="px-5 py-2 text-[10px] font-light transition-all"
                    style={{
                      letterSpacing: "0.3em",
                      color: "rgba(255,255,255,0.65)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      opacity: (sending || !draft.trim()) ? 0.4 : 1,
                    }}
                  >
                    {sending ? "전송 중..." : "우주로 띄우기"}
                  </button>
                  {points !== null && (
                    <span className="text-white/18 text-[8px] font-light" style={{ letterSpacing: "0.18em", fontFamily: "var(--font-korean)" }}>
                      잔여 {points}pts
                    </span>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login nudge */}
      {status === "unauthenticated" && (
        <div className="absolute bottom-8 right-8 z-20 pointer-events-none">
          <p className="text-white/15 text-[9px] font-light text-right" style={{ letterSpacing: "0.22em", fontFamily: "var(--font-korean)" }}>
            로그인하면 편지를 남길 수 있어요.
          </p>
        </div>
      )}
    </div>
  );
}

function NoteOrb({ note, isActive, onClick }: { note: Note; isActive: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const show = isActive || hov;

  return (
    <div
      className="absolute"
      style={{
        left:      `${note.posX}%`,
        top:       note.posY,
        transform: "translate(-50%, -50%)",
        zIndex:    isActive ? 15 : 5,
      }}
    >
      {/* Glow orb */}
      <motion.button
        onClick={onClick}
        onHoverStart={() => setHov(true)}
        onHoverEnd={() => setHov(false)}
        className="relative flex items-center justify-center rounded-full cursor-pointer"
        style={{
          width:  14,
          height: 14,
          background: "rgba(200, 220, 255, 0.65)",
          boxShadow: isActive
            ? "0 0 0 2px rgba(150,200,255,0.3), 0 0 18px rgba(130,190,255,0.70), 0 0 40px rgba(80,140,255,0.35)"
            : hov
            ? "0 0 0 1px rgba(150,200,255,0.2), 0 0 12px rgba(130,190,255,0.55)"
            : "0 0 8px rgba(130,190,255,0.30)",
        }}
        animate={{ scale: isActive ? 1.3 : hov ? 1.15 : 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        aria-label="우주 편지 읽기"
      >
        {/* Pulse ring */}
        <motion.span
          className="absolute inset-0 rounded-full border pointer-events-none"
          style={{ borderColor: "rgba(150,200,255,0.35)" }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: (note.posX % 3) }}
        />
      </motion.button>

      {/* Popup */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute pointer-events-none"
            style={{
              bottom: 22,
              left: "50%",
              transform: "translateX(-50%)",
              width: "clamp(180px, 28vw, 260px)",
              background: "rgba(3, 5, 14, 0.94)",
              border: "1px solid rgba(120,180,255,0.12)",
              backdropFilter: "blur(16px)",
              padding: "12px 14px 10px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
              zIndex: 20,
            }}
          >
            <p
              className="text-white/60 text-xs font-light leading-relaxed"
              style={{ fontFamily: "var(--font-korean)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.75 }}
            >
              {note.content}
            </p>
            <p className="text-white/15 text-[8px] font-light mt-2" style={{ letterSpacing: "0.18em" }}>
              {note.createdAt.slice(0, 10)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
