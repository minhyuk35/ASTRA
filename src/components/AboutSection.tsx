"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LINES = [
  "ASTRA는 단순한 Discord 서버가 아니에요.",
  "빛이 기억처럼 흐르는 이곳에서 새로운 인연을 만나보세요.",
  "길드를 창설하고, 경제 활동을 즐기고,",
  "매일 출석하며 당신만의 우주 이야기를 써내려가세요.",
  "우리는 당신이 잊고 있던 공간을 돌려드려요.",
];

export default function AboutSection() {
  const sectionRef  = useRef<HTMLElement>(null);
  const headingRef  = useRef<HTMLHeadingElement>(null);
  const outerRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs   = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {

      if (headingRef.current) {
        gsap.fromTo(headingRef.current,
          { opacity: 0, letterSpacing: "0.15em", y: 16 },
          {
            opacity: 1, letterSpacing: "-0.015em", y: 0,
            duration: 1.4, ease: "power3.out",
            scrollTrigger: { trigger: headingRef.current, start: "top 82%" },
          }
        );
      }

      innerRefs.current.forEach((inner, i) => {
        if (!inner) return;
        gsap.fromTo(inner,
          { y: "105%", opacity: 0 },
          {
            y: "0%", opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            delay: i * 0.09,
            scrollTrigger: {
              trigger: outerRefs.current[i],
              start: "top 88%",
            },
          }
        );
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center px-8 lg:px-24 py-32 overflow-hidden"
    >
      <div
        className="absolute right-[-18%] top-1/2 -translate-y-1/2 pointer-events-none select-none"
        aria-hidden="true"
        style={{ opacity: 0.055 }}
      >
        <Image
          src="/earth.png"
          alt=""
          width={700}
          height={700}
          loading="lazy"
          style={{ width: "clamp(400px, 45vw, 700px)", height: "auto" }}
        />
      </div>

      <div className="absolute top-0 left-8 lg:left-24 right-8 lg:right-24 h-[1px] bg-white/5" />

      <div className="max-w-3xl relative z-10">
        <p className="text-white/25 text-xs font-light mb-8" style={{ letterSpacing: "0.35em" }}>
          01 — ABOUT
        </p>

        <h2
          ref={headingRef}
          className="font-display text-white opacity-0"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 4.5rem)",
            lineHeight: 1.1,
            fontWeight: 300,
            letterSpacing: "0.15em",
            marginBottom: "3rem",
          }}
        >
          We built a community
          <br />
          among the stars.
        </h2>

        <div className="space-y-2">
          {LINES.map((line, i) => (
            <div
              key={i}
              ref={(el) => { outerRefs.current[i] = el; }}
              style={{ overflow: "hidden", paddingBottom: "2px" }}
            >
              <p
                ref={(el) => { innerRefs.current[i] = el; }}
                className="text-white/48 font-light"
                style={{
                  fontSize: "clamp(1rem, 1.6vw, 1.2rem)",
                  lineHeight: 1.75,
                  transform: "translateY(105%)",
                  opacity: 0,
                  fontFamily: "var(--font-korean)",
                }}
              >
                {line}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
