"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Ann = {
  id: string; category: string; title: string; summary: string;
  content: string; pinned: boolean; authorName: string;
  startsAt: string | null; endsAt: string | null; createdAt: string;
};

const CAT_COLORS: Record<string, string> = {
  NOTICE: "rgba(251,191,36,0.72)", EVENT: "rgba(110,231,183,0.72)", UPDATE: "rgba(80,165,255,0.72)",
};

const BLANK = { title: "", summary: "", content: "", category: "NOTICE", pinned: false, authorName: "ASTRA 운영팀", startsAt: "", endsAt: "" };

export default function AdminDashboard() {
  const router = useRouter();
  const [anns,     setAnns]     = useState<Ann[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState({ ...BLANK });
  const [editing,  setEditing]  = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchAnns = useCallback(() => {
    fetch("/api/admin/announcements")
      .then((r) => { if (r.status === 401) { router.replace("/admin"); return null; } return r.json(); })
      .then((d) => { if (d) setAnns(d); })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchAnns(); }, [fetchAnns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    const body = { ...form, startsAt: form.startsAt || null, endsAt: form.endsAt || null };
    const res = await fetch("/api/admin/announcements", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing, ...body } : body),
    });
    setSaving(false);
    if (res.ok) {
      setMsg(editing ? "수정 완료 · Discord 웹훅은 신규 작성 시에만 전송됩니다." : "게시 완료 · Discord 웹훅이 전송됐어요.");
      setForm({ ...BLANK }); setEditing(null); setShowForm(false); fetchAnns();
    } else {
      const e = await res.json(); setMsg(e.error ?? "오류가 발생했어요.");
    }
    setTimeout(() => setMsg(""), 4000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAnns();
  };

  const startEdit = (a: Ann) => {
    setEditing(a.id);
    setForm({ title: a.title, summary: a.summary, content: a.content, category: a.category,
      pinned: a.pinned, authorName: a.authorName, startsAt: a.startsAt?.slice(0, 10) ?? "", endsAt: a.endsAt?.slice(0, 10) ?? "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
  };

  const inputStyle = { border: "1px solid rgba(255,255,255,0.09)", background: "transparent", color: "rgba(255,255,255,0.75)", letterSpacing: "0.03em", outline: "none" };

  return (
    <div className="min-h-screen px-6 md:px-12 py-10" style={{ background: "#050508" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          <span className="text-white text-[10px] font-light" style={{ letterSpacing: "0.44em" }}>ASTRA / ADMIN</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/admin/nodes")}
            className="text-white/30 hover:text-white/60 text-[9px] font-light transition-colors"
            style={{ letterSpacing: "0.28em" }}>NODES</button>
          <button onClick={() => router.push("/admin/managers")}
            className="text-white/30 hover:text-white/60 text-[9px] font-light transition-colors"
            style={{ letterSpacing: "0.28em" }}>MANAGERS</button>
          <button onClick={() => router.push("/admin/users")}
            className="text-white/30 hover:text-white/60 text-[9px] font-light transition-colors"
            style={{ letterSpacing: "0.28em" }}>USERS</button>
          <button onClick={() => { setEditing(null); setForm({ ...BLANK }); setShowForm(!showForm); }}
            className="text-[10px] font-light px-4 py-2 transition-colors"
            style={{ letterSpacing: "0.28em", color: "rgba(80,165,255,0.80)", border: "1px solid rgba(80,165,255,0.28)" }}>
            {showForm ? "CANCEL" : "+ NEW"}
          </button>
          <button onClick={logout}
            className="text-white/28 hover:text-white/60 text-[10px] font-light transition-colors"
            style={{ letterSpacing: "0.28em" }}>
            SIGN OUT
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 p-6 space-y-4"
          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
          <p className="text-white/35 text-[10px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>
            {editing ? "EDIT ANNOUNCEMENT" : "NEW ANNOUNCEMENT"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>TITLE *</p>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full text-sm font-light px-3 py-2" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>CATEGORY</p>
                <select
                  value={form.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setForm({ ...form, category: cat, ...(cat === "NOTICE" && { startsAt: "", endsAt: "" }) });
                  }}
                  className="w-full text-sm font-light px-3 py-2"
                  style={{ ...inputStyle, background: "#050508" }}>
                  <option value="NOTICE">NOTICE</option>
                  <option value="EVENT">EVENT</option>
                  <option value="UPDATE">UPDATE</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                    className="w-3 h-3" />
                  <span className="text-white/40 text-[9px] font-light" style={{ letterSpacing: "0.28em" }}>PINNED</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>SUMMARY *</p>
            <input required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full text-sm font-light px-3 py-2" style={inputStyle} />
          </div>

          <div>
            <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>CONTENT *</p>
            <textarea required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full text-sm font-light px-3 py-2 resize-none"
              style={{ ...inputStyle, lineHeight: 1.8 }} />
          </div>

          <div className={`grid gap-4 ${form.category === "NOTICE" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
            <div>
              <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>AUTHOR</p>
              <input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                className="w-full text-sm font-light px-3 py-2" style={inputStyle} />
            </div>
            {form.category !== "NOTICE" && (
              <>
                <div>
                  <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>STARTS AT</p>
                  <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="w-full text-sm font-light px-3 py-2" style={{ ...inputStyle, colorScheme: "dark" }} />
                </div>
                <div>
                  <p className="text-white/20 text-[8px] font-light mb-1.5" style={{ letterSpacing: "0.35em" }}>ENDS AT</p>
                  <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    className="w-full text-sm font-light px-3 py-2" style={{ ...inputStyle, colorScheme: "dark" }} />
                </div>
              </>
            )}
          </div>

          {msg && (
            <p className="text-[9px] font-light" style={{ letterSpacing: "0.22em", color: msg.includes("오류") ? "rgba(255,100,100,0.75)" : "rgba(110,231,183,0.75)" }}>
              {msg}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="px-6 py-2 text-[10px] font-light transition-all"
              style={{ letterSpacing: "0.32em", color: "rgba(80,165,255,0.90)", border: "1px solid rgba(80,165,255,0.32)", background: "rgba(80,165,255,0.06)", opacity: saving ? 0.5 : 1 }}>
              {saving ? "POSTING..." : editing ? "SAVE CHANGES" : "PUBLISH"}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm({ ...BLANK }); setShowForm(false); }}
                className="text-white/28 hover:text-white/55 text-[9px] font-light transition-colors"
                style={{ letterSpacing: "0.28em" }}>
                CANCEL EDIT
              </button>
            )}
          </div>
        </form>
      )}

      {/* List */}
      <div>
        <p className="text-white/18 text-[9px] font-light mb-6" style={{ letterSpacing: "0.42em" }}>
          ANNOUNCEMENTS ({anns.length})
        </p>
        {loading ? (
          <p className="text-white/18 text-sm font-light" style={{ letterSpacing: "0.12em" }}>LOADING...</p>
        ) : anns.length === 0 ? (
          <p className="text-white/25 text-sm font-light" style={{ letterSpacing: "0.08em" }}>공지사항이 없어요.</p>
        ) : (
          <div className="space-y-px">
            {anns.map((a) => (
              <div key={a.id} className="flex items-start gap-4 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="shrink-0 text-[8px] font-light px-2 py-0.5 mt-0.5"
                  style={{ letterSpacing: "0.22em", color: CAT_COLORS[a.category], border: `1px solid ${CAT_COLORS[a.category].replace("0.72","0.20")}` }}>
                  {a.category}
                </span>
                {a.pinned && (
                  <span className="shrink-0 text-[7px] font-light px-1.5 py-0.5 mt-0.5"
                    style={{ letterSpacing: "0.22em", color: "rgba(255,255,255,0.30)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    PIN
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 font-light truncate" style={{ fontSize: "0.95rem" }}>{a.title}</p>
                  <p className="text-white/28 text-xs font-light mt-0.5 truncate">{a.summary}</p>
                </div>
                <span className="shrink-0 text-white/18 text-[9px] font-light">{a.createdAt.slice(0, 10)}</span>
                <div className="shrink-0 flex items-center gap-3">
                  <button onClick={() => startEdit(a)}
                    className="text-white/28 hover:text-white/60 text-[9px] font-light transition-colors"
                    style={{ letterSpacing: "0.22em" }}>EDIT</button>
                  <button onClick={() => handleDelete(a.id)}
                    className="text-white/22 hover:text-red-400/70 text-[9px] font-light transition-colors"
                    style={{ letterSpacing: "0.22em" }}>DEL</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
