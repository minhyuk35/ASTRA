"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import AstraLoading from "@/components/AstraLoading";

type Author = { id: string; nickname: string | null; handle: string | null };
type Post = {
  id:        string;
  title:     string;
  content:   string;
  author:    Author;
  createdAt: string;
  _count:    { likes: number; comments: number };
  category:  "FREE" | "QUESTION" | "NOTICE" | "REVIEW";
};

const CATEGORY_COLORS: Record<string, string> = {
  FREE:     "rgba(80,165,255,0.65)",
  QUESTION: "rgba(251,191,36,0.65)",
  NOTICE:   "rgba(110,231,183,0.65)",
  REVIEW:   "rgba(196,181,253,0.65)",
};

const FILTERS = ["ALL", "FREE", "QUESTION", "REVIEW", "NOTICE"] as const;

const stagger = { show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

function displayName(author: Author) {
  return author.nickname ?? author.handle ?? "Unknown";
}

const LIMIT     = 15;
const CACHE_TTL = 30_000;

function boardCacheKey(filter: string, page: number) {
  return `astra_board_${filter}_${page}_v1`;
}

export default function BoardPage() {
  const [filter,  setFilter]  = useState<typeof FILTERS[number]>("ALL");
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = boardCacheKey(filter, page);
    // show cached instantly
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: { posts: Post[]; total: number }; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          setPosts(data.posts); setTotal(data.total); setLoading(false);
          // silent background refresh
          const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
          if (filter !== "ALL") params.set("category", filter);
          fetch(`/api/posts?${params}`)
            .then((r) => r.ok ? r.json() : null)
            .then((d) => {
              if (!d) return;
              setPosts(d.posts ?? []); setTotal(d.total ?? 0);
              try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
            }).catch(() => {});
          return;
        }
      }
    } catch {}
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (filter !== "ALL") params.set("category", filter);
    fetch(`/api/posts?${params}`)
      .then((r) => r.ok ? r.json() : { posts: [], total: 0 })
      .then((d) => {
        setPosts(d.posts ?? []); setTotal(d.total ?? 0);
        try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
      })
      .finally(() => setLoading(false));
  }, [filter, page]);

  const handleFilter = (f: typeof FILTERS[number]) => { setFilter(f); setPage(1); };
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen px-8 md:px-14 py-14">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-14"
      >
        <p className="text-white/25 text-[10px] font-light mb-3" style={{ letterSpacing: "0.45em" }}>
          01 — BOARD
        </p>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1
            className="text-white font-light leading-none"
            style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2.4rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}
          >
            Signals from<br />the community.
          </h1>
          <Link
            href="/board/new"
            className="flex items-center gap-2 px-5 py-2.5 text-white/60 hover:text-white/90 text-xs font-light transition-colors duration-300"
            style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
          >
            + WRITE
          </Link>
        </div>
        <div className="mt-8 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-1 mb-10 flex-wrap"
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className="px-4 py-1.5 text-[10px] font-light transition-all duration-300"
            style={{
              letterSpacing: "0.3em",
              color:        filter === f ? "rgba(210,235,255,0.95)" : "rgba(255,255,255,0.28)",
              borderBottom: `1px solid ${filter === f ? "rgba(80,165,255,0.60)" : "transparent"}`,
            }}
          >
            {f}
          </button>
        ))}
      </motion.div>

      {/* List */}
      {loading ? (
        <AstraLoading fullScreen={false} />
      ) : posts.length === 0 ? (
        <p className="text-white/22 text-sm font-light py-8" style={{ letterSpacing: "0.08em" }}>아직 글이 없어요.</p>
      ) : (
        <>
          <motion.div
            className="space-y-px"
            variants={stagger}
            initial="hidden"
            animate="show"
            key={`${filter}-${page}`}
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={fadeUp}>
                <Link href={`/board/${post.id}`} className="group block">
                  <div
                    className="py-5 px-0 flex items-start gap-5 transition-all duration-300"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.paddingLeft = "10px"; e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.10)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.paddingLeft = "0";    e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.05)"; }}
                  >
                    <span
                      className="shrink-0 text-[8px] font-light px-2 py-1 mt-0.5"
                      style={{
                        letterSpacing: "0.28em",
                        color:  CATEGORY_COLORS[post.category],
                        border: `1px solid ${CATEGORY_COLORS[post.category].replace("0.65", "0.25")}`,
                      }}
                    >
                      {post.category}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-white/85 font-light group-hover:text-white transition-colors duration-300 truncate"
                        style={{ fontSize: "1.05rem", letterSpacing: "-0.01em" }}
                      >
                        {post.title}
                      </p>
                      <p className="text-white/28 text-xs font-light mt-1 truncate" style={{ letterSpacing: "0.04em" }}>
                        {post.content.slice(0, 80)}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-5 text-white/20 text-[10px] font-light" style={{ letterSpacing: "0.18em" }}>
                      <span>{displayName(post.author)}</span>
                      <span className="hidden sm:block">{post.createdAt.slice(0, 10)}</span>
                      <span>♥ {post._count.likes}</span>
                      <span>✦ {post._count.comments}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-white/30 hover:text-white/65 text-[10px] font-light transition-colors px-3 py-1.5"
                style={{ letterSpacing: "0.22em", opacity: page <= 1 ? 0.3 : 1 }}
              >
                ← PREV
              </button>
              <span className="text-white/20 text-[10px] font-light" style={{ letterSpacing: "0.22em" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-white/30 hover:text-white/65 text-[10px] font-light transition-colors px-3 py-1.5"
                style={{ letterSpacing: "0.22em", opacity: page >= totalPages ? 0.3 : 1 }}
              >
                NEXT →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
