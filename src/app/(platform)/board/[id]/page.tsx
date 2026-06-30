"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AstraLoading from "@/components/AstraLoading";

type Author = { id: string; nickname: string | null; handle: string | null; role?: string };
type Reply   = { id: string; content: string; createdAt: string; author: Author };
type CommentItem = { id: string; content: string; createdAt: string; author: Author; replies: Reply[] };

type PostDetail = {
  id:       string;
  title:    string;
  content:  string;
  category: string;
  createdAt: string;
  author:   Author;
  _count:   { likes: number; comments: number };
  liked:    boolean;
  comments: CommentItem[];
};

const CATEGORY_COLORS: Record<string, string> = {
  FREE:     "rgba(80,165,255,0.65)",
  QUESTION: "rgba(251,191,36,0.65)",
  NOTICE:   "rgba(110,231,183,0.65)",
  REVIEW:   "rgba(196,181,253,0.65)",
};

function displayName(a: Author) {
  return a.nickname ?? a.handle ?? "Unknown";
}

export default function PostDetailPage() {
  const { id }             = useParams<{ id: string }>();
  const router             = useRouter();
  const { data: session }  = useSession();

  const [post,       setPost]       = useState<PostDetail | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [liked,      setLiked]      = useState(false);
  const [likeCount,  setLikeCount]  = useState(0);
  const [liking,     setLiking]     = useState(false);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const fetchPost = useCallback(async () => {
    const res = await fetch(`/api/posts/${id}`);
    if (!res.ok) { router.push("/board"); return; }
    const data: PostDetail = await res.json();
    setPost(data);
    setLiked(data.liked);
    setLikeCount(data._count.likes);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleLike = async () => {
    if (!session || liking) return;
    // Optimistic: flip immediately
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((n) => wasLiked ? n - 1 : n + 1);
    setLiking(true);
    const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setLiked(d.liked);
      setLikeCount(d.count);
    } else {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount((n) => wasLiked ? n + 1 : n - 1);
    }
    setLiking(false);
  };

  const handleComment = async () => {
    if (!session || !comment.trim() || submitting) return;
    const content = comment.trim();
    const tempId = `opt-${Date.now()}`;
    // Optimistic: add immediately with temp author info
    const optimistic: CommentItem = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      author: { id: session.user.id, nickname: session.user.name ?? null, handle: null },
      replies: [],
    };
    setPost((p) => p ? { ...p, comments: [...p.comments, optimistic] } : p);
    setComment("");
    setSubmitting(true);
    const res = await fetch(`/api/posts/${id}/comments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ content }),
    });
    if (res.ok) {
      const real: CommentItem = await res.json();
      // Swap temp with real (proper nickname from server)
      setPost((p) => p ? { ...p, comments: p.comments.map((c) => c.id === tempId ? real : c) } : p);
    } else {
      // Revert on failure, restore textarea
      setPost((p) => p ? { ...p, comments: p.comments.filter((c) => c.id !== tempId) } : p);
      setComment(content);
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await fetch(`/api/posts/${id}/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setPost((p) => p ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("이 글을 삭제하시겠습니까?")) return;
    setDeleting(true);
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/board");
    } else {
      setDeleting(false);
    }
  };

  if (loading) return <AstraLoading />;

  if (!post) return null;

  const isAuthor = session?.user?.id === post.author.id;

  return (
    <div className="min-h-screen px-8 md:px-14 py-14 max-w-3xl">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-white/25 text-[10px] font-light mb-8"
        style={{ letterSpacing: "0.3em" }}
      >
        <Link href="/board" className="hover:text-white/50 transition-colors">BOARD</Link>
        <span>/</span>
        <span
          className="text-white/45"
          style={{ color: CATEGORY_COLORS[post.category] ?? "rgba(255,255,255,0.45)" }}
        >
          {post.category}
        </span>
      </motion.div>

      {/* Post */}
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1
            className="text-white font-light leading-tight"
            style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            {post.title}
          </h1>
          {isAuthor && (
            <button
              onClick={handleDeletePost}
              disabled={deleting}
              className="shrink-0 mt-1 text-white/20 hover:text-red-400/70 text-[10px] font-light transition-colors"
              style={{ letterSpacing: "0.22em" }}
            >
              {deleting ? "..." : "DELETE"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-5 text-white/25 text-[10px] font-light mb-8" style={{ letterSpacing: "0.22em" }}>
          <span>{displayName(post.author)}</span>
          <span>·</span>
          <span>{post.createdAt.slice(0, 10)}</span>
        </div>

        <div className="h-px mb-8" style={{ background: "rgba(255,255,255,0.06)" }} />

        <p
          className="text-white/70 font-light leading-relaxed whitespace-pre-line"
          style={{ fontSize: "0.95rem", letterSpacing: "0.02em", lineHeight: 1.9 }}
        >
          {post.content}
        </p>

        <div className="h-px mt-10 mb-6" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Actions */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={!session || liking}
            className="flex items-center gap-2 text-[10px] font-light transition-colors duration-300"
            style={{
              letterSpacing: "0.25em",
              color:   liked ? "rgba(80,165,255,0.90)" : "rgba(255,255,255,0.30)",
              cursor:  session ? "pointer" : "default",
            }}
          >
            ♥ {likeCount}
          </button>
          <Link
            href="/board"
            className="text-white/25 hover:text-white/55 text-[10px] font-light transition-colors duration-300 ml-auto"
            style={{ letterSpacing: "0.28em" }}
          >
            ← BACK
          </Link>
        </div>
      </motion.article>

      {/* Comments */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-16"
      >
        <p className="text-white/22 text-[10px] font-light mb-8" style={{ letterSpacing: "0.42em" }}>
          COMMENTS · {post.comments.length}
        </p>

        <div className="space-y-6 mb-10">
          {post.comments.length === 0 && (
            <p className="text-white/18 text-sm font-light" style={{ letterSpacing: "0.08em" }}>첫 댓글을 남겨보세요.</p>
          )}
          {post.comments.map((c) => (
            <div key={c.id} className="pl-5" style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white/60 text-xs font-light" style={{ letterSpacing: "0.15em" }}>{displayName(c.author)}</span>
                <span className="text-white/18 text-[9px]">{c.createdAt.slice(0, 10)}</span>
                {session?.user?.id === c.author.id && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-white/15 hover:text-red-400/60 text-[11px] font-light transition-colors ml-auto leading-none"
                    title="댓글 삭제"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="text-white/50 text-sm font-light leading-relaxed">{c.content}</p>

              {/* Replies */}
              {c.replies.length > 0 && (
                <div className="mt-4 space-y-4 pl-4" style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                  {c.replies.map((r) => (
                    <div key={r.id}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white/45 text-[10px] font-light" style={{ letterSpacing: "0.12em" }}>{displayName(r.author)}</span>
                        <span className="text-white/15 text-[9px]">{r.createdAt.slice(0, 10)}</span>
                      </div>
                      <p className="text-white/40 text-xs font-light leading-relaxed">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comment form */}
        {session ? (
          <div className="space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={3}
              className="w-full bg-transparent text-white/70 text-sm font-light resize-none outline-none placeholder:text-white/18 px-4 py-3"
              style={{ border: "1px solid rgba(255,255,255,0.08)", letterSpacing: "0.02em", lineHeight: 1.8 }}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleComment(); }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleComment}
                disabled={submitting || !comment.trim()}
                className="px-5 py-2 text-white/50 hover:text-white/85 text-[10px] font-light transition-colors duration-300"
                style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.10)", opacity: submitting || !comment.trim() ? 0.4 : 1 }}
              >
                {submitting ? "POSTING..." : "POST COMMENT"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-white/22 text-xs font-light" style={{ letterSpacing: "0.12em" }}>
            댓글을 남기려면{" "}
            <Link href="/auth/login" className="text-white/45 hover:text-white/70 underline">로그인</Link>
            이 필요합니다.
          </p>
        )}
      </motion.section>
    </div>
  );
}
