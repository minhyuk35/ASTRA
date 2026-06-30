"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ease } from "@/lib/animations";

const FEATURES = [
  {
    index: "01",
    title: "길드 시스템",
    description: "길드를 창설하거나 가입해 동료들과 함께 성장하세요. 포인트 기부로 길드 레벨을 올려요.",
  },
  {
    index: "02",
    title: "MoneyLab",
    description: "SGC 코인을 거래하고 Discord 포인트를 전환해 나만의 경제 활동을 즐겨보세요.",
  },
  {
    index: "03",
    title: "출석 & 포인트",
    description: "매일 출석 체크로 포인트를 쌓고, 연속 출석 보너스로 더 빠르게 성장하세요.",
  },
  {
    index: "04",
    title: "공지 & 이벤트",
    description: "서버의 소식, 이벤트, 업데이트를 놓치지 않도록 메신저로 알림을 받아보세요.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative px-8 lg:px-24 py-32 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
        aria-hidden="true"
        style={{ opacity: 0.04 }}
      >
        <Image
          src="/earth.png"
          alt=""
          width={900}
          height={900}
          loading="lazy"
          style={{ width: "clamp(500px, 70vw, 900px)", height: "auto" }}
        />
      </div>

      <div className="absolute top-0 left-8 lg:left-24 right-8 lg:right-24 h-[1px] bg-white/5" />

      <div className="max-w-6xl mx-auto relative z-10">
        <p className="text-white/25 text-xs font-light mb-8" style={{ letterSpacing: "0.35em" }}>
          03 — FEATURES
        </p>

        <motion.h2
          initial={{ opacity: 0, y: 32, letterSpacing: "0.12em" }}
          whileInView={{ opacity: 1, y: 0, letterSpacing: "-0.015em" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.4, ease: ease.smooth }}
          className="font-display text-white mb-16"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 4rem)",
            lineHeight: 1.1,
            fontWeight: 300,
          }}
        >
          Everything you need
          <br />
          to belong here.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.index} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 48,
        rotateX: 12,
        scale: 0.95,
        transformPerspective: 600,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
      }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 1.0,
        ease: ease.smooth,
        delay: index * 0.11,
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      }}
      className="glass rounded-2xl p-6 cursor-default"
      style={{
        boxShadow: "0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        willChange: "transform",
        transformOrigin: "50% 0%",
      }}
    >
      <span
        className="text-white/20 text-[10px] font-light block mb-5"
        style={{ letterSpacing: "0.3em" }}
      >
        {feature.index}
      </span>
      <h3
        className="text-white/85 font-light mb-3"
        style={{ fontSize: "1.05rem", lineHeight: 1.3, fontFamily: "var(--font-korean)" }}
      >
        {feature.title}
      </h3>
      <p
        className="text-white/35 font-light leading-relaxed"
        style={{ fontSize: "0.85rem", fontFamily: "var(--font-korean)" }}
      >
        {feature.description}
      </p>
    </motion.div>
  );
}
