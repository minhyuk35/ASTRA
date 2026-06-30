"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import AstraLoading from "@/components/AstraLoading";

type GuildMember = {
  id: string; role: string; joinedAt: string;
  user: { id: string; nickname: string | null; handle: string | null; name: string | null; image: string | null; points: number };
};
type GuildData = {
  id: string; name: string; slug: string; description: string | null;
  level: number; xp: number; xpMax: number; capacity: number;
  bannerColor: string; createdAt: string; memberCount: number;
  members: GuildMember[];
  userRole: string | null;
  userInAnyGuild: boolean;
};
type ChatMsg = {
  id: string; content: string; createdAt: string;
  author: { id: string; nickname: string | null; name: string | null; image: string | null };
};

const ROLE_COLORS: Record<string, string> = {
  LEADER:    "rgba(251,191,36,0.75)",
  SUBLEADER: "rgba(80,165,255,0.75)",
  MEMBER:    "rgba(255,255,255,0.30)",
};

export default function GuildDetailPage() {
  const { slug } = useParams() as { slug: string };
  const { data: session } = useSession();
  const [guild,    setGuild]    = useState<GuildData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"overview" | "members" | "chat">("overview");
  const [chat,     setChat]     = useState<ChatMsg[]>([]);
  const [message,  setMessage]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [donateAmt,    setDonateAmt]    = useState("");
  const [status,       setStatus]       = useState("");
  const [inviteNick,   setInviteNick]   = useState("");
  const [inviting,     setInviting]     = useState(false);
  const [requested,    setRequested]    = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isMember   = guild?.members.some((m) => m.user.id === session?.user?.id) ?? false;
  const canInvite  = guild?.userRole === "LEADER" || guild?.userRole === "SUBLEADER";

  const fetchGuild = useCallback(async (silent = false) => {
    const key = `astra_guild_${slug}_v1`;
    const ttl = 30_000;
    if (!silent) {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const { data, ts } = JSON.parse(raw) as { data: GuildData; ts: number };
          if (Date.now() - ts < ttl) {
            setGuild(data);
            // still refresh silently
            fetch(`/api/guilds/${slug}`).then((r) => r.ok ? r.json() : null).then((d) => {
              if (!d) return;
              setGuild(d);
              try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
            }).catch(() => {});
            return;
          }
        }
      } catch {}
    }
    const res = await fetch(`/api/guilds/${slug}`);
    if (res.ok) {
      const d: GuildData = await res.json();
      setGuild(d);
      try { sessionStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
    }
  }, [slug]);

  const fetchChat = useCallback(async () => {
    if (tab !== "chat" || !isMember) return;
    const res = await fetch(`/api/guilds/${slug}/chat`);
    if (res.ok) setChat(await res.json());
  }, [slug, tab, isMember]);

  useEffect(() => { fetchGuild().finally(() => setLoading(false)); }, [fetchGuild]);

  useEffect(() => {
    if (tab !== "chat") return;
    fetchChat();
    const id = setInterval(fetchChat, 4000);
    return () => clearInterval(id);
  }, [tab, fetchChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendChat = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/guilds/${slug}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    if (res.ok) {
      setMessage("");
      fetchChat();
    }
    setSending(false);
  };

  const sendJoinRequest = async () => {
    if (requested) return;
    setRequested(true);
    const res = await fetch(`/api/guilds/${slug}/join`, { method: "POST" });
    if (res.ok) {
      setStatus("신청이 전송됐어요.");
    } else {
      const e = await res.json();
      setStatus(e.error ?? "오류가 발생했어요.");
      setRequested(false);
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const checkAttendance = async () => {
    const res = await fetch(`/api/guilds/${slug}/attend`, { method: "POST" });
    if (res.ok) {
      setStatus("+10 포인트 획득!");
      try { sessionStorage.removeItem(`astra_guild_${slug}_v1`); } catch {}
      fetchGuild(true);
    }
    else {
      const e = await res.json();
      setStatus(e.error === "Already attended today" ? "이미 출석했어요." : (e.error ?? "오류"));
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const sendInvite = async () => {
    if (!inviteNick.trim() || inviting) return;
    setInviting(true);
    const res = await fetch(`/api/guilds/${slug}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: inviteNick }),
    });
    setInviting(false);
    if (res.ok) { setStatus(`${inviteNick}님에게 초대를 보냈어요.`); setInviteNick(""); }
    else {
      const e = await res.json();
      setStatus(e.error === "User not found" ? "해당 닉네임 유저가 없어요." : (e.error ?? "오류가 발생했어요."));
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const donate = async () => {
    if (!donateAmt) return;
    const res = await fetch(`/api/guilds/${slug}/donate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(donateAmt) }),
    });
    if (res.ok) {
      setStatus(`${donateAmt} 포인트 기부 완료!`); setDonateAmt("");
      try { sessionStorage.removeItem(`astra_guild_${slug}_v1`); } catch {}
      fetchGuild(true);
    }
    else {
      const e = await res.json();
      setStatus(e.error ?? "오류");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  if (loading) return <AstraLoading />;

  if (!guild) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/35 text-sm font-light">Guild not found.</p>
    </div>
  );

  const xpPct = (guild.xp / guild.xpMax) * 100;

  return (
    <div className="min-h-screen px-8 md:px-14 py-14">
      <div className="flex items-center gap-2 text-white/22 text-[10px] font-light mb-8" style={{ letterSpacing: "0.3em" }}>
        <Link href="/guilds" className="hover:text-white/50 transition-colors">GUILDS</Link>
        <span>/</span>
        <span className="text-white/45">{guild.name}</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }} className="mb-12">
        <div className="h-0.5 mb-6 rounded-full" style={{ background: guild.bannerColor, opacity: 0.7 }} />
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-white font-light leading-none mb-2"
              style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2.8rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}>
              {guild.name}
            </h1>
            <p className="text-white/35 text-sm font-light" style={{ letterSpacing: "0.08em" }}>
              {guild.description ?? ""}
            </p>
          </div>
          {!isMember && !guild.userInAnyGuild && (
            <div className="flex flex-col items-end gap-2">
              <button onClick={sendJoinRequest} disabled={requested}
                className="px-5 py-2.5 text-[10px] font-light transition-all duration-300"
                style={{ letterSpacing: "0.28em", border: "1px solid rgba(80,165,255,0.35)", background: "rgba(80,165,255,0.06)",
                  color: requested ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.55)",
                  opacity: requested ? 0.6 : 1, cursor: requested ? "not-allowed" : "pointer" }}>
                {requested ? "REQUESTED" : "JOIN REQUEST"}
              </button>
              {status && <p className="text-[9px] font-light" style={{ letterSpacing: "0.18em", color: "rgba(110,231,183,0.75)" }}>{status}</p>}
            </div>
          )}
          {!isMember && guild.userInAnyGuild && (
            <span className="text-[9px] font-light text-white/28" style={{ letterSpacing: "0.22em" }}>
              이미 다른 길드에 소속되어 있어요.
            </span>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-[9px] font-light text-white/22 mb-2" style={{ letterSpacing: "0.28em" }}>
            <span>LV.{guild.level}</span>
            <span>{guild.xp.toLocaleString()} / {guild.xpMax.toLocaleString()} XP</span>
          </div>
          <div className="h-px rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="h-full rounded-full" style={{ background: "rgba(80,165,255,0.65)" }} />
          </div>
        </div>

        <div className="flex gap-8 mt-6 text-white/22 text-[9px] font-light" style={{ letterSpacing: "0.28em" }}>
          {[["MEMBERS", `${guild.memberCount}/${guild.capacity}`], ["FOUNDED", guild.createdAt.slice(0, 10)]].map(([k, v]) => (
            <div key={k}><span>{k}</span><p className="text-white/55 mt-0.5 text-[10px]">{v}</p></div>
          ))}
        </div>
        <div className="mt-8 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8">
        {(["overview", "members", "chat"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2.5 text-[10px] font-light transition-all duration-300 uppercase"
            style={{ letterSpacing: "0.32em",
              color: tab === t ? "rgba(215,235,255,0.92)" : "rgba(255,255,255,0.28)",
              borderBottom: `1px solid ${tab === t ? "rgba(80,165,255,0.55)" : "rgba(255,255,255,0.07)"}` }}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {status && isMember && (
            <p className="text-[10px] font-light" style={{ letterSpacing: "0.22em", color: "rgba(110,231,183,0.80)" }}>{status}</p>
          )}
          {isMember && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="p-6" style={{ background: "#050508" }}>
                <p className="text-white/22 text-[9px] font-light mb-1" style={{ letterSpacing: "0.38em" }}>DONATE POINTS</p>
                <p className="text-white/50 text-sm font-light mb-4">포인트를 기부해 길드 경험치를 올리세요</p>
                <div className="flex items-center gap-3">
                  <input value={donateAmt} onChange={(e) => setDonateAmt(e.target.value)} type="number" min="1"
                    placeholder="포인트 수량" className="w-28 bg-transparent text-white/65 text-sm font-light outline-none px-3 py-1.5"
                    style={{ border: "1px solid rgba(255,255,255,0.09)", letterSpacing: "0.03em" }} />
                  <button onClick={donate}
                    className="text-[10px] font-light px-4 py-1.5 text-white/40 hover:text-white/80 transition-colors"
                    style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.08)" }}>
                    DONATE
                  </button>
                </div>
              </div>
              <div className="p-6" style={{ background: "#050508" }}>
                <p className="text-white/22 text-[9px] font-light mb-1" style={{ letterSpacing: "0.38em" }}>ATTENDANCE</p>
                <p className="text-white/50 text-sm font-light mb-4">오늘의 길드 출석을 체크하세요 (+10 pts)</p>
                <button onClick={checkAttendance}
                  className="text-[10px] font-light px-4 py-1.5 text-white/40 hover:text-white/80 transition-colors"
                  style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.08)" }}>
                  CHECK IN
                </button>
              </div>
            </div>
          )}
          {canInvite && (
            <div className="p-6" style={{ background: "#050508", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-white/22 text-[9px] font-light mb-1" style={{ letterSpacing: "0.38em" }}>INVITE MEMBER</p>
              <p className="text-white/50 text-sm font-light mb-4">닉네임으로 멤버를 초대하세요</p>
              <div className="flex items-center gap-3">
                <input value={inviteNick} onChange={(e) => setInviteNick(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendInvite(); }}
                  placeholder="닉네임 또는 이름"
                  className="flex-1 bg-transparent text-white/65 text-sm font-light outline-none px-3 py-1.5"
                  style={{ border: "1px solid rgba(255,255,255,0.09)", letterSpacing: "0.03em" }} />
                <button onClick={sendInvite} disabled={inviting}
                  className="text-[10px] font-light px-4 py-1.5 transition-colors"
                  style={{ letterSpacing: "0.28em", color: "rgba(110,231,183,0.80)", border: "1px solid rgba(110,231,183,0.22)", opacity: inviting ? 0.5 : 1 }}>
                  INVITE
                </button>
              </div>
            </div>
          )}
          {!isMember && (
            <p className="text-white/28 text-sm font-light" style={{ letterSpacing: "0.05em" }}>
              길드에 가입하면 출석, 기부 등의 기능을 이용할 수 있어요.
            </p>
          )}
        </motion.div>
      )}

      {/* Members */}
      {tab === "members" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-px" style={{ background: "rgba(255,255,255,0.04)" }}>
          {guild.members.map((m) => {
            const inner = (
              <div className="flex items-center gap-5 px-5 py-4 transition-colors duration-200" style={{ background: "#050508" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  {m.user.image
                    ? <img src={m.user.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    : <span className="text-white/40 text-[10px]">{(m.user.nickname ?? m.user.name ?? "?")[0]}</span>
                  }
                </div>
                <span className="flex-1 text-white/70 text-sm font-light group-hover:text-white/90 transition-colors" style={{ letterSpacing: "0.06em" }}>
                  {m.user.nickname ?? m.user.name ?? "—"}
                </span>
                <span className="text-[9px] font-light" style={{ letterSpacing: "0.28em", color: ROLE_COLORS[m.role] ?? ROLE_COLORS.MEMBER }}>
                  {m.role.replace("_", " ")}
                </span>
                <span className="text-white/22 text-[9px] font-light" style={{ letterSpacing: "0.2em" }}>
                  {m.user.points.toLocaleString()} pts
                </span>
              </div>
            );
            return m.user.handle
              ? <Link key={m.id} href={`/profile/${m.user.handle}`} className="group block">{inner}</Link>
              : <div key={m.id}>{inner}</div>;
          })}
        </motion.div>
      )}

      {/* Chat */}
      {tab === "chat" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!isMember ? (
            <p className="text-white/28 text-sm font-light" style={{ letterSpacing: "0.05em" }}>
              채팅은 길드 멤버만 이용할 수 있어요.
            </p>
          ) : (
            <>
              <div className="space-y-4 mb-6 h-[360px] overflow-y-auto pr-2">
                {chat.length === 0 && (
                  <p className="text-white/18 text-sm font-light" style={{ letterSpacing: "0.08em" }}>
                    아직 메시지가 없어요. 첫 메시지를 남겨보세요!
                  </p>
                )}
                {chat.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.07)" }}>
                      {msg.author.image
                        ? <img src={msg.author.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                        : <span className="text-white/40 text-[9px]">{(msg.author.nickname ?? msg.author.name ?? "?")[0]}</span>
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white/55 text-xs font-light" style={{ letterSpacing: "0.1em" }}>
                          {msg.author.nickname ?? msg.author.name ?? "—"}
                        </span>
                        <span className="text-white/18 text-[9px]">
                          {new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-white/65 text-sm font-light">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-3">
                <input value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="메시지를 입력하세요... (Enter로 전송)"
                  className="flex-1 bg-transparent text-white/70 text-sm font-light outline-none placeholder:text-white/18 px-4 py-2.5"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", letterSpacing: "0.02em" }} />
                <button onClick={sendChat} disabled={sending}
                  className="px-5 py-2.5 text-white/45 hover:text-white/80 text-[10px] font-light transition-colors"
                  style={{ letterSpacing: "0.28em", border: "1px solid rgba(255,255,255,0.08)", opacity: sending ? 0.5 : 1 }}>
                  SEND
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
