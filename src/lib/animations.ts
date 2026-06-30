import type { Variants } from "framer-motion";

// ─── Easing curves ───────────────────────────────────────────────
export const ease = {
  smooth:    [0.16, 1, 0.3, 1]  as const,  // expo-out — fast settle
  gentle:    [0.4, 0, 0.2, 1]   as const,  // standard material
  cinematic: [0.76, 0, 0.24, 1] as const,  // dramatic entrance
  drift:     [0.25, 0.46, 0.45, 0.94] as const,
} as const;

// ─── Duration presets (seconds) ──────────────────────────────────
export const dur = {
  fast:   0.35,
  normal: 0.75,
  slow:   1.20,
  crawl:  2.00,
} as const;

// ─── Framer Motion variants ───────────────────────────────────────

/** Fade up with optional depth-of-field blur */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { duration: dur.slow, ease: ease.smooth } },
};

/** Simple fade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1,
    transition: { duration: dur.slow, ease: ease.gentle } },
};

/** Stagger container — children inherit timing */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.13, delayChildren: 0.08 },
  },
};

/** Scale reveal (very subtle) */
export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.97, filter: "blur(6px)" },
  show:   { opacity: 1, scale: 1.00, filter: "blur(0px)",
    transition: { duration: dur.crawl, ease: ease.smooth } },
};
