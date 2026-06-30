"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CTASection({ onEnter }: { onEnter?: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef     = useRef<HTMLParagraphElement>(null);
  const btnRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      if (headingRef.current) {
        gsap.fromTo(headingRef.current,
          { opacity: 0, scale: 0.94, filter: "blur(20px)" },
          {
            opacity: 1, scale: 1, filter: "blur(0px)",
            duration: 1.8, ease: "power2.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
          }
        );
      }

      const els = [subRef.current, btnRef.current].filter(Boolean);
      gsap.fromTo(els,
        { opacity: 0, y: 18 },
        {
          opacity: 1, y: 0,
          duration: 1.1, ease: "power2.out",
          stagger: 0.18,
          delay: 0.5,
          scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
        }
      );

    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center px-8 py-32 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <Image
          src="/space-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={65}
          loading="lazy"
          className="object-cover object-center"
          style={{ opacity: 0.14 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at center, transparent 0%, rgba(5,5,8,0.55) 60%, #050508 100%)",
          }}
        />
      </div>

      <div
        className="absolute bottom-[-15%] right-[-10%] pointer-events-none select-none"
        aria-hidden="true"
        style={{ opacity: 0.07 }}
      >
        <Image
          src="/earth.png"
          alt=""
          width={600}
          height={600}
          loading="lazy"
          style={{ width: "clamp(300px, 38vw, 600px)", height: "auto" }}
        />
      </div>

      <div className="absolute top-0 left-8 lg:left-24 right-8 lg:right-24 h-[1px] bg-white/5" />

      <div className="text-center max-w-2xl relative z-10">
        <p className="text-white/25 text-xs font-light mb-8" style={{ letterSpacing: "0.35em" }}>
          05 — ENTER
        </p>

        <h2
          ref={headingRef}
          className="font-display text-white"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
            lineHeight: 1.06,
            fontWeight: 300,
            letterSpacing: "-0.02em",
            marginBottom: "1.5rem",
            opacity: 0,
            fontFamily: "var(--font-korean)",
          }}
        >
          탐험을 시작할
          <br />준비가 됐나요?
        </h2>

        <p
          ref={subRef}
          className="text-white/40 font-light mb-12"
          style={{
            fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)",
            lineHeight: 1.7,
            opacity: 0,
            fontFamily: "var(--font-korean)",
          }}
        >
          태양계를 펼쳐보세요.<br />
          각 행성은 ASTRA의 새로운 공간으로 이어집니다.
        </p>

        <div ref={btnRef} className="flex flex-col items-center gap-4" style={{ opacity: 0 }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="glass px-10 py-4 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-400"
            style={{
              letterSpacing: "0.2em",
              fontSize: "0.8rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
            onClick={() => onEnter?.()}
          >
            ENTER ASTRA
          </motion.button>
          <span
            className="text-white/20 text-xs font-light"
            style={{ letterSpacing: "0.2em", fontFamily: "var(--font-korean)" }}
          >
            행성을 클릭해 탐험을 시작하세요
          </span>
        </div>
      </div>
    </section>
  );
}
