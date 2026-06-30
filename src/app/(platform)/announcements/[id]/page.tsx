"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AstraLoading from "@/components/AstraLoading";

type Ann = {
  id: string; category: string; title: string; summary: string;
  content: string; authorName: string; createdAt: string;
  startsAt: string | null; endsAt: string | null;
};

type Reply   = { id: string; label: string; content: string; createdAt: string };
type Comment = { id: string; content: string; authorNick: string; createdAt: string; replies: Reply[] };

const CAT_COLORS: Record<string, string> = {
  NOTICE: "rgba(251,191,36,0.72)",
  EVENT:  "rgba(110,231,183,0.72)",
  UPDATE: "rgba(80,165,255,0.72)",
};

const inp = {
  border: "1px solid rgba(255,255,255,0.09)",
  background: "transparent",
  color: "rgba(255,255,255,0.75)",
  outline: "none",
  letterSpacing: "0.03em",
};

const ADJS  = ["고요한","빛나는","차가운","먼","푸른","붉은","흰","어두운","밝은","거대한","작은","신비로운","뜨거운","깊은","빠른","느린","외로운","젊은","오래된"];
const NOUNS = ["별","혜성","성운","행성","위성","은하","소행성","별자리","성단","퀘이사","유성","초신성","펄서","성좌","항성"];

function genAnonNick(): string {
  return ADJS[Math.floor(Math.random() * ADJS.length)] + " " + NOUNS[Math.floor(Math.random() * NOUNS.length)];
}

function getOrCreateAnonNick(): string {
  try {
    const stored = localStorage.getItem("astra_anon_nick");
    if (stored) return stored;
    const nick = genAnonNick();
    localStorage.setItem("astra_anon_nick", nick);
    return nick;
  } catch {
    return genAnonNick();
  }
}

