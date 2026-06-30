"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  nickname: string | null;
  handle: string | null;
  role: "ADMIN" | "MANAGER" | "USER";
  points: number;
  createdAt: string;
  image: string | null;
  guild: { guild: { name: string } } | null;
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:   "rgba(80,165,255,0.75)",
  MANAGER: "rgba(110,231,183,0.75)",
  USER:    "rgba(255,255,255,0.35)",
};

const inputStyle = {
  border: "1px solid rgba(255,255,255,0.09)",
  background: "transparent",
  color: "rgba(255,255,255,0.75)",
  letterSpacing: "0.03em",
  outline: "none",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [form,    setForm]    = useState({ role: "USER", points: 0, nickname: "", handle: "", bio: "" });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (roleFilter) params.set("role", roleFilter);
    fetch(`/api/admin/users?${params}`)
      .then((r) => { if (r.status === 401) { router.replace("/admin"); return null; } return r.json(); })
      .then((d) => { if (d) setUsers(d); })
      .finally(() => setLoading(false));
  }, [q, roleFilter, router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ role: u.role, points: u.points, nickname: u.nickname ?? "", handle: u.handle ?? "", bio: "" });
    setMsg("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, ...form }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("저장 완료");
      setEditing(null);
      fetchUsers();
    } else {
      const d = await res.json();
      setMsg(d.error ?? "오류가 발생했어요.");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const displayName = (u: User) => u.nickname ?? u.handle ?? u.name ?? "—";

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
  };

  return (
    <div className="min-h-screen px-6 md:px-12 py-10" style={{ background: "#050508" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <span className="text-white text-[10px] font-light" style={{ letterSpacing: "0.44em" }}>ASTRA / ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin/dashboard")}
              className="text-white/30 hover:text-white/60 text-[9px] font-light transition-colors"
              style={{ letterSpacing: "0.28em" }}>DASHBOARD</button>
            <span className="text-white/55 text-[10px] font-light" style={{ letterSpacing: "0.28em" }}>USERS</span>
          </div>
        </div>
        <button onClick={logout}
          className="text-white/28 hover:text-white/60 text-[10px] font-light transition-colors"
          style={{ letterSpacing: "0.28em" }}>
          SIGN OUT
        </button>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(5,5,8,0.88)" }}>
          <form onSubmit={handleSave} className="w-full max-w-md p-7 space-y-5"
            style={{ border: "1px solid rgba(255,255,255,0.09)", background: "#050508" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-white/35 text-[10px] font-light" style={{ letterSpacing: "0.38em" }}>EDIT USER</p>
              <button type="button" onClick={() => setEditing(null)}
                className="text-white/25 hover:text-white/55 text-[9px] font-light transition-colors"
                style={{ letterSpacing: "0.22em" }}>✕ CLOSE</button>
            </div>

            <div>
              <p className="text-white/50 text-sm font-light truncate">{displayName(editing)}</p>
              <p className="text-white/22 text-[9px] font-light mt-0.5">{editing.email}</p>
            </div>

            <div>
              <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>ROLE</p>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full text-sm font-light px-3 py-2"
                style={{ ...inputStyle, background: "#050508" }}>
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>NICKNAME</p>
              <input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="없음"
                className="w-full text-sm font-light px-3 py-2" style={inputStyle} />
            </div>

            <div>
              <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>HANDLE</p>
              <input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })}
                placeholder="없음"
                className="w-full text-sm font-light px-3 py-2" style={inputStyle} />
            </div>

            <div>
              <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>POINTS</p>
              <input type="number" min={0} value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                className="w-full text-sm font-light px-3 py-2" style={inputStyle} />
            </div>

            {msg && (
              <p className="text-[9px] font-light" style={{
                letterSpacing: "0.22em",
                color: msg.includes("오류") || msg.includes("이미") ? "rgba(255,100,100,0.75)" : "rgba(110,231,183,0.75)",
              }}>{msg}</p>
            )}

            <div className="flex items-center gap-4 pt-1">
              <button type="submit" disabled={saving}
                className="px-6 py-2 text-[10px] font-light transition-all"
                style={{ letterSpacing: "0.32em", color: "rgba(80,165,255,0.90)", border: "1px solid rgba(80,165,255,0.32)", background: "rgba(80,165,255,0.06)", opacity: saving ? 0.5 : 1 }}>
                {saving ? "SAVING..." : "SAVE"}
              </button>
              <button type="button" onClick={() => setEditing(null)}
                className="text-white/28 hover:text-white/55 text-[9px] font-light transition-colors"
                style={{ letterSpacing: "0.28em" }}>CANCEL</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="닉네임, 핸들, 이메일 검색..."
          className="flex-1 text-sm font-light px-4 py-2.5" style={inputStyle}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm font-light px-4 py-2.5"
          style={{ ...inputStyle, background: "#050508", minWidth: "140px" }}>
          <option value="">ALL ROLES</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MANAGER">MANAGER</option>
          <option value="USER">USER</option>
        </select>
      </div>

      {/* Table */}
      <div>
        <p className="text-white/18 text-[9px] font-light mb-5" style={{ letterSpacing: "0.42em" }}>
          USERS ({users.length})
        </p>

        {loading ? (
          <p className="text-white/18 text-sm font-light" style={{ letterSpacing: "0.12em" }}>LOADING...</p>
        ) : users.length === 0 ? (
          <p className="text-white/25 text-sm font-light">검색 결과가 없어요.</p>
        ) : (
          <div className="space-y-px">
            {/* column header */}
            <div className="hidden md:grid grid-cols-[1fr_1fr_120px_80px_80px_60px] gap-4 pb-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["NAME / HANDLE", "EMAIL", "ROLE", "POINTS", "GUILD", ""].map((h) => (
                <span key={h} className="text-white/18 text-[8px] font-light" style={{ letterSpacing: "0.32em" }}>{h}</span>
              ))}
            </div>

            {users.map((u) => (
              <div key={u.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_80px_80px_60px] gap-2 md:gap-4 py-4 items-center"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {/* name */}
                <div className="flex items-center gap-3 min-w-0">
                  {u.image ? (
                    <img src={u.image} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" style={{ opacity: 0.85 }} />
                  ) : (
                    <div className="w-7 h-7 rounded-full shrink-0" style={{ background: "rgba(80,165,255,0.20)" }} />
                  )}
                  <div className="min-w-0">
                    <p className="text-white/75 font-light text-sm truncate">{displayName(u)}</p>
                    {u.handle && <p className="text-white/25 text-[10px] font-light">@{u.handle}</p>}
                  </div>
                </div>

                {/* email */}
                <p className="text-white/30 text-xs font-light truncate">{u.email ?? "—"}</p>

                {/* role */}
                <span className="text-[9px] font-light px-2 py-0.5 w-fit"
                  style={{ letterSpacing: "0.22em", color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role].replace("0.75", "0.20")}` }}>
                  {u.role}
                </span>

                {/* points */}
                <p className="text-white/45 text-xs font-light">{u.points.toLocaleString()}</p>

                {/* guild */}
                <p className="text-white/25 text-xs font-light truncate">{u.guild?.guild.name ?? "—"}</p>

                {/* action */}
                <button onClick={() => openEdit(u)}
                  className="text-white/28 hover:text-white/65 text-[9px] font-light transition-colors"
                  style={{ letterSpacing: "0.22em" }}>EDIT</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && !editing && (
        <p className="fixed bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-light px-4 py-2"
          style={{ letterSpacing: "0.22em", color: "rgba(110,231,183,0.9)", border: "1px solid rgba(110,231,183,0.25)", background: "#050508" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
