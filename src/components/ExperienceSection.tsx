"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BODY_LINES = [
  "길드를 창설하고 동료들과 함께 성장하세요.",
  "MoneyLab에서 SGC 코인을 사고팔아요.",
  "매일 출석 체크로 포인트를 쌓아가세요.",
  "ASTRA는 당신이 돌아올 이유를 만들어요.",
];

export default function ExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linesRef   = useRef<(HTMLParagraphElement | null)[]>([]);
  const accentRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      if (headingRef.current) {
        gsap.fromTo(headingRef.current,
          {
            opacity: 0,
            y: 50,
            rotationX: 14,
            transformPerspective: 700,
            transformOrigin: "50% 0%",
          },
          {
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: 1.5,
            ease: "power3.out",
            scrollTrigger: { trigger: headingRef.current, start: "top 80%" },
          }
        );
      }

      linesRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(el,
          { opacity: 0, x: 28 },
          {
            opacity: 1, x: 0,
            duration: 0.85,
            ease: "power2.out",
            delay: i * 0.12,
            scrollTrigger: { trigger: el, start: "top 86%" },
          }
        );
      });

      if (accentRef.current) {
        gsap.fromTo(accentRef.current,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1, opacity: 0.2,
            duration: 1.2, ease: "power3.inOut",
            transformOrigin: "left center",
            scrollTrigger: { trigger: accentRef.current, start: "top 90%" },
          }
        );
      }

    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center px-8 lg:px-24 py-32 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <Image
          src="/space-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={70}
          loading="lazy"
          className="object-cover object-center"
          style={{ opacity: 0.18 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #050508 0%, rgba(5,5,8,0.82) 28%, rgba(5,5,8,0.1) 60%, rgba(5,5,8,0.1) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #050508 0%, transparent 15%, transparent 85%, #050508 100%)",
          }}
        />
      </div>

      <div className="absolute top-0 left-8 lg:left-24 right-8 lg:right-24 h-[1px] bg-white/5" />

      <div className="max-w-4xl relative z-10">
        <p className="text-white/25 text-xs font-light mb-8" style={{ letterSpacing: "0.35em" }}>
          02 — EXPERIENCE
        </p>

        <h2
          ref={headingRef}
          className="font-display text-white"
          style={{
            fontSize: "clamp(2.4rem, 6vw, 5.5rem)",
            lineHeight: 1.06,
            fontWeight: 300,
            letterSpacing: "-0.02em",
            marginBottom: "3.5rem",
            opacity: 0,
          }}
        >
          You don&apos;t watch it.
          <br />
          <span className="text-white/48">You disappear into it.</span>
        </h2>

        <div className="space-y-3 max-w-lg">
          {BODY_LINES.map((line, i) => (
            <p
              key={i}
              ref={(el) => { linesRef.current[i] = el; }}
              className="text-white/45 font-light"
              style={{
                fontSize: "clamp(1rem, 1.5vw, 1.15rem)",
                lineHeight: 1.75,
                opacity: 0,
                fontFamily: "var(--font-korean)",
              }}
            >
              {line}
            </p>
          ))}
        </div>

        <div ref={accentRef} className="mt-16 flex items-center gap-4" style={{ opacity: 0 }}>
          <div className="h-[1px] w-12 bg-white" />
          <span className="text-white text-xs font-light" style={{ letterSpacing: "0.3em" }}>ASTRA</span>
          <div className="h-[1px] w-12 bg-white" />
        </div>
      </div>
    </section>
  );
}
