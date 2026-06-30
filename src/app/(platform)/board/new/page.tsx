"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const CATEGORIES = ["FREE", "QUESTION", "REVIEW"] as const;

export default function NewPostPage() {
  const router = useRouter();
  const { status } = useSession();

  const [title,      setTitle]      = useState("");
  const [content,    setContent]    = useState("");
  const [category,   setCategory]   = useState<typeof CATEGORIES[number]>("FREE");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/posts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ title, content, category }),
    });
    if (res.ok) {
      const post = await res.json();
      router.push(`/board/${post.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "오류가 발생했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-8 md:px-14 py-14 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3 text-white/25 text-[10px] font-light mb-10" style={{ letterSpacing: "0.3em" }}>
          <Link href="/board" className="hover:text-white/55 transition-colors">BOARD</Link>
          <span>/</span>
          <span className="text-white/45">NEW POST</span>
        </div>

        <h1
          className="text-white font-light mb-12 leading-none"
          style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2rem, 5vw, 3.8rem)", letterSpacing: "-0.02em" }}
        >
          Write a signal.
        </h1>

        <div className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-white/25 text-[9px] font-light mb-3" style={{ letterSpacing: "0.42em" }}>
              CATEGORY
            </label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="px-4 py-1.5 text-[10px] font-light transition-all duration-200"
                  style={{
                    letterSpacing: "0.28em",
                    color:   category === c ? "rgba(210,235,255,0.92)" : "rgba(255,255,255,0.28)",
                    border: `1px solid ${category === c ? "rgba(80,165,255,0.50)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-white/25 text-[9px] font-light" style={{ letterSpacing: "0.42em" }}>TITLE</label>
              <span className="text-white/18 text-[9px]">{title.length}/100</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="제목을 입력하세요"
              className="w-full bg-transparent text-white/85 font-light outline-none placeholder:text-white/18 py-3 px-4"
              style={{ border: "1px solid rgba(255,255,255,0.08)", fontSize: "1.05rem", letterSpacing: "0.01em" }}
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-white/25 text-[9px] font-light" style={{ letterSpacing: "0.42em" }}>CONTENT</label>
              <span className="text-white/18 text-[9px]">{content.length}/10000</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 10000))}
              placeholder="내용을 입력하세요..."
              rows={12}
              className="w-full bg-transparent text-white/70 font-light resize-none outline-none placeholder:text-white/18 py-3 px-4"
              style={{ border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.95rem", letterSpacing: "0.02em", lineHeight: 1.9 }}
            />
          </div>

          {error && (
            <p className="text-red-400/70 text-xs font-light" style={{ letterSpacing: "0.08em" }}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/board"
              className="text-white/25 hover:text-white/55 text-[10px] font-light transition-colors"
              style={{ letterSpacing: "0.28em" }}
            >
              ← CANCEL
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 text-white/70 hover:text-white text-[10px] font-light transition-all duration-300"
              style={{
                letterSpacing: "0.32em",
                border:      "1px solid rgba(80,165,255,0.40)",
                background:  "rgba(80,165,255,0.06)",
                opacity:     submitting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "rgba(80,165,255,0.12)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(80,165,255,0.06)")}
            >
              {submitting ? "PUBLISHING..." : "PUBLISH"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
