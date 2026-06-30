"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import AstraLoading from "@/components/AstraLoading";

type MessageType = "ANNOUNCEMENT" | "GUILD_INVITATION" | "JOIN_REQUEST" | "SYSTEM";
type Msg = {
  id: string;
  type: MessageType;
  title: string;
  preview: string;
  read: boolean;
  createdAt: string;
  guildId: string | null;
  announcementId: string | null;
  sender: { nickname: string | null; name: string | null } | null;
};

const PAGE_SIZE = 6;

const TYPE_ICONS: Record<MessageType, string> = {
  GUILD_INVITATION: "INV",
  ANNOUNCEMENT: "ANN",
  JOIN_REQUEST: "REQ",
  SYSTEM: "SYS",
};

const TYPE_COLORS: Record<MessageType, string> = {
  GUILD_INVITATION: "rgba(110,231,183,0.75)",
  ANNOUNCEMENT: "rgba(251,191,36,0.75)",
  JOIN_REQUEST: "rgba(80,165,255,0.75)",
  SYSTEM: "rgba(255,255,255,0.34)",
};

const stagger = { show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "NOW";
  if (m < 60) return `${m}M`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}H`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}D`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

function senderName(msg: Msg) {
  return msg.sender?.nickname ?? msg.sender?.name ?? "ASTRA";
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const top = pos[0] === "t";
  const left = pos[1] === "l";
  return (
    <div
      style={{
        position: "absolute",
        [top ? "top" : "bottom"]: 0,
        [left ? "left" : "right"]: 0,
        width: 18,
        height: 18,
        [`border${top ? "Top" : "Bottom"}`]: "1px solid rgba(95,175,255,0.62)",
        [`border${left ? "Left" : "Right"}`]: "1px solid rgba(95,175,255,0.62)",
      }}
    />
  );
}

