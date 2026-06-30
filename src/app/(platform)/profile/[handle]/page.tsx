"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import AstraLoading from "@/components/AstraLoading";

type EquippedCosmetics = Partial<Record<"BORDER" | "BACKGROUND" | "NICKNAME_COLOR" | "LP_THEME", {
  id: number; name: string; previewColor: string;
}>>;

type ProfileData = {
  id: string; nickname: string | null; handle: string | null;
  name: string | null; image: string | null; bio: string | null;
  role: string; managerScope: string | null; points: number; createdAt: string;
  guild: { guild: { name: string; slug: string } } | null;
  _count: { posts: number };
  equippedCosmetics: EquippedCosmetics;
  badges?: { key: string; emoji: string; label: string; description: string }[];
};
type Post = { id: string; category: string; title: string; createdAt: string; _count: { likes: number } };
type GuestMessage = {
  id: string; content: string; createdAt: string;
  author: { nickname: string | null; handle: string | null; image: string | null };
};

const ROLE_LABEL: Record<string, string> = { ADMIN: "ADMIN", MANAGER: "MANAGER", USER: "MEMBER" };
const ROLE_COLOR: Record<string, string> = {
  ADMIN: "rgba(251,191,36,0.80)", MANAGER: "rgba(80,165,255,0.80)", USER: "rgba(255,255,255,0.35)",
};
const SCOPE_BADGE: Record<string, { label: string; color: string }> = {
  NOTICE: { label: "공지 담당",      color: "rgba(251,191,36,0.75)" },
  EVENT:  { label: "이벤트 담당",    color: "rgba(110,231,183,0.75)" },
  UPDATE: { label: "업데이트 담당",  color: "rgba(80,165,255,0.75)" },
};