export default function AnnouncementDetailPage() {
  const { id } = useParams() as { id: string };
  const { data: session } = useSession();

  const [ann,      setAnn]      = useState<Ann | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [anonNick] = useState<string>(getOrCreateAnonNick);
  const [text,     setText]     = useState("");
  const [posting,  setPosting]  = useState(false);
  const [cmtMsg,   setCmtMsg]   = useState("");

  const [replyOpen,    setReplyOpen]    = useState<string | null>(null);
  const [replyText,    setReplyText]    = useState("");
  const [replyPosting, setReplyPosting] = useState(false);

  const canReply = session?.user?.role === "MANAGER";

  useEffect(() => {
    const key = `astra_ann_${id}_v1`;
    const ttl = 5 * 60_000; // announcements rarely change
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: Ann; ts: number };
        if (Date.now() - ts < ttl) {
          setAnn(data); setLoading(false);
          return;
        }
      }
    } catch {}
    fetch(`/api/announcements/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: Ann | null) => {
        setAnn(d);
        if (d) try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
      })
      .finally(() => setLoading(false));
  }, [id]);

  const fetchComments = () => {
    fetch(`/api/announcements/${id}/comments`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setComments(Array.isArray(d) ? d : []));
  };

  useEffect(() => { fetchComments(); }, [id]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true); setCmtMsg("");
    const res = await fetch(`/api/announcements/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim(), authorNick: anonNick }),
    });
    setPosting(false);
    if (res.ok) {
      setText(""); setCmtMsg("댓글이 등록됐어요.");
      fetchComments();
    } else {
      const d = await res.json().catch(() => ({}));
      setCmtMsg((d as { error?: string }).error ?? "오류가 발생했어요.");
    }
    setTimeout(() => setCmtMsg(""), 3000);
  };

  const submitReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setReplyPosting(true);
    const res = await fetch(`/api/announcements/${id}/comments/${commentId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyText.trim() }),
    });
    setReplyPosting(false);
    if (res.ok) { setReplyText(""); setReplyOpen(null); fetchComments(); }
  };

  if (loading) return <AstraLoading />;

  if (!ann) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/35 text-sm font-light">Announcement not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen px-8 md:px-14 py-14 max-w-2xl">
      <div className="flex items-center gap-2 text-white/22 text-[10px] font-light mb-8" style={{ letterSpacing: "0.3em" }}>
        <Link href="/announcements" className="hover:text-white/50 transition-colors">ANNOUNCEMENTS</Link>
        <span>/</span>
        <span className="text-[8px] px-2 py-0.5"
          style={{ letterSpacing: "0.28em", color: CAT_COLORS[ann.category] ?? "rgba(255,255,255,0.45)", border: `1px solid ${(CAT_COLORS[ann.category] ?? "rgba(255,255,255,0.45)").replace("0.72","0.22")}` }}>
          {ann.category}
        </span>
      </div>

      <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="text-white font-light mb-4 leading-tight"
          style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: "-0.02em", wordBreak: "keep-all" }}>
          {ann.title}
        </h1>

        <p className="text-white/22 text-[10px] font-light mb-2" style={{ letterSpacing: "0.28em" }}>
          {ann.createdAt.slice(0, 10)} · {ann.authorName}
        </p>

        {(ann.startsAt || ann.endsAt) && (
          <p className="text-white/20 text-[9px] font-light mb-4" style={{ letterSpacing: "0.22em" }}>
            {ann.startsAt && ann.startsAt.slice(0, 10)}
            {ann.startsAt && ann.endsAt && " ~ "}
            {ann.endsAt && ann.endsAt.slice(0, 10)}
          </p>
        )}

        <div className="h-px mb-8" style={{ background: "rgba(255,255,255,0.06)" }} />

        <div className="text-white/60 font-light leading-loose whitespace-pre-line"
          style={{ fontSize: "0.93rem", letterSpacing: "0.02em", lineHeight: 2 }}>
          {ann.content}
        </div>

        <div className="h-px mt-10 mb-10" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* ─── Comments ─────────────────────────────────────────── */}
        <section>
          <p className="text-white/20 text-[9px] font-light mb-6" style={{ letterSpacing: "0.42em" }}>
            COMMENTS ({comments.length})
          </p>

          <div className="space-y-0 mb-8">
            <AnimatePresence>
              {comments.map((c) => (
                <motion.div key={c.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>

                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-white/60 text-xs font-light" style={{ letterSpacing: "0.05em" }}>
                      {c.authorNick}
                    </span>
                    <span className="text-white/18 text-[9px]">{c.createdAt.slice(0, 10)}</span>
                  </div>

                  <p className="text-white/50 text-sm font-light leading-relaxed mb-2" style={{ letterSpacing: "0.02em" }}>
                    {c.content}
                  </p>

                  {c.replies.map((r) => (
                    <div key={r.id} className="ml-4 mt-2 pl-3 py-2.5"
                      style={{ borderLeft: "1px solid rgba(80,165,255,0.20)", background: "rgba(80,165,255,0.03)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-light px-1.5 py-0.5"
                          style={{ letterSpacing: "0.22em", color: "rgba(80,165,255,0.75)", border: "1px solid rgba(80,165,255,0.18)" }}>
                          {r.label}
                        </span>
                        <span className="text-white/18 text-[9px]">{r.createdAt.slice(0, 10)}</span>
                      </div>
                      <p className="text-white/55 text-xs font-light leading-relaxed" style={{ letterSpacing: "0.02em" }}>
                        {r.content}
                      </p>
                    </div>
                  ))}

                  {canReply && (
                    <div className="mt-2 ml-4">
                      {replyOpen !== c.id ? (
                        <button onClick={() => { setReplyOpen(c.id); setReplyText(""); }}
                          className="text-white/22 hover:text-white/55 text-[9px] font-light transition-colors"
                          style={{ letterSpacing: "0.22em" }}>
                          + 답변
                        </button>
                      ) : (
                        <div className="space-y-2 mt-1">
                          <textarea rows={2} value={replyText}
                            onChange={(e) => setReplyText(e.target.value.slice(0, 500))}
                            placeholder="답변을 입력해주세요..."
                            className="w-full text-xs font-light px-3 py-2 resize-none"
                            style={{ ...inp, lineHeight: 1.7 }} />
                          <div className="flex items-center gap-3">
                            <button onClick={() => submitReply(c.id)}
                              disabled={replyPosting || !replyText.trim()}
                              className="text-[9px] font-light px-3 py-1.5 transition-colors"
                              style={{ letterSpacing: "0.25em", color: "rgba(80,165,255,0.80)", border: "1px solid rgba(80,165,255,0.22)", opacity: replyPosting ? 0.5 : 1 }}>
                              {replyPosting ? "..." : "REPLY"}
                            </button>
                            <button onClick={() => setReplyOpen(null)}
                              className="text-white/20 hover:text-white/50 text-[9px] font-light transition-colors"
                              style={{ letterSpacing: "0.22em" }}>
                              CANCEL
                            </button>
                            <span className="text-white/18 text-[9px]">{replyText.length}/500</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {comments.length === 0 && (
              <p className="text-white/18 text-xs font-light py-4" style={{ letterSpacing: "0.12em" }}>
                첫 댓글을 남겨보세요.
              </p>
            )}
          </div>

          {/* new comment form */}
          <form onSubmit={submitComment} className="space-y-3">
            <p className="text-white/18 text-[9px] font-light" style={{ letterSpacing: "0.38em" }}>NEW COMMENT</p>
            <p className="text-white/25 text-[9px] font-light" style={{ letterSpacing: "0.15em" }}>
              작성자 /{" "}
              <span style={{ color: "rgba(80,165,255,0.60)" }}>{anonNick}</span>
            </p>
            <textarea rows={3} value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              placeholder="댓글 내용을 입력해주세요..."
              className="w-full text-xs font-light px-3 py-2 resize-none"
              style={{ ...inp, lineHeight: 1.8 }} />
            <div className="flex items-center gap-4">
              <button type="submit" disabled={posting || !text.trim()}
                className="text-[9px] font-light px-4 py-1.5 transition-colors"
                style={{ letterSpacing: "0.28em", color: "rgba(80,165,255,0.80)", border: "1px solid rgba(80,165,255,0.22)", opacity: posting ? 0.5 : 1 }}>
                {posting ? "..." : "SUBMIT"}
              </button>
              <span className="text-white/18 text-[9px]">{text.length}/500</span>
              {cmtMsg && (
                <span className="text-[9px]" style={{
                  letterSpacing: "0.18em",
                  color: cmtMsg.includes("오류") ? "rgba(255,100,100,0.75)" : "rgba(110,231,183,0.75)",
                }}>
                  {cmtMsg}
                </span>
              )}
            </div>
          </form>
        </section>

        <div className="h-px mt-10 mb-6" style={{ background: "rgba(255,255,255,0.06)" }} />

        <Link href="/announcements" className="text-white/25 hover:text-white/55 text-[10px] font-light transition-colors"
          style={{ letterSpacing: "0.28em" }}>
          ← ALL ANNOUNCEMENTS
        </Link>
      </motion.article>
    </div>
  );
}
