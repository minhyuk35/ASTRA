"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import AstraLoading from "@/components/AstraLoading";

type Tab = "posts" | "guestbook" | "connections" | "settings" | "cosmetics";

type EquippedCosmetics = Partial<Record<"BORDER" | "BACKGROUND" | "NICKNAME_COLOR" | "LP_THEME", {
  id: number; name: string; previewColor: string;
}>>;

type ProfileData = {
  id:               string;
  name:             string | null;
  image:            string | null;
  nickname:         string | null;
  handle:           string | null;
  bio:              string | null;
  role:             string;
  points:           number;
  createdAt:        string;
  accounts:         { provider: string }[];
  robloxLink:       { robloxUsername: string; isVerified: boolean } | null;
  guild:            { guild: { name: string; slug: string } } | null;
  _count:           { posts: number };
  equippedCosmetics: EquippedCosmetics;
};

type Post = { id: string; category: string; title: string; createdAt: string; _count: { likes: number } };

type GuestMessage = {
  id: string; content: string; createdAt: string;
  author: { nickname: string | null; handle: string | null; image: string | null };
};

function GuestbookOrbCanvas({ messages }: { messages: GuestMessage[] }) {
  const [selected, setSelected] = useState<(GuestMessage & { posX: number; posY: number }) | null>(null);

  const canvasH = Math.max(360, messages.length * 110 + 160);

  const orbs = useMemo(() => messages.map((m, i) => ({
    ...m,
    posX: ((Math.sin(i * 2.7 + 0.8) + 1) / 2) * 78 + 8,
    posY: ((Math.sin(i * 1.4 + 1.2) + 1) / 2) * (Math.max(360, messages.length * 110 + 160) - 120) + 40,
  })), [messages]);

  const canvasStars = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    x: ((Math.sin(i * 3.1 + 0.5) + 1) / 2) * 100,
    y: ((Math.cos(i * 2.3 + 1.1) + 1) / 2) * 100,
    size: Math.abs(Math.sin(i * 4.9)) * 0.7 + 0.2,
    opacity: Math.abs(Math.sin(i * 6.3)) * 0.3 + 0.04,
  })), []);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: canvasH, background: "rgba(0,0,4,0.55)" }}>
      {canvasStars.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white pointer-events-none" style={{
          left: `${s.x}%`, top: s.y * canvasH / 100,
          width: `${s.size}px`, height: `${s.size}px`, opacity: s.opacity,
        }} />
      ))}

      {messages.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/18 text-[10px] font-light" style={{ letterSpacing: "0.35em" }}>아직 방명록이 없어요.</p>
        </div>
      )}

      {orbs.map((orb) => (
        <button key={orb.id} onClick={() => setSelected(selected?.id === orb.id ? null : orb)}
          className="absolute group" style={{ left: `${orb.posX}%`, top: orb.posY, transform: "translate(-50%, -50%)" }}>
          <div className="w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover:scale-150" style={{
            background: "rgba(80,165,255,0.75)",
            boxShadow: selected?.id === orb.id ? "0 0 18px 6px rgba(80,165,255,0.55)" : "0 0 8px 2px rgba(80,165,255,0.35)",
          }} />
        </button>
      ))}

      <AnimatePresence>
        {selected && (
          <motion.div key={selected.id} initial={{ opacity: 0, scale: 0.92, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.18 }}
            className="absolute z-20 max-w-xs p-4"
            style={{
              left: Math.min(selected.posX, 72) + "%", top: selected.posY + 18,
              background: "rgba(5,6,18,0.96)", border: "1px solid rgba(80,165,255,0.20)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}>
            <button onClick={() => setSelected(null)} className="absolute top-2 right-2 text-white/25 hover:text-white/60 text-xs">✕</button>
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
                  className="text-white/55 text-[10px] font-light hover:text-white/90 transition-colors" style={{ letterSpacing: "0.08em" }}>
                  {selected.author.nickname ?? "—"}
                </Link>
              ) : (
                <span className="text-white/55 text-[10px] font-light" style={{ letterSpacing: "0.08em" }}>{selected.author.nickname ?? "—"}</span>
              )}
              <span className="text-white/18 text-[9px]">{selected.createdAt.slice(0, 10)}</span>
            </div>
            <p className="text-white/75 text-xs font-light" style={{ letterSpacing: "0.03em", lineHeight: 1.85 }}>
              {selected.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = { ADMIN: "ADMIN", MANAGER: "MANAGER", USER: "MEMBER" };
const ROLE_COLOR: Record<string, string> = {
  ADMIN:   "rgba(251,191,36,0.80)",
  MANAGER: "rgba(80,165,255,0.80)",
  USER:    "rgba(255,255,255,0.35)",
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
          width: `${s.size}px`, height: `${s.size}px`,
          opacity: s.opacity,
        }} />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [tab,     setTab]     = useState<Tab>("posts");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [saving,        setSaving]        = useState(false);
  const [saveMsg,       setSaveMsg]       = useState("");
  const [importingAvatar, setImportingAvatar] = useState(false);
  const [importMsg,     setImportMsg]     = useState("");
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [imgHover, setImgHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState("");
  const [handle,   setHandle]   = useState("");
  const [bio,      setBio]      = useState("");

  const userId = session?.user?.id;

  const CACHE_KEY = "astra_profile_v1";
  const CACHE_TTL = 60_000; // 60s

  const applyProfile = (data: ProfileData) => {
    setProfile(data);
    setNickname(data.nickname ?? "");
    setHandle(data.handle   ?? "");
    setBio(data.bio         ?? "");
  };

  useEffect(() => {
    if (!userId) return;

    // Try cache first for instant render
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached) as { data: ProfileData; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          applyProfile(data);
          return;
        }
      }
    } catch {}

    fetch("/api/profile").then((r) => r.json()).then((data: ProfileData) => {
      applyProfile(data);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!profile) return;
    fetch(`/api/posts?userId=${profile.id}`).then((r) => r.ok ? r.json() : { posts: [] }).then((d) => setPosts(d.posts ?? []));
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.handle || tab !== "guestbook") return;
    fetch(`/api/profile/${profile.handle}/messages`)
      .then((r) => r.ok ? r.json() : [])
      .then(setMessages);
  }, [profile?.handle, tab]);

  const bustCache = () => { try { sessionStorage.removeItem(CACHE_KEY); } catch {} };

  const handleImportDiscordAvatar = async () => {
    setImportingAvatar(true);
    setImportMsg("");
    const res = await fetch("/api/connections/discord/avatar", { method: "POST" });
    const data = await res.json();
    setImportingAvatar(false);
    if (res.ok) {
      bustCache();
      setProfile((p) => p ? { ...p, image: data.image } : p);
      setImportMsg("가져왔어요!");
      setNeedsReconnect(false);
    } else {
      setImportMsg(data.error ?? "오류");
      setNeedsReconnect(data.code === "RECONNECT_REQUIRED");
    }
    setTimeout(() => setImportMsg(""), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const base64 = canvas.toDataURL("image/jpeg", 0.82);
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        if (res.ok) { bustCache(); setProfile((p) => p ? { ...p, image: base64 } : p); }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    // Optimistic: snapshot current values for revert
    const prev = { nickname: profile?.nickname ?? null, handle: profile?.handle ?? null, bio: profile?.bio ?? null };
    setProfile((p) => p ? { ...p, nickname, handle, bio } : p);
    setSaveMsg("SAVED");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, handle, bio }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      bustCache();
    } else {
      setProfile((p) => p ? { ...p, ...prev } : p);
      setSaveMsg(data.error ?? "ERROR");
    }
    setTimeout(() => setSaveMsg(""), 2500);
  };

  if (!profile) return <AstraLoading />;

  const isDiscordConnected = profile.accounts.some((a) => a.provider === "discord");
  const isRobloxLinked     = !!profile.robloxLink;

  return (
    <div className="min-h-screen relative">
      <StarField />

      {/* Banner */}
      <div className="w-full h-32 relative z-10" style={{ background: profile?.equippedCosmetics?.BACKGROUND?.previewColor ?? "linear-gradient(135deg, #0d1528, #050508)" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, #050508)" }} />
      </div>

      <div className="px-8 md:px-14 pb-14 relative z-10">
        {/* Avatar + meta */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-end gap-5 -mt-8 mb-8 flex-wrap"
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setImgHover(true)}
            onMouseLeave={() => setImgHover(false)}
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative cursor-pointer"
            style={{
              background: "rgba(80,165,255,0.15)",
              border: `2px solid ${profile?.equippedCosmetics?.BORDER?.previewColor ?? (imgHover ? "rgba(80,165,255,0.65)" : "rgba(80,165,255,0.35)")}`,
              boxShadow: profile?.equippedCosmetics?.BORDER
                ? `0 0 ${imgHover ? "32px" : "20px"} ${profile.equippedCosmetics.BORDER.previewColor}`
                : imgHover ? "0 0 32px rgba(80,165,255,0.30)" : "0 0 24px rgba(80,165,255,0.18)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            {profile.image
              ? <img src={profile.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
              : <span className="text-white/70 text-xl font-light">{(profile.nickname ?? profile.name ?? "?")[0]}</span>
            }
            {imgHover && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.52)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-light" style={{
                fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.8rem", letterSpacing: "-0.01em",
                color: profile.equippedCosmetics?.NICKNAME_COLOR?.previewColor ?? "white",
              }}>
                {profile.nickname ?? profile.name ?? "—"}
              </h1>
              <span className="text-[9px] font-light px-2 py-0.5"
                style={{ letterSpacing: "0.28em", color: ROLE_COLOR[profile.role], border: `1px solid ${ROLE_COLOR[profile.role].replace("0.80", "0.22")}` }}>
                {ROLE_LABEL[profile.role] ?? "MEMBER"}
              </span>
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

          {profile.handle && (
            <Link href={`/profile/${profile.handle}`}
              className="px-4 py-2 text-[9px] font-light text-white/45 hover:text-white/75 transition-colors shrink-0"
              style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.10)" }}>
              구경하기 →
            </Link>
          )}
        </motion.div>

        {/* Bio */}
        {profile.bio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="text-white/45 text-sm font-light mb-8 whitespace-pre-line"
            style={{ letterSpacing: "0.04em", lineHeight: 1.9, maxWidth: "36rem" }}
          >
            {profile.bio}
          </motion.p>
        )}

        {/* Stats */}
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
        <div className="flex gap-0 mb-8 flex-wrap">
          {(["posts", "guestbook", "connections", "settings", "cosmetics"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-2.5 text-[10px] font-light uppercase transition-all duration-300"
              style={{
                letterSpacing: "0.32em",
                color: tab === t ? "rgba(215,235,255,0.92)" : "rgba(255,255,255,0.28)",
                borderBottom: `1px solid ${tab === t ? "rgba(80,165,255,0.55)" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Posts */}
        {tab === "posts" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-px">
            {posts.length === 0
              ? <p className="text-white/22 text-sm font-light" style={{ letterSpacing: "0.08em" }}>작성한 글이 없어요.</p>
              : posts.map((p) => (
                <Link key={p.id} href={`/board/${p.id}`} className="group block">
                  <div className="flex items-center gap-4 py-4 transition-all duration-300"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.paddingLeft = "8px"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.paddingLeft = "0"; }}
                  >
                    <span className="shrink-0 text-[8px] font-light px-2 py-0.5"
                      style={{ letterSpacing: "0.22em", color: "rgba(80,165,255,0.65)", border: "1px solid rgba(80,165,255,0.18)" }}>
                      {p.category}
                    </span>
                    <span className="flex-1 text-white/75 font-light group-hover:text-white transition-colors truncate" style={{ fontSize: "0.95rem" }}>
                      {p.title}
                    </span>
                    <span className="shrink-0 text-white/18 text-[9px]" style={{ letterSpacing: "0.15em" }}>♥ {p._count.likes}</span>
                    <span className="shrink-0 text-white/18 text-[9px]">{p.createdAt.slice(0, 10)}</span>
                  </div>
                </Link>
              ))
            }
          </motion.div>
        )}

        {/* Guestbook — cosmos orb canvas */}
        {tab === "guestbook" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mx-8 md:-mx-14">
            {!profile.handle ? (
              <p className="mx-8 md:mx-14 text-white/22 text-sm font-light" style={{ letterSpacing: "0.08em" }}>
                핸들을 설정하면 방명록을 받을 수 있어요.
              </p>
            ) : (
              <GuestbookOrbCanvas messages={messages} />
            )}
          </motion.div>
        )}

        {/* Connections */}
        {tab === "connections" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-px">
            <div className="flex items-center gap-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{ background: isDiscordConnected ? "rgba(80,165,255,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isDiscordConnected ? "rgba(80,165,255,0.22)" : "rgba(255,255,255,0.07)"}`, color: isDiscordConnected ? "rgba(80,165,255,0.80)" : "rgba(255,255,255,0.22)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white/75 text-xs font-light mb-0.5" style={{ letterSpacing: "0.08em" }}>DISCORD</p>
                <p className="text-white/28 text-[10px] font-light" style={{ letterSpacing: "0.08em" }}>{isDiscordConnected ? "연동됨" : "연동 안 됨"}</p>
              </div>
              {isDiscordConnected ? (
                <div className="flex items-center gap-3">
                  {importMsg && (
                    <span className="text-[9px] font-light" style={{ letterSpacing: "0.18em", color: importMsg === "가져왔어요!" ? "rgba(110,231,183,0.75)" : "rgba(255,100,100,0.75)" }}>
                      {importMsg}
                    </span>
                  )}
                  {needsReconnect ? (
                    <button
                      onClick={() => signIn("discord")}
                      className="px-3 py-1.5 text-[9px] font-light transition-colors"
                      style={{ letterSpacing: "0.22em", border: "1px solid rgba(255,100,100,0.30)", color: "rgba(255,140,140,0.85)" }}>
                      재연동
                    </button>
                  ) : (
                    <button
                      onClick={handleImportDiscordAvatar}
                      disabled={importingAvatar}
                      className="px-3 py-1.5 text-[9px] font-light transition-colors"
                      style={{ letterSpacing: "0.22em", border: "1px solid rgba(80,165,255,0.22)", color: "rgba(80,165,255,0.65)", opacity: importingAvatar ? 0.5 : 1 }}>
                      {importingAvatar ? "..." : "아바타 가져오기"}
                    </button>
                  )}
                  <span className="text-[9px] font-light" style={{ letterSpacing: "0.28em", color: "rgba(110,231,183,0.65)" }}>CONNECTED</span>
                </div>
              ) : (
                <button onClick={() => signIn("discord")} className="px-4 py-1.5 text-[9px] font-light text-white/45 hover:text-white/75 transition-colors" style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.10)" }}>CONNECT</button>
              )}
            </div>

            <div className="flex items-center gap-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{ background: isRobloxLinked ? "rgba(80,165,255,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isRobloxLinked ? "rgba(80,165,255,0.22)" : "rgba(255,255,255,0.07)"}`, color: isRobloxLinked ? "rgba(80,165,255,0.80)" : "rgba(255,255,255,0.22)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.165 1L1 18.835 18.835 23 23 5.165 5.165 1zm9.309 13.456l-4.93-1.32 1.32-4.93 4.93 1.32-1.32 4.93z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white/75 text-xs font-light mb-0.5" style={{ letterSpacing: "0.08em" }}>ROBLOX</p>
                <p className="text-white/28 text-[10px] font-light" style={{ letterSpacing: "0.08em" }}>
                  {isRobloxLinked ? profile.robloxLink!.robloxUsername : "연동 안 됨"}
                </p>
              </div>
              {isRobloxLinked
                ? <span className="text-[9px] font-light" style={{ letterSpacing: "0.28em", color: profile.robloxLink!.isVerified ? "rgba(110,231,183,0.65)" : "rgba(251,191,36,0.65)" }}>
                    {profile.robloxLink!.isVerified ? "VERIFIED" : "PENDING"}
                  </span>
                : <button className="px-4 py-1.5 text-[9px] font-light text-white/45 hover:text-white/75 transition-colors" style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.10)" }}>LINK</button>
              }
            </div>
          </motion.div>
        )}

        {/* Settings */}
        {tab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/22 text-[9px] font-light" style={{ letterSpacing: "0.38em" }}>NICKNAME</p>
                <p className="text-white/18 text-[9px] font-light" style={{ letterSpacing: "0.2em" }}>
                  {profile.nickname === null ? "최초 설정 무료" : "변경 시 50 pts 소모"}
                </p>
              </div>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-transparent text-white/65 text-sm font-light outline-none px-4 py-3"
                style={{ border: "1px solid rgba(255,255,255,0.08)", letterSpacing: "0.04em" }} />
            </div>
            <div>
              <p className="text-white/22 text-[9px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>HANDLE</p>
              <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-transparent text-white/65 text-sm font-light outline-none px-4 py-3"
                style={{ border: "1px solid rgba(255,255,255,0.08)", letterSpacing: "0.04em" }} />
            </div>
            <div>
              <p className="text-white/22 text-[9px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>BIO</p>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                className="w-full bg-transparent text-white/65 text-sm font-light resize-none outline-none px-4 py-3"
                style={{ border: "1px solid rgba(255,255,255,0.08)", letterSpacing: "0.02em", lineHeight: 1.8 }} />
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-[10px] font-light transition-colors"
                style={{ letterSpacing: "0.32em", border: "1px solid rgba(80,165,255,0.35)", background: "rgba(80,165,255,0.06)", color: "rgba(80,165,255,0.90)", opacity: saving ? 0.5 : 1 }}>
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </button>
              {saveMsg && (
                <span className="text-[9px] font-light" style={{ letterSpacing: "0.28em", color: saveMsg === "SAVED" ? "rgba(110,231,183,0.75)" : "rgba(255,100,100,0.75)" }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Cosmetics */}
        {tab === "cosmetics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
            <div className="grid grid-cols-2 gap-3 mb-8">
              {(["BORDER", "BACKGROUND", "NICKNAME_COLOR", "LP_THEME"] as const).map((type) => {
                const equipped = profile.equippedCosmetics?.[type];
                return (
                  <div key={type} className="p-4" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[9px] font-light mb-3" style={{ letterSpacing: "0.38em", color: "rgba(255,255,255,0.22)" }}>
                      {type.replace("_", " ")}
                    </p>
                    {equipped ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full shrink-0" style={{
                          background: equipped.previewColor,
                          boxShadow: `0 0 8px ${equipped.previewColor}`,
                        }} />
                        <span className="text-xs font-light" style={{ letterSpacing: "0.06em", color: "rgba(255,255,255,0.65)" }}>
                          {equipped.name}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs font-light" style={{ letterSpacing: "0.06em", color: "rgba(255,255,255,0.22)" }}>없음</p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-white/18 text-[9px] font-light mb-4" style={{ letterSpacing: "0.22em" }}>
              쇼핑몰에서 아이템을 구매하고 장착하면 프로필에 반영돼요.
            </p>
            <Link href="/moneylab/shop"
              className="inline-block text-[9px] font-light transition-colors"
              style={{ letterSpacing: "0.32em", color: "rgba(80,165,255,0.65)", border: "1px solid rgba(80,165,255,0.20)", padding: "9px 20px" }}>
              SHOP →
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
