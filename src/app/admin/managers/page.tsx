"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Manager = {
  id: string; nickname: string | null; handle: string | null;
  name: string | null; email: string | null; image: string | null;
  managerScope: "NOTICE" | "EVENT" | "UPDATE" | null;
};

type UserResult = {
  id: string; nickname: string | null; handle: string | null;
  name: string | null; email: string | null; image: string | null;
  role: string;
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

export default function AdminManagersPage() {
  const router = useRouter();
  const [managers,   setManagers]   = useState<Manager[]>([]);
  const [search,     setSearch]     = useState("");
  const [results,    setResults]    = useState<UserResult[]>([]);
  const [searching,  setSearching]  = useState(false);
  const [assigning,  setAssigning]  = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedScope, setSelectedScope] = useState<"NOTICE" | "EVENT" | "UPDATE">("NOTICE");
  const [msg, setMsg] = useState("");

  const fetchManagers = useCallback(() => {
    fetch("/api/admin/managers")
      .then((r) => { if (r.status === 401) { router.replace("/admin"); return null; } return r.json(); })
      .then((d) => { if (d) setManagers(d); });
  }, [router]);

  useEffect(() => { fetchManagers(); }, [fetchManagers]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}`);
    setSearching(false);
    if (res.ok) setResults(await res.json());
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    setAssigning(true); setMsg("");
    const res = await fetch("/api/admin/managers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedUser.id, managerScope: selectedScope }),
    });
    setAssigning(false);
    if (res.ok) {
      setMsg("관리자로 지정됐어요."); setSelectedUser(null); setSearch(""); setResults([]);
      fetchManagers();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg((d as { error?: string }).error ?? "오류가 발생했어요.");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const handleRemove = async (id: string) => {
    if (!confirm("관리자 권한을 해제할까요?")) return;
    await fetch("/api/admin/managers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchManagers();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
  };

  const inputStyle = {
    border: "1px solid rgba(255,255,255,0.09)",
    background: "transparent",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: "0.03em",
    outline: "none",
  };

  return (
    <div className="min-h-screen px-6 md:px-12 py-10" style={{ background: "#050508" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          <span className="text-white text-[10px] font-light" style={{ letterSpacing: "0.44em" }}>ASTRA / ADMIN / MANAGERS</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/admin/dashboard")}
            className="text-white/30 hover:text-white/60 text-[9px] font-light transition-colors"
            style={{ letterSpacing: "0.28em" }}>DASHBOARD</button>
          <button onClick={() => router.push("/admin/users")}
            className="text-white/30 hover:text-white/60 text-[9px] font-light transition-colors"
            style={{ letterSpacing: "0.28em" }}>USERS</button>
          <button onClick={logout}
            className="text-white/28 hover:text-white/60 text-[10px] font-light transition-colors"
            style={{ letterSpacing: "0.28em" }}>SIGN OUT</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* ─── Assign panel ─── */}
        <div>
          <p className="text-white/20 text-[9px] font-light mb-5" style={{ letterSpacing: "0.42em" }}>관리자 지정</p>

          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="닉네임 / 이메일 검색"
              className="flex-1 text-sm font-light px-3 py-2"
              style={inputStyle}
            />
            <button type="submit" disabled={searching}
              className="px-4 py-2 text-[9px] font-light transition-colors"
              style={{ letterSpacing: "0.28em", color: "rgba(80,165,255,0.80)", border: "1px solid rgba(80,165,255,0.22)" }}>
              {searching ? "..." : "SEARCH"}
            </button>
          </form>

          {results.length > 0 && (
            <div className="mb-4 space-y-px max-h-48 overflow-y-auto">
              {results.map((u) => (
                <button key={u.id} onClick={() => setSelectedUser(u)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  style={{
                    background: selectedUser?.id === u.id ? "rgba(80,165,255,0.07)" : "transparent",
                    border: `1px solid ${selectedUser?.id === u.id ? "rgba(80,165,255,0.22)" : "rgba(255,255,255,0.05)"}`,
                  }}>
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0"
                    style={{ background: "rgba(80,165,255,0.15)" }}>
                    {u.image ? (
                      <img src={u.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/40 text-xs flex items-center justify-center w-full h-full">
                        {(u.nickname ?? u.name ?? "?")[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/75 text-xs font-light truncate">{u.nickname ?? u.name ?? "—"}</p>
                    <p className="text-white/25 text-[9px] truncate">{u.email}</p>
                  </div>
                  <span className="text-[8px] font-light px-1.5 py-0.5"
                    style={{ letterSpacing: "0.18em", color: u.role === "MANAGER" ? "rgba(80,165,255,0.70)" : "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="p-4 space-y-3" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
              <p className="text-white/50 text-xs font-light">
                <span className="text-white/80">{selectedUser.nickname ?? selectedUser.name}</span> 에게 담당 섹션 지정
              </p>
              <div className="flex gap-2">
                {(["NOTICE", "EVENT", "UPDATE"] as const).map((s) => (
                  <button key={s} onClick={() => setSelectedScope(s)}
                    className="flex-1 py-1.5 text-[9px] font-light transition-all"
                    style={{
                      letterSpacing: "0.22em",
                      color: selectedScope === s ? SCOPE_COLORS[s] : "rgba(255,255,255,0.28)",
                      border: `1px solid ${selectedScope === s ? SCOPE_COLORS[s].replace("0.72", "0.35") : "rgba(255,255,255,0.08)"}`,
                      background: selectedScope === s ? SCOPE_COLORS[s].replace("0.72", "0.06") : "transparent",
                    }}>
                    {s}
                  </button>
                ))}
              </div>
              <button onClick={handleAssign} disabled={assigning}
                className="w-full py-2 text-[9px] font-light transition-colors"
                style={{ letterSpacing: "0.32em", color: "rgba(80,165,255,0.85)", border: "1px solid rgba(80,165,255,0.28)", background: "rgba(80,165,255,0.05)", opacity: assigning ? 0.5 : 1 }}>
                {assigning ? "ASSIGNING..." : "ASSIGN MANAGER"}
              </button>
            </div>
          )}

          {msg && (
            <p className="mt-3 text-[9px] font-light" style={{ letterSpacing: "0.2em", color: msg.includes("오류") ? "rgba(255,100,100,0.75)" : "rgba(110,231,183,0.75)" }}>
              {msg}
            </p>
          )}
        </div>

        {/* ─── Current managers list ─── */}
        <div>
          <p className="text-white/20 text-[9px] font-light mb-5" style={{ letterSpacing: "0.42em" }}>
            현재 관리자 ({managers.length})
          </p>
          {managers.length === 0 ? (
            <p className="text-white/18 text-xs font-light" style={{ letterSpacing: "0.1em" }}>지정된 관리자가 없어요.</p>
          ) : (
            <div className="space-y-px">
              {managers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0"
                    style={{ background: "rgba(80,165,255,0.12)" }}>
                    {m.image ? (
                      <img src={m.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/40 text-xs flex items-center justify-center w-full h-full">
                        {(m.nickname ?? m.name ?? "?")[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-xs font-light truncate">{m.nickname ?? m.name ?? "—"}</p>
                    <p className="text-white/25 text-[9px] truncate">{m.email}</p>
                  </div>
                  {m.managerScope && (
                    <span className="shrink-0 text-[8px] font-light px-2 py-0.5"
                      style={{ letterSpacing: "0.20em", color: SCOPE_COLORS[m.managerScope], border: `1px solid ${SCOPE_COLORS[m.managerScope].replace("0.72", "0.22")}` }}>
                      {SCOPE_LABELS[m.managerScope]}
                    </span>
                  )}
                  <button onClick={() => handleRemove(m.id)}
                    className="shrink-0 text-white/22 hover:text-red-400/70 text-[9px] font-light transition-colors"
                    style={{ letterSpacing: "0.18em" }}>
                    해제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