function StarField() {
  const stars = useMemo(() => Array.from({ length: 130 }, (_, i) => ({
    x: ((Math.sin(i * 2.399) + 1) / 2) * 100,
    y: ((Math.cos(i * 1.618) + 1) / 2) * 100,
    size: Math.abs(Math.sin(i * 3.7)) * 0.9 + 0.3,
    opacity: Math.abs(Math.sin(i * 5.1)) * 0.35 + 0.05,
  })), []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.size}px`, height: `${s.size}px`, opacity: s.opacity,
        }} />
      ))}
    </div>
  );
}

type MsgOrb = GuestMessage & { posX: number; posY: number };

function GuestbookCanvas({
  messages, canSend, myPoints, onSend,
}: {
  messages: GuestMessage[];
  canSend: boolean;
  myPoints: number | null;
  onSend: (content: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<MsgOrb | null>(null);
  const [composing, setComposing] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  const orbs: MsgOrb[] = useMemo(() => {
    const canvasH = Math.max(360, messages.length * 110 + 160);
    return messages.map((m, i) => ({
      ...m,
      posX: ((Math.sin(i * 2.7 + 0.8) + 1) / 2) * 78 + 8,
      posY: ((Math.sin(i * 1.4 + 1.2) + 1) / 2) * (canvasH - 120) + 40,
    }));
  }, [messages]);

  const canvasH = Math.max(360, messages.length * 110 + 160);

  const canvasStars = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    x: ((Math.sin(i * 3.1 + 0.5) + 1) / 2) * 100,
    y: ((Math.cos(i * 2.3 + 1.1) + 1) / 2) * 100,
    size: Math.abs(Math.sin(i * 4.9)) * 0.7 + 0.2,
    opacity: Math.abs(Math.sin(i * 6.3)) * 0.3 + 0.04,
  })), []);

  const handleSend = async () => {
    if (!msgInput.trim() || sending) return;
    setSending(true);
    await onSend(msgInput);
    setSending(false);
    setSendMsg("방명록을 남겼어요!");
    setMsgInput("");
    setTimeout(() => { setSendMsg(""); setComposing(false); }, 1800);
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: canvasH, background: "rgba(0,0,4,0.55)" }}>
      {/* Canvas stars */}
      {canvasStars.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white pointer-events-none" style={{
          left: `${s.x}%`, top: `${s.y * canvasH / 100}px`,
          width: `${s.size}px`, height: `${s.size}px`, opacity: s.opacity,
        }} />
      ))}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/18 text-[10px] font-light" style={{ letterSpacing: "0.35em" }}>
            아직 방명록이 없어요.
          </p>
        </div>
      )}

      {/* Message orbs */}
      {orbs.map((orb) => (
        <button key={orb.id}
          onClick={() => setSelected(selected?.id === orb.id ? null : orb)}
          className="absolute group"
          style={{ left: `${orb.posX}%`, top: orb.posY, transform: "translate(-50%, -50%)" }}
        >
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover:scale-150"
              style={{
                background: "rgba(80,165,255,0.75)",
                boxShadow: selected?.id === orb.id
                  ? "0 0 18px 6px rgba(80,165,255,0.55)"
                  : "0 0 8px 2px rgba(80,165,255,0.35)",
              }} />
          </div>
        </button>
      ))}

      {/* Popup */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
            className="absolute z-20 max-w-xs p-4"
            style={{
              left: Math.min(selected.posX, 72) + "%",
              top: selected.posY + 18,
              background: "rgba(5,6,18,0.96)",
              border: "1px solid rgba(80,165,255,0.20)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            <button onClick={() => setSelected(null)}
              className="absolute top-2 right-2 text-white/25 hover:text-white/60 text-xs" style={{ lineHeight: 1 }}>✕</button>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                {selected.author.image
                  ? <img src={selected.author.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                  : <span className="text-white/35 text-[8px]">{(selected.author.nickname ?? "?")[0]}</span>
                }
              </div>
              {selected.author.handle ? (
                <Link href={`/profile/${selected.author.handle}`}
                  className="text-white/55 text-[10px] font-light hover:text-white/90 transition-colors"
                  style={{ letterSpacing: "0.08em" }}>
                  {selected.author.nickname ?? "—"}
                </Link>
              ) : (
                <span className="text-white/55 text-[10px] font-light" style={{ letterSpacing: "0.08em" }}>
                  {selected.author.nickname ?? "—"}
                </span>
              )}
              <span className="text-white/18 text-[9px]">{selected.createdAt.slice(0, 10)}</span>
            </div>
            <p className="text-white/75 text-xs font-light" style={{ letterSpacing: "0.03em", lineHeight: 1.85 }}>
              {selected.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose button */}
      {canSend && (
        <button
          onClick={() => setComposing(true)}
          className="absolute bottom-5 right-5 text-[9px] font-light px-4 py-2 transition-all duration-200 hover:bg-blue-500/10"
          style={{ letterSpacing: "0.28em", color: "rgba(80,165,255,0.75)", border: "1px solid rgba(80,165,255,0.22)" }}
        >
          + 메시지 남기기
        </button>
      )}

      {/* Compose modal overlay */}
      <AnimatePresence>
        {composing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: "rgba(0,0,8,0.82)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setComposing(false); }}>
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="w-full max-w-sm mx-6 p-6"
              style={{ background: "#050610", border: "1px solid rgba(80,165,255,0.18)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/30 text-[9px] font-light" style={{ letterSpacing: "0.38em" }}>LEAVE A MESSAGE</p>
                <p className="text-white/18 text-[9px] font-light" style={{ letterSpacing: "0.2em" }}>
                  10 pts{myPoints !== null ? ` (잔액: ${myPoints})` : ""}
                </p>
              </div>
              <textarea
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value.slice(0, 200))}
                rows={4}
                placeholder="방명록을 남겨보세요..."
                autoFocus
                className="w-full bg-transparent text-white/65 text-sm font-light resize-none outline-none px-3 py-2 mb-3"
                style={{ border: "1px solid rgba(255,255,255,0.08)", letterSpacing: "0.02em", lineHeight: 1.85 }}
              />
              <div className="flex items-center justify-between">
                <span className="text-white/18 text-[9px]" style={{ letterSpacing: "0.15em" }}>{msgInput.length}/200</span>
                <div className="flex items-center gap-3">
                  {sendMsg && (
                    <span className="text-[9px]" style={{ color: "rgba(110,231,183,0.85)", letterSpacing: "0.18em" }}>
                      {sendMsg}
                    </span>
                  )}
                  <button onClick={handleSend} disabled={sending || !msgInput.trim()}
                    className="px-4 py-1.5 text-[9px] font-light transition-colors"
                    style={{
                      letterSpacing: "0.28em", color: "rgba(80,165,255,0.85)",
                      border: "1px solid rgba(80,165,255,0.22)",
                      opacity: sending || !msgInput.trim() ? 0.4 : 1,
                    }}>
                    {sending ? "..." : "SEND"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PublicProfilePage() {
  const { handle } = useParams() as { handle: string };
  const { data: session } = useSession();
  const [tab, setTab] = useState<"posts" | "guestbook">("posts");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [myPoints, setMyPoints] = useState<number | null>(null);

  useEffect(() => {
    const key = `astra_pub_profile_${handle}_v1`;
    const ttl = 60_000;
    const loadFresh = () => {
      fetch(`/api/profile/${handle}`)
        .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
        .then((d: ProfileData | null) => {
          if (!d) return;
          setProfile(d);
          try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
        })
        .finally(() => setLoading(false));
    };
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: ProfileData; ts: number };
        if (Date.now() - ts < ttl) {
          setProfile(data); setLoading(false);
          // silent refresh
          fetch(`/api/profile/${handle}`).then((r) => r.ok ? r.json() : null).then((d: ProfileData | null) => {
            if (!d) return;
            setProfile(d);
            try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
          }).catch(() => {});
          return;
        }
      }
    } catch {}
    loadFresh();
  }, [handle]);

  useEffect(() => {
    if (!profile) return;
    const postsKey = `astra_pub_posts_${profile.id}_v1`;
    const msgKey   = `astra_pub_msgs_${handle}_v1`;
    const ttl = 60_000;
    // posts
    try {
      const raw = sessionStorage.getItem(postsKey);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: Post[]; ts: number };
        if (Date.now() - ts < ttl) { setPosts(data); } else throw new Error();
      } else throw new Error();
    } catch {
      fetch(`/api/posts?userId=${profile.id}`).then((r) => r.ok ? r.json() : { posts: [] }).then((d) => {
        const list = d.posts ?? [];
        setPosts(list);
        try { sessionStorage.setItem(postsKey, JSON.stringify({ data: list, ts: Date.now() })); } catch {}
      });
    }
    // guestbook messages
    try {
      const raw = sessionStorage.getItem(msgKey);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: GuestMessage[]; ts: number };
        if (Date.now() - ts < ttl) { setMessages(data); } else throw new Error();
      } else throw new Error();
    } catch {
      fetch(`/api/profile/${handle}/messages`).then((r) => r.ok ? r.json() : []).then((d) => {
        setMessages(d);
        try { sessionStorage.setItem(msgKey, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
      });
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/profile").then((r) => r.json()).then((d) => setMyPoints(d.points ?? null));
  }, [session?.user?.id]);

  const sendGuestMessage = async (content: string) => {
    const tempId = `opt-${Date.now()}`;
    const optimistic: GuestMessage = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      author: { nickname: session?.user?.name ?? null, handle: null, image: session?.user?.image ?? null },
    };
    // Optimistic: show immediately, deduct points
    setMessages((prev) => [optimistic, ...prev]);
    setMyPoints((p) => p !== null ? p - 10 : null);

    const res = await fetch(`/api/profile/${handle}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const real = await res.json();
      setMessages((prev) => {
        const next = prev.map((m) => m.id === tempId ? real : m);
        try { sessionStorage.removeItem(`astra_pub_msgs_${handle}_v1`); } catch {}
        return next;
      });
    } else {
      // Revert
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMyPoints((p) => p !== null ? p + 10 : null);
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "오류");
    }
  };

  if (loading) return <AstraLoading />;

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <StarField />
      <p className="text-white/35 text-sm font-light relative z-10" style={{ letterSpacing: "0.08em" }}>존재하지 않는 프로필이에요.</p>
      <Link href="/" className="text-white/22 text-[10px] font-light hover:text-white/50 transition-colors relative z-10" style={{ letterSpacing: "0.35em" }}>← HOME</Link>
    </div>
  );

  if (!profile) return null;

  const isOwnProfile = session?.user?.id === profile.id;
  const canSend = !!session?.user?.id && !isOwnProfile;

  return (
    <div className="min-h-screen relative">
      <StarField />

      {/* Banner */}
      <div className="w-full h-32 relative z-10" style={{ background: profile.equippedCosmetics?.BACKGROUND?.previewColor ?? "linear-gradient(135deg, #0d1528, #050508)" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, #050508)" }} />
      </div>

      <div className="px-8 md:px-14 pb-0 relative z-10">
        {/* Avatar + meta */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-end gap-5 -mt-8 mb-8 flex-wrap">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              background: "rgba(80,165,255,0.15)",
              border: `2px solid ${profile.equippedCosmetics?.BORDER?.previewColor ?? "rgba(80,165,255,0.35)"}`,
              boxShadow: `0 0 24px ${profile.equippedCosmetics?.BORDER?.previewColor ?? "rgba(80,165,255,0.18)"}`,
            }}>
            {profile.image
              ? <img src={profile.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
              : <span className="text-white/70 text-xl font-light">{(profile.nickname ?? profile.name ?? "?")[0]}</span>
            }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-light"
                style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.8rem", letterSpacing: "-0.01em", color: profile.equippedCosmetics?.NICKNAME_COLOR?.previewColor ?? "white" }}>
                {profile.nickname ?? profile.name ?? "—"}
              </h1>
              <span className="text-[9px] font-light px-2 py-0.5"
                style={{ letterSpacing: "0.28em", color: ROLE_COLOR[profile.role], border: `1px solid ${ROLE_COLOR[profile.role].replace("0.80", "0.22")}` }}>
                {ROLE_LABEL[profile.role] ?? "MEMBER"}
              </span>
              {profile.role === "MANAGER" && profile.managerScope && SCOPE_BADGE[profile.managerScope] && (
                <span className="text-[9px] font-light px-2 py-0.5"
                  style={{
                    letterSpacing: "0.22em",
                    color: SCOPE_BADGE[profile.managerScope].color,
                    border: `1px solid ${SCOPE_BADGE[profile.managerScope].color.replace("0.75", "0.22")}`,
                  }}>
                  {SCOPE_BADGE[profile.managerScope].label}
                </span>
              )}
              {profile.equippedCosmetics?.LP_THEME && (
                <span className="text-[9px] font-light px-2 py-0.5" style={{
                  letterSpacing: "0.28em",
                  color: profile.equippedCosmetics.LP_THEME.previewColor,
                  border: `1px solid ${profile.equippedCosmetics.LP_THEME.previewColor.replace("0.60", "0.22")}`,
                }}>
                  {profile.equippedCosmetics.LP_THEME.name.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-white/30 text-xs font-light mt-0.5" style={{ letterSpacing: "0.12em" }}>
              {profile.handle ? `@${profile.handle}` : ""}
            </p>
          </div>
          {isOwnProfile && (
            <Link href="/profile"
              className="px-4 py-2 text-[9px] font-light text-white/45 hover:text-white/75 transition-colors shrink-0"
              style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.10)" }}>
              편집
            </Link>
          )}
        </motion.div>

        {profile.bio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="text-white/45 text-sm font-light mb-8 whitespace-pre-line"
            style={{ letterSpacing: "0.04em", lineHeight: 1.9, maxWidth: "36rem" }}>
            {profile.bio}
          </motion.p>
        )}

        {profile.badges && profile.badges.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            className="flex flex-wrap gap-2 mb-8">
            {profile.badges.map((b) => (
              <span key={b.key} title={b.description}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-light"
                style={{ letterSpacing: "0.1em", color: "rgba(210,225,255,0.72)", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)" }}>
                <span>{b.emoji}</span><span>{b.label}</span>
              </span>
            ))}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-8 mb-10 flex-wrap">
          {[
            ["POINTS", profile.points.toLocaleString()],
            ["GUILD",  profile.guild?.guild.name ?? "—"],
            ["POSTS",  profile._count.posts.toString()],
            ["JOINED", profile.createdAt.slice(0, 10)],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-white/18 text-[9px] font-light mb-0.5" style={{ letterSpacing: "0.35em" }}>{k}</p>
              <p className="text-white/65 text-sm font-light" style={{ letterSpacing: "0.08em" }}>{v}</p>
            </div>
          ))}
        </motion.div>

        <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Tabs */}
        <div className="flex gap-0 mb-0">
          {(["posts", "guestbook"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2.5 text-[10px] font-light uppercase transition-all duration-300"
              style={{
                letterSpacing: "0.32em",
                color: tab === t ? "rgba(215,235,255,0.92)" : "rgba(255,255,255,0.28)",
                borderBottom: `1px solid ${tab === t ? "rgba(80,165,255,0.55)" : "rgba(255,255,255,0.07)"}`,
              }}>
              {t === "guestbook" ? "GUESTBOOK" : "POSTS"}
            </button>
          ))}
        </div>
      </div>

      {/* Posts tab (with padding) */}
      {tab === "posts" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-8 md:px-14 py-8 relative z-10 space-y-px">
          {posts.length === 0
            ? <p className="text-white/22 text-sm font-light" style={{ letterSpacing: "0.08em" }}>작성한 글이 없어요.</p>
            : posts.map((p) => (
              <Link key={p.id} href={`/board/${p.id}`} className="group block">
                <div className="flex items-center gap-4 py-4 transition-all duration-300"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingLeft: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.paddingLeft = "8px"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.paddingLeft = "0"; }}>
                  <span className="shrink-0 text-[8px] font-light px-2 py-0.5"
                    style={{ letterSpacing: "0.22em", color: "rgba(80,165,255,0.65)", border: "1px solid rgba(80,165,255,0.18)" }}>
                    {p.category}
                  </span>
                  <span className="flex-1 text-white/75 font-light group-hover:text-white transition-colors truncate" style={{ fontSize: "0.95rem" }}>{p.title}</span>
                  <span className="shrink-0 text-white/18 text-[9px]" style={{ letterSpacing: "0.15em" }}>♥ {p._count.likes}</span>
                  <span className="shrink-0 text-white/18 text-[9px]">{p.createdAt.slice(0, 10)}</span>
                </div>
              </Link>
            ))
          }
        </motion.div>
      )}

      {/* Guestbook tab — full-width cosmos canvas, no side padding */}
      {tab === "guestbook" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 mt-0">
          <GuestbookCanvas
            messages={messages}
            canSend={canSend}
            myPoints={myPoints}
            onSend={sendGuestMessage}
          />
        </motion.div>
      )}
    </div>
  );
}
