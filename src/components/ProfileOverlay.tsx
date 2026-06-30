"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import AstraLoading from "@/components/AstraLoading";

type Tab = "profile" | "connections" | "settings" | "cosmetics";

type EquippedCosmetics = Partial<Record<"BORDER" | "BACKGROUND" | "NICKNAME_COLOR" | "LP_THEME", {
  id: number; name: string; previewColor: string;
}>>;

type ProfileData = {
  id:                string;
  name:              string | null;
  email:             string | null;
  image:             string | null;
  nickname:          string | null;
  handle:            string | null;
  bio:               string | null;
  role:              string;
  points:            number;
  createdAt:         string;
  accounts:          { provider: string; providerAccountId: string }[];
  robloxLink:        { robloxUsername: string; isVerified: boolean } | null;
  guild:             { guild: { name: string; slug: string } } | null;
  _count:            { posts: number };
  equippedCosmetics: EquippedCosmetics;
};

function Corners({ color = "rgba(80,150,255,0.40)", size = 12 }: { color?: string; size?: number }) {
  return (
    <>
      {(["tl", "tr", "bl", "br"] as const).map((p) => {
        const isTop  = p[0] === "t";
        const isLeft = p[1] === "l";
        return (
          <div key={p} style={{
            position: "absolute",
            ...(isTop  ? { top: 0 }    : { bottom: 0 }),
            ...(isLeft ? { left: 0 }   : { right: 0 }),
            width: size, height: size,
            ...(isTop  ? { borderTop:    `1px solid ${color}` } : { borderBottom: `1px solid ${color}` }),
            ...(isLeft ? { borderLeft:   `1px solid ${color}` } : { borderRight:  `1px solid ${color}` }),
          }} />
        );
      })}
    </>
  );
}

const ROLE_LABEL: Record<string, string> = { ADMIN: "ADMIN", MANAGER: "MANAGER", USER: "MEMBER" };
const ROLE_COLOR: Record<string, string> = {
  ADMIN:   "rgba(251,191,36,0.80)",
  MANAGER: "rgba(80,165,255,0.80)",
  USER:    "rgba(255,255,255,0.35)",
};

