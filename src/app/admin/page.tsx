"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) router.replace("/admin/dashboard");
    else setError("아이디 또는 비밀번호가 올바르지 않아요.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#050508" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12 justify-center">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="white" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          <span className="text-white text-[10px] font-light" style={{ letterSpacing: "0.44em" }}>ASTRA / ADMIN</span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <p className="text-white/22 text-[9px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>USERNAME</p>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)}
              autoComplete="username" required
              className="w-full bg-transparent text-white/75 text-sm font-light outline-none px-4 py-3"
              style={{ border: "1px solid rgba(255,255,255,0.09)", letterSpacing: "0.04em" }}
            />
          </div>
          <div>
            <p className="text-white/22 text-[9px] font-light mb-2" style={{ letterSpacing: "0.38em" }}>PASSWORD</p>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" required
              className="w-full bg-transparent text-white/75 text-sm font-light outline-none px-4 py-3"
              style={{ border: "1px solid rgba(255,255,255,0.09)", letterSpacing: "0.04em" }}
            />
          </div>

          {error && (
            <p className="text-[9px] font-light" style={{ letterSpacing: "0.22em", color: "rgba(255,100,100,0.75)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 text-[10px] font-light transition-all duration-300"
            style={{
              letterSpacing: "0.38em",
              color: "rgba(80,165,255,0.90)",
              border: "1px solid rgba(80,165,255,0.35)",
              background: loading ? "rgba(80,165,255,0.04)" : "rgba(80,165,255,0.06)",
              opacity: loading ? 0.6 : 1,
            }}>
            {loading ? "VERIFYING..." : "ENTER"}
          </button>
        </form>
      </div>
    </div>
  );
}
