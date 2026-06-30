"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const PLANET_NAMES: Record<number, string> = {
  1: "Mercury", 2: "Venus", 3: "Earth", 4: "Mars",
  5: "Jupiter", 6: "Saturn", 7: "Uranus", 8: "Neptune",
};

type Node = {
  id: string; planetId: number; title: string; role: string;
  year: string; stack: string; desc: string; url: string | null; angle: number;
};

const BLANK = { planetId: 1, title: "", role: "", year: "", stack: "", desc: "", url: "" };

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.09)", background: "transparent",
  color: "rgba(255,255,255,0.75)", letterSpacing: "0.03em", outline: "none",
};

export default function AdminNodesPage() {
  const router = useRouter();
  const [nodes,    setNodes]    = useState<Node[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState({ ...BLANK });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchNodes = useCallback(() => {
    fetch("/api/admin/planet-nodes")
      .then((r) => { if (r.status === 401) { router.replace("/admin"); return null; } return r.json(); })
      .then((d) => { if (d) setNodes(d); })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/planet-nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("노드가 추가되었어요. 위치는 자동으로 배치됩니다.");
      setForm({ ...BLANK }); setShowForm(false); fetchNodes();
    } else {
      const e = await res.json(); setMsg(e.error ?? "오류가 발생했어요.");
    }
    setTimeout(() => setMsg(""), 4000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 노드를 삭제할까요?")) return;
    await fetch("/api/admin/planet-nodes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNodes();
  };

  const grouped = Object.entries(PLANET_NAMES).map(([id, name]) => ({
    id: Number(id), name,
    nodes: nodes.filter((n) => n.planetId === Number(id)),
  }));

  return (
    <div className="min-h-screen px-6 md:px-12 py-10" style={{ background: "#050508" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          <span className="text-white text-[10px] font-light" style={{ letterSpacing: "0.44em" }}>ASTRA / NODES</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/admin/dashboard")}
            className="text-white/30 hover:text-white/60 text-[9px] font-light transition-colors"
            style={{ letterSpacing: "0.28em" }}>DASHBOARD</button>
          <button onClick={() => { setForm({ ...BLANK }); setShowForm(!showForm); }}
            className="text-[10px] font-light px-4 py-2 transition-colors"
            style={{ letterSpacing: "0.28em", color: "rgba(80,165,255,0.80)", border: "1px solid rgba(80,165,255,0.28)" }}>
            {showForm ? "CANCEL" : "+ ADD NODE"}
          </button>
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <div className="mb-6 px-4 py-3 text-[11px] font-light"
          style={{ border: "1px solid rgba(80,165,255,0.22)", color: "rgba(80,165,255,0.85)", letterSpacing: "0.06em" }}>
          {msg}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 p-6 space-y-4"
          style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <p className="text-white/30 text-[9px] font-light mb-5" style={{ letterSpacing: "0.38em" }}>NEW NODE</p>

          {/* Planet selector */}
          <div>
            <p className="text-white/22 text-[9px] font-light mb-2" style={{ letterSpacing: "0.34em" }}>PLANET</p>
            <select
              value={form.planetId}
              onChange={(e) => setForm({ ...form, planetId: Number(e.target.value) })}
              className="w-full text-sm font-light px-4 py-3"
              style={{ ...inputStyle, appearance: "none" }}
            >
              {Object.entries(PLANET_NAMES).map(([id, name]) => (
                <option key={id} value={id} style={{ background: "#050508" }}>{name}</option>
              ))}
            </select>
          </div>

          {[
            ["TITLE", "title", "text"],
            ["ROLE", "role", "text"],
            ["YEAR", "year", "text"],
            ["STACK", "stack", "text"],
            ["URL (선택)", "url", "url"],
          ].map(([label, key, type]) => (
            <div key={key}>
              <p className="text-white/22 text-[9px] font-light mb-2" style={{ letterSpacing: "0.34em" }}>{label}</p>
              <input
                type={type}
                value={(form as Record<string, string | number>)[key] as string}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key !== "url"}
                className="w-full text-sm font-light px-4 py-3"
                style={inputStyle}
              />
            </div>
          ))}

          <div>
            <p className="text-white/22 text-[9px] font-light mb-2" style={{ letterSpacing: "0.34em" }}>DESCRIPTION</p>
            <textarea
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              required rows={4}
              className="w-full text-sm font-light px-4 py-3 resize-none"
              style={inputStyle}
            />
          </div>

          <p className="text-white/18 text-[9px] font-light" style={{ letterSpacing: "0.26em" }}>
            위치(각도)는 기존 노드와 55° 이상 떨어지도록 자동 배치됩니다.
          </p>

          <button type="submit" disabled={saving}
            className="px-6 py-2.5 text-[10px] font-light transition-colors"
            style={{ letterSpacing: "0.28em", background: "rgba(80,165,255,0.14)", border: "1px solid rgba(80,165,255,0.35)", color: "rgba(80,165,255,0.90)" }}>
            {saving ? "저장 중..." : "ADD NODE"}
          </button>
        </form>
      )}

      {/* Node list grouped by planet */}
      {loading ? (
        <p className="text-white/20 text-[10px] font-light" style={{ letterSpacing: "0.3em" }}>LOADING...</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ id, name, nodes: pNodes }) => (
            <div key={id}>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-white/35 text-[10px] font-light" style={{ letterSpacing: "0.40em" }}>{name.toUpperCase()}</span>
                <span className="text-white/15 text-[9px]">({pNodes.length})</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              {pNodes.length === 0 ? (
                <p className="text-white/12 text-[9px] font-light pl-2" style={{ letterSpacing: "0.22em" }}>— 노드 없음</p>
              ) : (
                <div className="space-y-2">
                  {pNodes.map((node) => (
                    <div key={node.id} className="flex items-center justify-between px-5 py-4"
                      style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <span className="text-white/75 text-sm font-light">{node.title}</span>
                          <span className="text-white/28 text-[9px] font-light" style={{ letterSpacing: "0.22em" }}>{node.role.toUpperCase()}</span>
                          <span className="text-white/18 text-[9px]">{node.year}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-white/22 text-[9px] font-light">{node.stack}</span>
                          <span className="text-white/12 text-[8px]">∠{Math.round(node.angle)}°</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(node.id)}
                        className="text-white/18 hover:text-red-400/70 text-[9px] font-light transition-colors ml-6 shrink-0"
                        style={{ letterSpacing: "0.22em" }}>
                        DELETE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
