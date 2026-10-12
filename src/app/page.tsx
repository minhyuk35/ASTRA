"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import LoadingSequence from "@/components/LoadingSequence";
import ParticleOverlay from "@/components/ParticleOverlay";
import GlitchOverlay from "@/components/GlitchOverlay";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const SceneCanvas = dynamic(() => import("@/components/SceneCanvas"), {
  ssr: false,
  loading: () => <div className="w-full h-full" style={{ background: "#050508" }} />,
});

const SolarSystem = dynamic(() => import("@/components/SolarSystem"), {
  ssr: false,
  loading: () => null,
});

type Stage = "loading" | "done";

export default function Page() {
  const mouse         = useMouseParallax();
  const reducedMotion = useReducedMotion();

  const [stage,     setStage]     = useState<Stage>("loading");
  const [solarOpen, setSolarOpen] = useState(false);

  useEffect(() => {
    const alreadyLoaded = sessionStorage.getItem("astra_loaded");
    const pendingAuth   = sessionStorage.getItem("pending_auth");

    if (alreadyLoaded && !pendingAuth) {
      setStage("done");
    } else {
      sessionStorage.removeItem("pending_auth");
      setStage("loading");
    }
  }, []);

  const handleLoadComplete = useCallback(() => {
    sessionStorage.setItem("astra_loaded", "1");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setStage("done");
  }, []);

  const handleSolarOpen  = useCallback(() => setSolarOpen(true),  []);
  const handleSolarClose = useCallback(() => setSolarOpen(false), []);

  return (
    <main className="relative">
      <div className="fixed inset-0 z-0" aria-hidden="true" style={{ contain: "strict" }}>
        <SceneCanvas
          mouseX={reducedMotion ? 0 : mouse.x}
          mouseY={reducedMotion ? 0 : mouse.y}
          reducedMotion={reducedMotion}
        />
      </div>

      <ParticleOverlay />
      <GlitchOverlay />

      {stage === "loading" && <LoadingSequence onComplete={handleLoadComplete} />}

      <SolarSystem open={solarOpen} onClose={handleSolarClose} />

      <Navigation />

      <motion.div
        initial={{ opacity: 0, scale: 1.012 }}
        animate={{ opacity: stage === "done" ? 1 : 0, scale: stage === "done" ? 1 : 1.012 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
        style={{ willChange: "opacity, transform" }}
      >
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <FeaturesSection />
        <CTASection onEnter={handleSolarOpen} />
        <Footer />
      </motion.div>
    </main>
  );
}
