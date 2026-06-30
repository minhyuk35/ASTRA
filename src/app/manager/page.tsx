"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AstraLoading from "@/components/AstraLoading";

type Reply = { id: string; label: string; content: string; createdAt: string };
type Comment = {
  id: string; content: string; authorNick: string; createdAt: string;
  replies: Reply[];
};
type AnnItem = {
  id: string; title: string; category: string; createdAt: string;
  annComments: Comment[];
};

const SCOPE_COLORS: Record<string, string> = {
  NOTICE: "rgba(251,191,36,0.72)",
  EVENT:  "rgba(110,231,183,0.72)",
  UPDATE: "rgba(80,165,255,0.72)",
};

const SCOPE_LABELS: Record<string, string> = {
  NOTICE: "공지 담당",
  EVENT:  "이벤트 담당",
  UPDATE: "업데이트 담당",
};

const inp = {
  border: "1px solid rgba(255,255,255,0.09)",
  background: "transparent",
  color: "rgba(255,255,255,0.75)",
  outline: "none",
  letterSpacing: "0.03em",
};

export default function ManagerPage() {
  const { data: session, status } = useSession();
  const [scope,        setScope]        = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [replyOpen,    setReplyOpen]    = useState<string | null>(null);
  const [replyText,    setReplyText]    = useState("");
  const [replyPosting, setReplyPosting] = useState(false);
  const [replyMsg,     setReplyMsg]     = useState("");

  const userRole = (session?.user as { role?: string } | undefined)?.role;

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/manager/comments")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setScope(d.scope);
        setAnnouncements(d.announcements ?? []);
      })
      .catch(() => setError("데이터를 불러올 수 없어요."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchData();
    if (status === "unauthenticated") setLoading(false);
  }, [status, fetchData]);

  const submitReply = async (annId: string, commentId: string) => {
    if (!replyText.trim()) return;
    setReplyPosting(true); setReplyMsg("");
    const res = await fetch(`/api/announcements/${annId}/comments/${commentId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyText.trim() }),
    });
    setReplyPosting(false);
    if (res.ok) {
      setReplyText(""); setReplyOpen(null); setReplyMsg("답변이 등록됐어요."); fetchData();
    } else {
      const d = await res.json().catch(() => ({}));
      setReplyMsg((d as { error?: string }).error ?? "오류가 발생했어요.");
    }
    setTimeout(() => setReplyMsg(""), 3000);
  };

  if (status === "loading" || loading) return <AstraLoading />;

  if (status === "unauthenticated") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "#050508" }}>
      <p className="text-white/35 text-sm font-light" style={{ letterSpacing: "0.08em" }}>로그인이 필요해요.</p>
      <button onClick={() => signIn()}
        className="px-6 py-2 text-[10px] font-light transition-colors"
        style={{ letterSpacing: "0.32em", color: "rgba(80,165,255,0.80)", border: "1px solid rgba(80,165,255,0.28)" }}>
        SIGN IN
      </button>
    </div>
  );

  if (userRole !== "MANAGER") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#050508" }}>
      <p className="text-white/35 text-sm font-light" style={{ letterSpacing: "0.08em" }}>접근 권한이 없어요.</p>
      <Link href="/" className="text-white/22 text-[10px] font-light hover:text-white/50 transition-colors"
        style={{ letterSpacing: "0.35em" }}>← HOME</Link>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#050508" }}>
      <p className="text-white/35 text-sm font-light">{error}</p>
      <Link href="/" className="text-white/22 text-[10px] font-light hover:text-white/50 transition-colors"
        style={{ letterSpacing: "0.35em" }}>← HOME</Link>
    </div>
  );

  const totalComments = announcements.reduce((s, a) => s + a.annComments.length, 0);
  const pendingComments = announcements.reduce(
    (s, a) => s + a.annComments.filter((c) => c.replies.length === 0).length, 0
  );

  return (
    <div className="min-h-screen px-6 md:px-12 py-10" style={{ background: "#050508" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          <span className="text-white text-[10px] font-light" style={{ letterSpacing: "0.44em" }}>
            ASTRA / MANAGER
          </span>
          {scope && (
            <span className="text-[8px] font-light px-2 py-0.5"
              style={{ letterSpacing: "0.22em", color: SCOPE_COLORS[scope], border: `1px solid ${SCOPE_COLORS[scope].replace("0.72","0.25")}` }}>
              {SCOPE_LABELS[scope]}
            </span>
          )}
        </div>
        <Link href="/" className="text-white/28 hover:text-white/60 text-[9px] font-light transition-colors"
          style={{ letterSpacing: "0.28em" }}>← SITE</Link>
      </div>

      {/* Stats */}
      <div className="flex gap-10 mb-10">
        {[["전체 댓글", totalComments], ["미답변", pendingComments]].map(([k, v]) => (
          <div key={k as string}>
            <p className="text-white/18 text-[9px] font-light mb-0.5" style={{ letterSpacing: "0.35em" }}>{k}</p>
            <p className="text-white/65 text-lg font-light">{v}</p>
          </div>
        ))}
      </div>

      <div className="h-px mb-8" style={{ background: "rgba(255,255,255,0.06)" }} />

      {replyMsg && (
        <p className="mb-4 text-[9px] font-light" style={{
          letterSpacing: "0.2em",
          color: replyMsg.includes("오류") ? "rgba(255,100,100,0.75)" : "rgba(110,231,183,0.75)",
        }}>
          {replyMsg}
        </p>
      )}

      {announcements.length === 0 ? (
        <p className="text-white/18 text-sm font-light" style={{ letterSpacing: "0.1em" }}>담당 공지가 없어요.</p>
      ) : (
        <div className="space-y-px">
          {announcements.map((ann) => (
            <div key={ann.id}>
              <button
                onClick={() => setExpanded(expanded === ann.id ? null : ann.id)}
                className="w-full flex items-center gap-4 py-4 text-left transition-all duration-200"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 font-light text-sm truncate" style={{ letterSpacing: "-0.01em" }}>
                    {ann.title}
                  </p>
                  <p className="text-white/20 text-[9px] mt-0.5" style={{ letterSpacing: "0.12em" }}>
                    {ann.createdAt.slice(0, 10)}
                  </p>
                </div>
                <span className="shrink-0 text-white/30 text-xs">
                  댓글 {ann.annComments.length}
                  {ann.annComments.filter((c) => c.replies.length === 0).length > 0 && (
                    <span className="ml-1.5 text-[8px] font-light px-1.5 py-0.5"
                      style={{ color: "rgba(251,191,36,0.75)", border: "1px solid rgba(251,191,36,0.20)" }}>
                      미답변 {ann.annComments.filter((c) => c.replies.length === 0).length}
                    </span>
                  )}
                </span>
                <span className="text-white/20 text-xs">{expanded === ann.id ? "▲" : "▼"}</span>
              </button>

              <AnimatePresence>
                {expanded === ann.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                    className="overflow-hidden">
                    <div className="pl-4 pt-2 pb-4 space-y-0">
                      {ann.annComments.length === 0 ? (
                        <p className="text-white/18 text-xs font-light py-2" style={{ letterSpacing: "0.1em" }}>
                          댓글이 없어요.
                        </p>
                      ) : (
                        ann.annComments.map((c) => (
                          <div key={c.id} className="py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-white/60 text-xs font-light">{c.authorNick}</span>
                              <span className="text-white/18 text-[9px]">{c.createdAt.slice(0, 10)}</span>
                              {c.replies.length === 0 && (
                                <span className="text-[8px] font-light px-1.5 py-0.5"
                                  style={{ color: "rgba(251,191,36,0.65)", border: "1px solid rgba(251,191,36,0.15)" }}>
                                  미답변
                                </span>
                              )}
                            </div>
                            <p className="text-white/50 text-sm font-light leading-relaxed mb-2" style={{ letterSpacing: "0.02em" }}>
                              {c.content}
                            </p>

                            {c.replies.map((r) => (
                              <div key={r.id} className="ml-4 mt-2 pl-3 py-2"
                                style={{ borderLeft: "1px solid rgba(80,165,255,0.20)", background: "rgba(80,165,255,0.03)" }}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-light px-1.5 py-0.5"
                                    style={{ letterSpacing: "0.20em", color: "rgba(80,165,255,0.75)", border: "1px solid rgba(80,165,255,0.18)" }}>
                                    {r.label}
                                  </span>
                                  <span className="text-white/18 text-[9px]">{r.createdAt.slice(0, 10)}</span>
                                </div>
                                <p className="text-white/55 text-xs font-light leading-relaxed">
                                  {r.content}
                                </p>
                              </div>
                            ))}

                            <div className="mt-2 ml-4">
                              {replyOpen !== c.id ? (
                                <button onClick={() => { setReplyOpen(c.id); setReplyText(""); }}
                                  className="text-white/22 hover:text-white/55 text-[9px] font-light transition-colors"
                                  style={{ letterSpacing: "0.22em" }}>
                                  + 답변
                                </button>
                              ) : (
                                <div className="space-y-2 mt-1">
                                  <textarea
                                    rows={2}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value.slice(0, 500))}
                                    placeholder="답변을 입력해주세요..."
                                    autoFocus
                                    className="w-full text-xs font-light px-3 py-2 resize-none"
                                    style={{ ...inp, lineHeight: 1.7 }}
                                  />
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => submitReply(ann.id, c.id)}
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
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
