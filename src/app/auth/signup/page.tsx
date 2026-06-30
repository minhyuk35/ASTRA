"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#050508" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 18% 22%, rgba(180,215,255,0.25) 0%, transparent 100%), radial-gradient(1px 1px at 62% 55%, rgba(180,215,255,0.18) 0%, transparent 100%), radial-gradient(1px 1px at 80% 12%, rgba(180,215,255,0.20) 0%, transparent 100%), radial-gradient(1px 1px at 35% 78%, rgba(180,215,255,0.15) 0%, transparent 100%), radial-gradient(1px 1px at 91% 40%, rgba(180,215,255,0.22) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-14">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L14.5 14H1.5L8 1.5Z" stroke="rgba(80,165,255,0.70)" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          <Link href="/" className="text-white/35 text-[10px] font-light hover:text-white/60 transition-colors" style={{ letterSpacing: "0.48em" }}>
            ASTRA
          </Link>
        </div>

        <h1
          className="text-white font-light mb-2 leading-tight"
          style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "2.6rem", letterSpacing: "-0.02em" }}
        >
          Join the<br />signal.
        </h1>
        <p className="text-white/30 text-xs font-light mb-12" style={{ letterSpacing: "0.12em" }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-white/55 hover:text-white/80 transition-colors underline underline-offset-2">
            Sign in
          </Link>
        </p>

        <button
          onClick={() => {
            sessionStorage.setItem("pending_auth", "1");
            signIn("google", { callbackUrl: "/" });
          }}
          className="w-full py-3.5 flex items-center justify-center gap-3 text-[10px] font-light transition-all duration-200 hover:bg-[rgba(255,255,255,0.05)] active:scale-[0.99]"
          style={{ letterSpacing: "0.32em", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.60)" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.45)" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="rgba(255,255,255,0.35)" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,0.55)" />
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <p className="text-white/15 text-[9px] font-light text-center mt-8" style={{ letterSpacing: "0.12em", lineHeight: 1.8 }}>
          By creating an account you agree to the{" "}
          <Link href="/announcements/1" className="underline underline-offset-2 hover:text-white/35 transition-colors">
            Terms of Service
          </Link>
        </p>
      </motion.div>

      <div
        className="fixed bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(80,150,255,0.12), transparent)" }}
        aria-hidden="true"
      />
    </div>
  );
}