function ActionModal({
  msg,
  busy,
  onClose,
  onAction,
}: {
  msg: Msg;
  busy: boolean;
  onClose: () => void;
  onAction: (action: "accept" | "reject") => void;
}) {
  const isInvite = msg.type === "GUILD_INVITATION";
  const acceptLabel = isInvite ? "ACCEPT INVITE" : "APPROVE REQUEST";
  const rejectLabel = isInvite ? "DECLINE INVITE" : "REJECT REQUEST";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[90]"
        style={{
          background: "rgba(0,0,0,0.68)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[91] flex items-center justify-center px-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl pointer-events-auto overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(3, 7, 19, 0.98), rgba(1, 4, 13, 0.97))",
            border: "1px solid rgba(80,160,255,0.28)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.72), 0 0 55px rgba(40,120,255,0.12)",
          }}
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="h-px origin-left"
            style={{ background: "linear-gradient(to right, transparent, rgba(95,180,255,0.78), transparent)" }}
          />
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />

          <div className="p-7 md:p-10">
            <div className="flex items-center justify-between gap-5 mb-7">
              <span className="text-[10px] font-light" style={{ color: "rgba(90,165,255,0.62)", letterSpacing: "0.42em" }}>
                MESSENGER / {TYPE_ICONS[msg.type]}
              </span>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white/65 text-[10px] font-light transition-colors"
                style={{ letterSpacing: "0.28em" }}
              >
                ESC
              </button>
            </div>

            <h2
              className="text-white font-light leading-tight mb-5"
              style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2rem, 5vw, 3.7rem)" }}
            >
              {msg.title}
            </h2>

            <div className="h-px mb-5" style={{ background: "rgba(70,145,255,0.16)" }} />

            <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-x-4 gap-y-3 mb-7">
              <span className="text-[10px] font-light" style={{ color: "rgba(90,165,255,0.46)", letterSpacing: "0.34em" }}>
                FROM
              </span>
              <span className="text-white/62 text-xs font-light" style={{ letterSpacing: "0.06em" }}>
                {senderName(msg)}
              </span>
              <span className="text-[10px] font-light" style={{ color: "rgba(90,165,255,0.46)", letterSpacing: "0.34em" }}>
                TIME
              </span>
              <span className="text-white/62 text-xs font-light" style={{ letterSpacing: "0.06em" }}>
                {timeAgo(msg.createdAt)}
              </span>
            </div>

            <p className="text-white/52 text-sm font-light mb-8" style={{ lineHeight: 1.9, letterSpacing: "0.03em" }}>
              {msg.preview}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-5" style={{ borderTop: "1px solid rgba(70,145,255,0.12)" }}>
              <button
                onClick={() => onAction("reject")}
                disabled={busy}
                className="px-5 py-2.5 text-[10px] font-light transition-colors disabled:opacity-40"
                style={{ letterSpacing: "0.26em", color: "rgba(255,255,255,0.42)", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                {rejectLabel}
              </button>
              <button
                onClick={() => onAction("accept")}
                disabled={busy}
                className="px-5 py-2.5 text-[10px] font-light transition-colors disabled:opacity-40"
                style={{
                  letterSpacing: "0.26em",
                  color: "rgba(110,231,183,0.86)",
                  border: "1px solid rgba(110,231,183,0.28)",
                  background: "rgba(110,231,183,0.06)",
                }}
              >
                {acceptLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

const MSG_CACHE_KEY = "astra_messenger_v1";
const MSG_CACHE_TTL = 30_000;

export default function MessengerPage() {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Msg | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const unread = msgs.filter((m) => !m.read).length;
  const pageCount = Math.max(1, Math.ceil(msgs.length / PAGE_SIZE));

  const visibleMsgs = useMemo(
    () => msgs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [msgs, page],
  );

  const applyMsgs = (d: Msg[]) => {
    setMsgs(d);
    setPage((cur) => Math.min(cur, Math.max(0, Math.ceil(d.length / PAGE_SIZE) - 1)));
  };

  const bustMsgCache = () => { try { sessionStorage.removeItem(MSG_CACHE_KEY); } catch {} };

  const fetchMsgs = useCallback((bustCache = false) => {
    if (bustCache) bustMsgCache();
    fetch("/api/messenger")
      .then((r) => r.json())
      .then((d: Msg[]) => {
        if (!Array.isArray(d)) return;
        applyMsgs(d);
        try { sessionStorage.setItem(MSG_CACHE_KEY, JSON.stringify({ data: d, ts: Date.now() })); } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Show cache instantly, then refresh in background
    try {
      const cached = sessionStorage.getItem(MSG_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached) as { data: Msg[]; ts: number };
        if (Date.now() - ts < MSG_CACHE_TTL) {
          applyMsgs(data);
          setLoading(false);
          return;
        }
      }
    } catch {}
    fetchMsgs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/messenger/${id}/read`, { method: "POST" });
    setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const markAllRead = async () => {
    await fetch("/api/messenger", { method: "PATCH" });
    setMsgs((prev) => prev.map((m) => ({ ...m, read: true })));
  };

  const deleteMessage = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/messenger/${id}`, { method: "DELETE" });
    setBusyId(null);
    setSelected(null);
    fetchMsgs(true);
  };

  const deleteAllMessages = async () => {
    setBusyId("all");
    await fetch("/api/messenger", { method: "DELETE" });
    setBusyId(null);
    setSelected(null);
    fetchMsgs(true);
  };

  const openMessage = (msg: Msg) => {
    if (!msg.read) void markRead(msg.id);
    if (msg.type === "ANNOUNCEMENT") {
      if (msg.announcementId) {
        router.push(`/announcements/${msg.announcementId}`);
      } else {
        router.push("/announcements");
      }
    } else if (msg.type === "GUILD_INVITATION" || msg.type === "JOIN_REQUEST") {
      setSelected({ ...msg, read: true });
    }
  };

  const handleAction = async (action: "accept" | "reject") => {
    if (!selected) return;
    setBusyId(selected.id);
    await fetch(`/api/messenger/${selected.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    setSelected(null);
    fetchMsgs(true);
  };

  return (
    <div className="h-[calc(100vh-5rem)] overflow-hidden px-6 md:px-14 py-8 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="shrink-0"
      >
        <p className="text-white/25 text-[10px] font-light mb-3" style={{ letterSpacing: "0.45em" }}>
          04 - MESSENGER
        </p>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex items-end gap-4">
            <h1
              className="text-white font-light leading-none"
              style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2.2rem, 5vw, 4.3rem)" }}
            >
              Private<br />signals.
            </h1>
            {unread > 0 && (
              <span
                className="mb-1 text-[9px] font-light px-2.5 py-1"
                style={{
                  letterSpacing: "0.28em",
                  color: "rgba(80,165,255,0.85)",
                  border: "1px solid rgba(80,165,255,0.28)",
                  background: "rgba(80,165,255,0.07)",
                }}
              >
                {unread} UNREAD
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={markAllRead}
              disabled={msgs.length === 0 || unread === 0}
              className="px-4 py-2 text-[9px] font-light transition-colors disabled:opacity-30"
              style={{ letterSpacing: "0.26em", color: "rgba(215,235,255,0.72)", border: "1px solid rgba(80,165,255,0.22)" }}
            >
              READ ALL
            </button>
            <button
              onClick={deleteAllMessages}
              disabled={msgs.length === 0 || busyId === "all"}
              className="px-4 py-2 text-[9px] font-light transition-colors disabled:opacity-30"
              style={{ letterSpacing: "0.26em", color: "rgba(255,255,255,0.46)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              DELETE ALL
            </button>
          </div>
        </div>
        <div className="mt-6 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </motion.div>

      <div className="flex-1 min-h-0 py-5">
        {loading ? (
          <AstraLoading fullScreen={false} />
        ) : msgs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/18 text-sm font-light" style={{ letterSpacing: "0.12em" }}>
              No messages.
            </p>
          </div>
        ) : (
          <motion.div key={page} className="h-full flex flex-col justify-start space-y-px" variants={stagger} initial="hidden" animate="show">
            {visibleMsgs.map((msg) => (
              <motion.div key={msg.id} variants={fadeUp}>
                <div
                  className="group grid grid-cols-[10px_38px_minmax(0,1fr)_auto] items-start gap-3 md:gap-4 py-3.5 transition-all duration-300 cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: msg.read ? 0.56 : 1 }}
                  onClick={() => openMessage(msg)}
                >
                  <div
                    className="mt-2 w-1.5 h-1.5 rounded-full"
                    style={{ background: msg.read ? "transparent" : "rgba(80,165,255,0.80)" }}
                  />
                  <span className="text-[9px] mt-0.5 font-light" style={{ color: TYPE_COLORS[msg.type], letterSpacing: "0.18em" }}>
                    {TYPE_ICONS[msg.type]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white/85 font-light truncate" style={{ fontSize: "0.95rem" }}>
                      {msg.title}
                    </p>
                    <p className="text-white/30 text-xs font-light truncate mt-1" style={{ letterSpacing: "0.03em" }}>
                      {msg.preview}
                    </p>
                    <p className="text-white/18 text-[9px] font-light mt-1" style={{ letterSpacing: "0.14em" }}>
                      FROM {senderName(msg)}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="hidden sm:inline text-white/18 text-[9px] font-light" style={{ letterSpacing: "0.15em" }}>
                      {timeAgo(msg.createdAt)}
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        void deleteMessage(msg.id);
                      }}
                      disabled={busyId === msg.id}
                      className="px-3 py-1.5 text-[9px] font-light transition-colors disabled:opacity-30"
                      style={{ letterSpacing: "0.22em", color: "rgba(255,255,255,0.34)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <div className="shrink-0 flex items-center justify-between gap-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || msgs.length === 0}
          className="px-4 py-2 text-[9px] font-light transition-colors disabled:opacity-25"
          style={{ letterSpacing: "0.26em", color: "rgba(215,235,255,0.62)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          PREV
        </button>
        <span className="text-white/24 text-[9px] font-light" style={{ letterSpacing: "0.28em" }}>
          {msgs.length === 0 ? "PAGE 0 / 0" : `PAGE ${page + 1} / ${pageCount}`}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={page >= pageCount - 1 || msgs.length === 0}
          className="px-4 py-2 text-[9px] font-light transition-colors disabled:opacity-25"
          style={{ letterSpacing: "0.26em", color: "rgba(215,235,255,0.62)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          NEXT
        </button>
      </div>

      <AnimatePresence>
        {selected && (
          <ActionModal
            msg={selected}
            busy={busyId === selected.id}
            onClose={() => setSelected(null)}
            onAction={handleAction}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
