"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { type ItemType } from "@/lib/shop-items";

type DRole = {
  itemOrder: number; name: string; roleId: string; sitePrice: number;
  description: string; owned: boolean; pending: boolean;
};

type ShopItem = {
  id: number; name: string; type: ItemType;
  price: number; previewColor: string;
  owned: boolean; equipped: boolean;
};

const TYPE_LABELS: Record<ItemType, string> = {
  BORDER:         "Profile Border",
  BACKGROUND:     "Profile Background",
  NICKNAME_COLOR: "Nickname Color",
  LP_THEME:       "LP Theme",
};

const FILTERS = ["ALL", "BORDER", "BACKGROUND", "NICKNAME_COLOR", "LP_THEME"] as const;

export default function ShopPage() {
  const [filter,  setFilter]  = useState<typeof FILTERS[number]>("ALL");
  const [items,   setItems]   = useState<ShopItem[]>([]);
  const [points,  setPoints]  = useState<number | null>(null);
  const [busy,    setBusy]    = useState<number | null>(null);
  const [msg,     setMsg]     = useState<{ id: number; text: string; ok: boolean } | null>(null);
  const [confirm, setConfirm] = useState<ShopItem | null>(null);

  // 디스코드 서버 역할
  const [drLinked, setDrLinked] = useState<boolean | null>(null);
  const [dRoles,   setDRoles]   = useState<DRole[]>([]);
  const [drBusy,   setDrBusy]   = useState<string | null>(null);
  const [drMsg,    setDrMsg]    = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const fetchItems = () =>
    fetch("/api/shop").then((r) => r.ok ? r.json() : []).then(setItems);

  const fetchDiscordRoles = () =>
    fetch("/api/shop/discord-roles").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      setDrLinked(!!d.linked);
      setDRoles(d.items ?? []);
    }).catch(() => {});

  const refreshBalance = () =>
    fetch("/api/profile").then((r) => r.ok ? r.json() : null).then((d) => { if (d) setPoints(d.points); });

  useEffect(() => {
    fetchItems();
    fetchDiscordRoles();
    refreshBalance();
  }, []);

  const buyDiscordRole = async (role: DRole) => {
    if (drBusy) return;
    setDrBusy(role.roleId);
    const res = await fetch("/api/shop/discord-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId: role.roleId }),
    });
    const data = await res.json();
    setDrBusy(null);
    if (res.ok) {
      setDrMsg({ id: role.roleId, text: "구매 완료! 디스코드에서 곧 지급돼요.", ok: true });
      fetchDiscordRoles();
      refreshBalance();
    } else {
      setDrMsg({ id: role.roleId, text: data.error ?? "오류", ok: false });
    }
    setTimeout(() => setDrMsg(null), 3000);
  };

  const showMsg = (id: number, text: string, ok: boolean) => {
    setMsg({ id, text, ok });
    setTimeout(() => setMsg(null), 2800);
  };

  const executeBuy = async (item: ShopItem) => {
    setConfirm(null);
    if (busy) return;
    setBusy(item.id);
    const res = await fetch("/api/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });
    const data = await res.json();
    setBusy(null);
    if (res.ok) {
      setPoints(data.points);
      fetchItems();
      showMsg(item.id, "구매 완료!", true);
    } else {
      showMsg(item.id, data.error ?? "오류", false);
    }
  };

  const handleBuy = (item: ShopItem) => setConfirm(item);

  const handleEquip = async (item: ShopItem) => {
    if (busy) return;
    setBusy(item.id);
    const res = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, equipped: !item.equipped }),
    });
    setBusy(null);
    if (res.ok) {
      fetchItems();
      showMsg(item.id, item.equipped ? "해제됨" : "장착 완료!", true);
    }
  };

  const filtered = filter === "ALL" ? items : items.filter((i) => i.type === filter);

  return (
    <div className="min-h-screen px-8 md:px-14 py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-14"
      >
        <div className="flex items-center gap-2 text-white/22 text-[10px] font-light mb-3" style={{ letterSpacing: "0.3em" }}>
          <Link href="/moneylab" className="hover:text-white/50 transition-colors">MONEYLAB</Link>
          <span>/</span>
          <span className="text-white/45">SHOP</span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-white font-light leading-none"
            style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "clamp(2.4rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}>
            Dress your<br />node.
          </h1>
          <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-light"
            style={{ letterSpacing: "0.28em", color: "rgba(110,231,183,0.75)", border: "1px solid rgba(110,231,183,0.18)" }}>
            <span>BALANCE</span>
            <span className="text-white/60">{points !== null ? `${points.toLocaleString()} pts` : "—"}</span>
          </div>
        </div>
        <div className="mt-8 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </motion.div>

      {/* Type filters */}
      <div className="flex gap-1 mb-10 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-[9px] font-light transition-all duration-200"
            style={{
              letterSpacing: "0.28em",
              color: filter === f ? "rgba(210,235,255,0.95)" : "rgba(255,255,255,0.28)",
              borderBottom: `1px solid ${filter === f ? "rgba(80,165,255,0.55)" : "transparent"}`,
            }}>
            {f === "ALL" ? "ALL" : TYPE_LABELS[f as ItemType].toUpperCase()}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-px"
        style={{ background: "rgba(255,255,255,0.05)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
      >
        {filtered.map((item) => (
          <div key={item.id} className="p-5" style={{ background: "#050508" }}>
            {/* Preview */}
            <div className="w-full aspect-square rounded-sm mb-4 flex items-center justify-center relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              {item.type === "BORDER" && (
                <div className="w-12 h-12 rounded-full"
                  style={{ border: `2px solid ${item.previewColor}`, boxShadow: `0 0 16px ${item.previewColor}` }} />
              )}
              {item.type === "BACKGROUND" && (
                <div className="absolute inset-0" style={{ background: item.previewColor }} />
              )}
              {item.type === "NICKNAME_COLOR" && (
                <span className="text-sm font-light" style={{ color: item.previewColor, letterSpacing: "0.15em" }}>USERNAME</span>
              )}
              {item.type === "LP_THEME" && (
                <div className="w-10 h-10 rounded-full"
                  style={{ background: item.previewColor, boxShadow: `0 0 24px ${item.previewColor}` }} />
              )}
              {item.equipped && (
                <span className="absolute top-2 right-2 text-[7px] font-light px-1.5 py-0.5"
                  style={{ letterSpacing: "0.25em", color: "rgba(110,231,183,0.85)", background: "rgba(0,0,0,0.65)" }}>
                  ON
                </span>
              )}
            </div>

            <p className="text-white/70 text-xs font-light mb-0.5" style={{ letterSpacing: "0.08em" }}>{item.name}</p>
            <p className="text-white/22 text-[9px] font-light mb-3" style={{ letterSpacing: "0.18em" }}>
              {TYPE_LABELS[item.type]}
            </p>

            {msg?.id === item.id && (
              <p className="text-[9px] font-light mb-2" style={{
                letterSpacing: "0.18em",
                color: msg.ok ? "rgba(110,231,183,0.80)" : "rgba(255,100,100,0.75)",
              }}>
                {msg.text}
              </p>
            )}

            <button
              onClick={() => item.owned || item.equipped ? handleEquip(item) : handleBuy(item)}
              disabled={busy === item.id}
              className="w-full py-1.5 text-[9px] font-light transition-colors duration-200"
              style={{
                letterSpacing: "0.28em",
                color: item.owned || item.equipped ? "rgba(110,231,183,0.65)" : "rgba(255,255,255,0.40)",
                border: `1px solid ${item.owned || item.equipped ? "rgba(110,231,183,0.18)" : "rgba(255,255,255,0.07)"}`,
                opacity: busy === item.id ? 0.5 : 1,
              }}>
              {item.equipped ? "UNEQUIP" : item.owned ? "EQUIP" : `${item.price} pts`}
            </button>
          </div>
        ))}
      </motion.div>

      {/* Discord server roles */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <p className="text-white/30 text-[10px] font-light" style={{ letterSpacing: "0.4em" }}>🎭 DISCORD SERVER ROLES</p>
          <span className="text-white/18 text-[9px] font-light" style={{ letterSpacing: "0.16em" }}>사이트 포인트로 구매 · 디스코드에 자동 지급</span>
        </div>

        {drLinked === false ? (
          <div className="p-10 text-center" style={{ background: "#050508", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white/55 text-sm font-light mb-2">디스코드 연동이 필요합니다</p>
            <p className="text-white/25 text-[10px] font-light mb-6" style={{ letterSpacing: "0.15em" }}>
              역할은 연동된 디스코드 계정으로 지급돼요.
            </p>
            <button onClick={() => signIn("discord")}
              className="px-6 py-2.5 text-[10px] font-light transition-colors"
              style={{ letterSpacing: "0.28em", color: "rgba(120,150,255,0.9)", border: "1px solid rgba(120,150,255,0.3)", background: "rgba(120,150,255,0.06)" }}>
              디스코드 연동하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
            {dRoles.map((role) => {
              const disabled = role.owned || role.pending || drBusy === role.roleId;
              return (
                <div key={role.roleId} className="p-5 flex flex-col" style={{ background: "#050508" }}>
                  <p className="text-white/80 text-[13px] font-light mb-1 break-words" style={{ letterSpacing: "0.02em" }}>{role.name}</p>
                  <p className="text-white/25 text-[9px] font-light mb-3" style={{ letterSpacing: "0.15em" }}>{role.description || "디스코드 역할"}</p>
                  {drMsg?.id === role.roleId && (
                    <p className="text-[9px] font-light mb-2" style={{ letterSpacing: "0.15em", color: drMsg.ok ? "rgba(110,231,183,0.8)" : "rgba(255,100,100,0.75)" }}>{drMsg.text}</p>
                  )}
                  <button onClick={() => buyDiscordRole(role)} disabled={disabled}
                    className="mt-auto w-full py-1.5 text-[9px] font-light transition-colors"
                    style={{
                      letterSpacing: "0.24em",
                      color: role.owned ? "rgba(110,231,183,0.6)" : role.pending ? "rgba(251,191,36,0.75)" : "rgba(255,255,255,0.45)",
                      border: `1px solid ${role.owned ? "rgba(110,231,183,0.18)" : "rgba(255,255,255,0.08)"}`,
                      opacity: drBusy === role.roleId ? 0.5 : 1,
                    }}>
                    {role.owned ? "보유함" : role.pending ? "지급 대기" : `${role.sitePrice.toLocaleString()} pts`}
                  </button>
                </div>
              );
            })}
            {drLinked && dRoles.length === 0 && (
              <div className="p-8 col-span-full text-center text-white/25 text-[10px] font-light" style={{ background: "#050508", letterSpacing: "0.15em" }}>
                등록된 역할이 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Purchase confirm modal */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] flex items-center justify-center"
            style={{ background: "rgba(0,0,8,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xs mx-6 p-8"
              style={{ background: "#06070f", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Preview */}
              <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {confirm.type === "BORDER" && (
                  <div className="w-8 h-8 rounded-full" style={{ border: `2px solid ${confirm.previewColor}`, boxShadow: `0 0 12px ${confirm.previewColor}` }} />
                )}
                {confirm.type === "BACKGROUND" && (
                  <div className="absolute inset-0" style={{ background: confirm.previewColor, borderRadius: 2 }} />
                )}
                {confirm.type === "NICKNAME_COLOR" && (
                  <span className="text-[11px] font-light" style={{ color: confirm.previewColor, letterSpacing: "0.12em" }}>NAME</span>
                )}
                {confirm.type === "LP_THEME" && (
                  <div className="w-8 h-8 rounded-full" style={{ background: confirm.previewColor, boxShadow: `0 0 16px ${confirm.previewColor}` }} />
                )}
              </div>

              {/* Item info */}
              <div className="text-center mb-6">
                <p className="text-white/75 text-sm font-light mb-1" style={{ letterSpacing: "0.06em" }}>{confirm.name}</p>
                <p className="text-white/28 text-[9px] font-light mb-4" style={{ letterSpacing: "0.22em" }}>{TYPE_LABELS[confirm.type]}</p>
                <div className="h-px mb-4" style={{ background: "rgba(255,255,255,0.05)" }} />
                <p className="text-[10px] font-light mb-1" style={{ letterSpacing: "0.22em", color: "rgba(255,255,255,0.35)" }}>
                  구매하시겠습니까?
                </p>
                <p className="text-[9px] font-light" style={{ letterSpacing: "0.18em", color: "rgba(80,165,255,0.65)" }}>
                  {confirm.price.toLocaleString()} pts 소모
                  {points !== null && (
                    <span style={{ color: "rgba(255,255,255,0.22)" }}>
                      {" "}· 잔액 {(points - confirm.price).toLocaleString()} pts
                    </span>
                  )}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirm(null)}
                  className="flex-1 py-2.5 text-[9px] font-light transition-colors"
                  style={{ letterSpacing: "0.28em", color: "rgba(255,255,255,0.30)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.30)")}
                >
                  취소
                </button>
                <button
                  onClick={() => executeBuy(confirm)}
                  className="flex-1 py-2.5 text-[9px] font-light transition-all"
                  style={{ letterSpacing: "0.28em", color: "rgba(80,165,255,0.90)", border: "1px solid rgba(80,165,255,0.30)", background: "rgba(80,165,255,0.06)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(80,165,255,0.12)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(80,165,255,0.06)"; }}
                >
                  구매하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
