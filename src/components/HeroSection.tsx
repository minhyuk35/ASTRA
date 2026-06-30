"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { gsap } from "gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ease, fadeUp, staggerContainer } from "@/lib/animations";

const FEATURE_CARDS = [
  { label: "GUILD",     title: "길드 시스템",  desc: "팀을 만들고 함께 성장하세요."      },
  { label: "ECONOMY",   title: "MoneyLab",    desc: "포인트와 코인을 거래하세요."        },
  { label: "COMMUNITY", title: "친목 공간",    desc: "매일 새로운 만남이 기다려요."       },
];

export default function HeroSection() {
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const rawX   = useMotionValue(0);
  const rawY   = useMotionValue(0);
  const earthX = useSpring(rawX, { stiffness: 32, damping: 24 });
  const earthY = useSpring(rawY, { stiffness: 32, damping: 24 });

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth  - 0.5) * 26);
      rawY.set(-(e.clientY / window.innerHeight - 0.5) * 16);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY, reducedMotion]);

  useEffect(() => {
    if (!scrollHintRef.current || reducedMotion) return;
    gsap.to(scrollHintRef.current, {
      y: 7, opacity: 0.28,
      duration: 1.6, repeat: -1, yoyo: true, ease: "power1.inOut",
    });
  }, [reducedMotion]);

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-8 lg:px-16 overflow-hidden">

      {/* Earth */}
      <div
        className="absolute z-0 pointer-events-none select-none"
        style={{
          right: "-6%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "clamp(480px, 58vw, 920px)",
          aspectRatio: "1 / 1",
        }}
      >
        <motion.div
          style={{ x: earthX, y: earthY }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1   }}
          transition={{ duration: 2.2, ease: ease.smooth, delay: 0.5 }}
        >
          <Image
            src="/earth.png"
            alt=""
            width={920}
            height={920}
            priority
            quality={88}
            sizes="(max-width: 640px) 480px, (max-width: 1280px) 58vw, 920px"
            className="earth-img"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </motion.div>
      </div>

      {/* Hero text */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-xl mt-24 lg:mt-0"
      >
        <motion.p
          variants={fadeUp}
          className="text-white/30 text-xs font-light mb-7"
          style={{ letterSpacing: "0.36em" }}
        >
          BEYOND DEPARTURE
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="font-display text-white glow-text"
          style={{
            fontSize: "clamp(3.2rem, 7vw, 6.5rem)",
            lineHeight: 1.04,
            fontWeight: 300,
            letterSpacing: "-0.02em",
          }}
        >
          The dark was
          <br />
          never empty.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-7 text-white/42 font-light max-w-sm"
          style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.05rem)", lineHeight: 1.75, fontFamily: "var(--font-korean)" }}
        >
          우주를 닮은 Discord 커뮤니티, ASTRA.<br />
          새로운 인연과 모험이 당신을 기다리고 있어요.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-11">
          <button className="text-white/55 hover:text-white/85 transition-colors duration-500">
            <span className="text-xs font-light" style={{ letterSpacing: "0.26em", fontFamily: "var(--font-korean)" }}>
              [ 탐험 시작하기 ]
            </span>
          </button>
        </motion.div>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: ease.smooth, delay: 0.9 }}
        className="absolute bottom-16 right-8 lg:right-16 flex gap-3"
      >
        {FEATURE_CARDS.map((card, i) => (
          <FeatureCard key={card.label} {...card} delay={i * 0.1} />
        ))}
      </motion.div>

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div ref={scrollHintRef} className="flex flex-col items-center gap-2 opacity-20">
          <div className="w-[1px] h-6 bg-white/50" />
          <span className="text-white text-[9px] font-light" style={{ letterSpacing: "0.32em" }}>
            SCROLL
          </span>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  label, title, desc, delay,
}: {
  label: string; title: string; desc: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 1.0 + delay }}
      whileHover={{ y: -5, scale: 1.02,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
      className="glass rounded-2xl p-4 w-36 cursor-default"
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        willChange: "transform",
      }}
    >
      <p className="text-white/25 text-[9px] font-light mb-2" style={{ letterSpacing: "0.3em" }}>
        {label}
      </p>
      <p className="text-white/80 text-sm font-light leading-tight mb-1.5" style={{ fontFamily: "var(--font-korean)" }}>{title}</p>
      <p className="text-white/35 text-xs font-light leading-relaxed" style={{ fontFamily: "var(--font-korean)" }}>{desc}</p>
    </motion.div>
  );
}