export default function ProfileOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const [tab,       setTab]       = useState<Tab>("profile");
  const [profile,   setProfile]   = useState<ProfileData | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [saveMsg,         setSaveMsg]         = useState("");
  const [importingAvatar, setImportingAvatar] = useState(false);
  const [importMsg,       setImportMsg]       = useState("");
  const [imgHover,  setImgHover]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState("");
  const [handle,   setHandle]   = useState("");
  const [bio,      setBio]      = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data: ProfileData = await res.json();
        setProfile(data);
        setNickname(data.nickname ?? "");
        setHandle(data.handle   ?? "");
        setBio(data.bio         ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && session) fetchProfile();
  }, [open, session, fetchProfile]);

  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else       { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { if (!open) setTab("profile"); }, [open]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (res.ok) {
          setProfile((p) => p ? { ...p, image: base64 } : p);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleImportDiscordAvatar = async () => {
    setImportingAvatar(true);
    setImportMsg("");
    const res = await fetch("/api/connections/discord/avatar", { method: "POST" });
    const data = await res.json();
    setImportingAvatar(false);
    if (res.ok) {
      setProfile((p) => p ? { ...p, image: data.image } : p);
      setImportMsg("가져왔어요!");
    } else {
      setImportMsg(data.error ?? "오류");
    }
    setTimeout(() => setImportMsg(""), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, handle, bio }),
      });
      if (res.ok) {
        setSaveMsg("SAVED");
        await fetchProfile();
      } else {
        const err = await res.json();
        setSaveMsg(err.error ?? "ERROR");
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2500);
    }
  };

  const isDiscordConnected = profile?.accounts.some((a) => a.provider === "discord") ?? false;
  const isRobloxLinked     = !!profile?.robloxLink;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[70]"
          style={{ background: "#020308" }}
        >
          {/* Header */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 58,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 40px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            zIndex: 12,
            background: "rgba(2,3,11,0.85)",
            backdropFilter: "blur(12px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.35 }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
              </svg>
              <span style={{ color: "white", fontSize: 10, fontWeight: 300, letterSpacing: "0.44em", fontFamily: "var(--font-body, sans-serif)" }}>
                ASTRA / PROFILE
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <a
                href="/profile"
                onClick={onClose}
                style={{
                  color: "rgba(80,165,255,0.55)", fontSize: 10, fontWeight: 300,
                  letterSpacing: "0.28em", fontFamily: "var(--font-body, sans-serif)",
                  textDecoration: "none", transition: "color 0.2s",
                  border: "1px solid rgba(80,165,255,0.18)", padding: "4px 12px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(80,165,255,0.90)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(80,165,255,0.55)")}
              >
                프로필 편집
              </a>
              <button
                onClick={onClose}
                style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, fontWeight: 300, letterSpacing: "0.28em", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body, sans-serif)", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.72)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
              >
                ← CLOSE
              </button>
            </div>
          </div>

          {/* Background stars */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} aria-hidden="true">
            {Array.from({ length: 70 }, (_, i) => {
              const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; const px = x - Math.floor(x);
              const y = Math.sin(i * 311.7 + 127.1) * 43758.5453; const py = y - Math.floor(y);
              const a = Math.sin(i * 53.1 + 17.7)  * 43758.5453; const pa = a - Math.floor(a);
              return (
                <div key={i} style={{
                  position: "absolute",
                  top: `${py * 100}%`, left: `${px * 100}%`,
                  width: 1.5, height: 1.5, borderRadius: "50%",
                  background: `rgba(190,215,255,${0.04 + pa * 0.12})`,
                }} />
              );
            })}
          </div>

          {/* Main content */}
          <div style={{ position: "absolute", top: 58, left: 0, right: 0, bottom: 0, overflowY: "auto", zIndex: 1 }}>
            <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 32px 64px" }}>

              {loading ? (
                <AstraLoading fullScreen={false} />
              ) : profile ? (
                <>
                  {/* Avatar + name row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      onMouseEnter={() => setImgHover(true)}
                      onMouseLeave={() => setImgHover(false)}
                      style={{
                        width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
                        background: "rgba(80,165,255,0.15)",
                        border: `1px solid ${profile?.equippedCosmetics?.BORDER?.previewColor ?? (imgHover ? "rgba(80,165,255,0.60)" : "rgba(80,165,255,0.30)")}`,
                        boxShadow: profile?.equippedCosmetics?.BORDER
                          ? `0 0 ${imgHover ? "24px" : "16px"} ${profile.equippedCosmetics.BORDER.previewColor}`
                          : imgHover ? "0 0 24px rgba(80,165,255,0.25)" : "0 0 20px rgba(80,165,255,0.12)",
                        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", position: "relative", padding: 0,
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                    >
                      {profile.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.image} referrerPolicy="no-referrer" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ color: "rgba(160,210,255,0.88)", fontSize: 22, fontWeight: 300, fontFamily: "var(--font-display, serif)" }}>
                          {(profile.nickname ?? profile.name ?? "?")[0]}
                        </span>
                      )}
                      {imgHover && (
                        <div style={{
                          position: "absolute", inset: 0, borderRadius: "50%",
                          background: "rgba(0,0,0,0.52)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h2 style={{ color: profile.equippedCosmetics?.NICKNAME_COLOR?.previewColor ?? "rgba(225,240,255,0.95)", fontSize: "1.5rem", fontWeight: 300, fontFamily: "var(--font-display, serif)", letterSpacing: "-0.01em", margin: 0 }}>
                          {profile.nickname ?? profile.name ?? "—"}
                        </h2>
                        <span style={{
                          fontSize: 9, fontWeight: 300, padding: "2px 8px",
                          letterSpacing: "0.28em", fontFamily: "var(--font-body, sans-serif)",
                          color: ROLE_COLOR[profile.role] ?? ROLE_COLOR.USER,
                          border: `1px solid ${(ROLE_COLOR[profile.role] ?? ROLE_COLOR.USER).replace("0.80", "0.22")}`,
                        }}>
                          {ROLE_LABEL[profile.role] ?? "MEMBER"}
                        </span>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, letterSpacing: "0.12em", fontFamily: "var(--font-body, sans-serif)", marginTop: 4 }}>
                        {profile.handle ? `@${profile.handle}` : profile.email ?? ""}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: 32, marginBottom: 32 }}>
                    {[
                      ["POINTS",  profile.points.toLocaleString()],
                      ["GUILD",   profile.guild?.guild.name ?? "—"],
                      ["POSTS",   profile._count.posts.toString()],
                      ["JOINED",  profile.createdAt.slice(0, 10)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, letterSpacing: "0.35em", fontFamily: "var(--font-body, sans-serif)", marginBottom: 3 }}>{k}</p>
                        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 300, fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.06em" }}>{v}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 28 }} />

                  {/* Tabs */}
                  <div style={{ display: "flex", marginBottom: 32 }}>
                    {(["profile", "connections", "settings", "cosmetics"] as Tab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                          padding: "10px 20px",
                          fontSize: 10, fontWeight: 300,
                          letterSpacing: "0.32em",
                          textTransform: "uppercase",
                          fontFamily: "var(--font-body, sans-serif)",
                          background: "none", border: "none", cursor: "pointer",
                          transition: "color 0.2s",
                          color: tab === t ? "rgba(215,235,255,0.92)" : "rgba(255,255,255,0.28)",
                          borderBottom: `1px solid ${tab === t ? "rgba(80,165,255,0.55)" : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Tab: Profile (edit) */}
                  {tab === "profile" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      {[
                        { label: "NICKNAME", value: nickname, setter: setNickname, placeholder: "예) Minhyuk", hint: "사이트에서 표시될 이름" },
                        { label: "HANDLE",   value: handle,   setter: setHandle,   placeholder: "예) gram14",  hint: "@뒤에 붙는 고유 아이디" },
                      ].map(({ label, value, setter, placeholder, hint }) => (
                        <div key={label}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 9, letterSpacing: "0.38em", fontFamily: "var(--font-body, sans-serif)", margin: 0 }}>{label}</p>
                            <span style={{ color: "rgba(255,255,255,0.14)", fontSize: 9, fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.12em" }}>{hint}</span>
                          </div>
                          <input
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            placeholder={placeholder}
                            style={{
                              width: "100%", background: "transparent",
                              color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 300,
                              fontFamily: "var(--font-body, sans-serif)",
                              border: "1px solid rgba(255,255,255,0.09)",
                              outline: "none", padding: "10px 14px",
                              letterSpacing: "0.03em", boxSizing: "border-box",
                            }}
                          />
                        </div>
                      ))}

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 9, letterSpacing: "0.38em", fontFamily: "var(--font-body, sans-serif)", margin: 0 }}>BIO</p>
                          <span style={{ color: "rgba(255,255,255,0.14)", fontSize: 9, fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.12em" }}>짧은 자기소개</span>
                        </div>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          placeholder="예) ASTRA 플랫폼 운영자"
                          style={{
                            width: "100%", background: "transparent",
                            color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 300,
                            fontFamily: "var(--font-body, sans-serif)",
                            border: "1px solid rgba(255,255,255,0.09)",
                            outline: "none", padding: "10px 14px",
                            letterSpacing: "0.02em", lineHeight: 1.8,
                            resize: "none", boxSizing: "border-box",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          style={{
                            padding: "10px 24px", fontSize: 10, fontWeight: 300,
                            letterSpacing: "0.32em", fontFamily: "var(--font-body, sans-serif)",
                            color: "rgba(80,165,255,0.90)",
                            border: "1px solid rgba(80,165,255,0.32)",
                            background: "rgba(80,165,255,0.06)",
                            cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.5 : 1,
                            transition: "all 0.2s",
                          }}
                        >
                          {saving ? "SAVING..." : "SAVE CHANGES"}
                        </button>
                        {saveMsg && (
                          <span style={{
                            fontSize: 9, letterSpacing: "0.28em", fontFamily: "var(--font-body, sans-serif)",
                            color: saveMsg === "SAVED" ? "rgba(110,231,183,0.75)" : "rgba(255,100,100,0.75)",
                          }}>
                            {saveMsg}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Tab: Settings */}
                  {tab === "settings" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 4 }}>

                      {/* Account info */}
                      <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, letterSpacing: "0.38em", fontFamily: "var(--font-body, sans-serif)", marginBottom: 12 }}>ACCOUNT</p>
                        {[
                          ["EMAIL",  profile.email ?? "—"],
                          ["ROLE",   ROLE_LABEL[profile.role] ?? "MEMBER"],
                          ["JOINED", profile.createdAt.slice(0, 10)],
                          ["ID",     profile.id.slice(0, 12) + "…"],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, letterSpacing: "0.22em", fontFamily: "var(--font-body, sans-serif)" }}>{k}</span>
                            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, letterSpacing: "0.06em", fontFamily: "var(--font-body, sans-serif)" }}>{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Sign out */}
                      <div style={{ padding: "20px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, letterSpacing: "0.38em", fontFamily: "var(--font-body, sans-serif)", marginBottom: 12 }}>SESSION</p>
                        <button
                          onClick={() => { onClose(); signOut({ callbackUrl: "/auth/login" }); }}
                          style={{
                            padding: "9px 22px", fontSize: 10, fontWeight: 300,
                            letterSpacing: "0.32em", fontFamily: "var(--font-body, sans-serif)",
                            color: "rgba(255,100,100,0.75)",
                            border: "1px solid rgba(255,100,100,0.22)",
                            background: "rgba(255,100,100,0.05)",
                            cursor: "pointer", transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,100,100,0.10)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,100,100,0.05)"; }}
                        >
                          SIGN OUT
                        </button>
                      </div>

                    </motion.div>
                  )}

                  {/* Tab: Cosmetics */}
                  {tab === "cosmetics" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {(["BORDER", "BACKGROUND", "NICKNAME_COLOR", "LP_THEME"] as const).map((type) => {
                          const equipped = profile.equippedCosmetics?.[type];
                          return (
                            <div key={type} style={{ padding: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                              <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 9, letterSpacing: "0.38em", fontFamily: "var(--font-body, sans-serif)", marginBottom: 12 }}>
                                {type.replace("_", " ")}
                              </p>
                              {equipped ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{
                                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                                    background: equipped.previewColor,
                                    boxShadow: `0 0 8px ${equipped.previewColor}`,
                                  }} />
                                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.06em" }}>
                                    {equipped.name}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 11, fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.06em" }}>없음</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, letterSpacing: "0.22em", fontFamily: "var(--font-body, sans-serif)" }}>
                        쇼핑몰에서 아이템을 구매하고 장착하면 프로필에 반영돼요.
                      </p>
                      <a href="/moneylab/shop" style={{
                        display: "inline-block", padding: "9px 20px",
                        fontSize: 9, letterSpacing: "0.32em", fontFamily: "var(--font-body, sans-serif)",
                        color: "rgba(80,165,255,0.65)", border: "1px solid rgba(80,165,255,0.20)",
                        textDecoration: "none", transition: "color 0.2s",
                      }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(80,165,255,0.90)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(80,165,255,0.65)"; }}>
                        SHOP →
                      </a>
                    </motion.div>
                  )}

                  {/* Tab: Connections */}
                  {tab === "connections" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 4 }}>

                      {/* Discord */}
                      <ConnectionRow
                        label="DISCORD"
                        description={isDiscordConnected ? "연동됨" : "연동 안 됨"}
                        connected={isDiscordConnected}
                        onConnect={() => signIn("discord")}
                        extraAction={isDiscordConnected ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {importMsg && (
                              <span style={{ fontSize: 9, letterSpacing: "0.18em", fontFamily: "var(--font-body, sans-serif)", color: importMsg === "가져왔어요!" ? "rgba(110,231,183,0.75)" : "rgba(255,100,100,0.75)" }}>
                                {importMsg}
                              </span>
                            )}
                            <button
                              onClick={handleImportDiscordAvatar}
                              disabled={importingAvatar}
                              style={{
                                padding: "5px 12px", fontSize: 9, fontWeight: 300,
                                letterSpacing: "0.22em", fontFamily: "var(--font-body, sans-serif)",
                                color: "rgba(80,165,255,0.65)",
                                border: "1px solid rgba(80,165,255,0.22)",
                                background: "none", cursor: importingAvatar ? "not-allowed" : "pointer",
                                opacity: importingAvatar ? 0.5 : 1, transition: "color 0.2s",
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(80,165,255,0.90)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(80,165,255,0.65)"; }}
                            >
                              {importingAvatar ? "..." : "아바타 가져오기"}
                            </button>
                          </div>
                        ) : null}
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                          </svg>
                        }
                      />

                      {/* Roblox */}
                      <ConnectionRow
                        label="ROBLOX"
                        description={isRobloxLinked ? profile.robloxLink!.robloxUsername : "연동 안 됨"}
                        connected={isRobloxLinked}
                        verified={profile.robloxLink?.isVerified}
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5.165 1L1 18.835 18.835 23 23 5.165 5.165 1zm9.309 13.456l-4.93-1.32 1.32-4.93 4.93 1.32-1.32 4.93z" />
                          </svg>
                        }
                      />

                    </motion.div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConnectionRow({
  label, description, connected, verified, onConnect, extraAction, icon,
}: {
  label:        string;
  description:  string;
  connected:    boolean;
  verified?:    boolean;
  onConnect?:   () => void;
  extraAction?: React.ReactNode;
  icon:         React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "16px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ position: "relative" }}>
        <div style={{
          width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: connected ? "rgba(80,165,255,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${connected ? "rgba(80,165,255,0.22)" : "rgba(255,255,255,0.07)"}`,
          color: connected ? "rgba(80,165,255,0.80)" : "rgba(255,255,255,0.22)",
        }}>
          {icon}
        </div>
        {connected && (
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: 10, height: 10, borderRadius: "50%",
            background: verified === false ? "rgba(251,191,36,0.85)" : "rgba(110,231,183,0.85)",
            border: "1px solid rgba(2,3,11,1)",
          }} />
        )}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 300, fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.05em", marginBottom: 2 }}>
          {label}
        </p>
        <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, fontFamily: "var(--font-body, sans-serif)", letterSpacing: "0.08em" }}>
          {description}
        </p>
      </div>

      {!connected && onConnect && (
        <button
          onClick={onConnect}
          style={{
            padding: "7px 16px", fontSize: 9, fontWeight: 300,
            letterSpacing: "0.28em", fontFamily: "var(--font-body, sans-serif)",
            color: "rgba(255,255,255,0.45)",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "none", cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.75)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; }}
        >
          CONNECT
        </button>
      )}

      {connected && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {extraAction}
          <span style={{
            fontSize: 9, letterSpacing: "0.28em", fontFamily: "var(--font-body, sans-serif)",
            color: "rgba(110,231,183,0.65)",
          }}>
            CONNECTED
          </span>
        </div>
      )}
    </div>
  );
}
