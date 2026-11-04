"use client";

import { animate, motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

const ease = [0.2, 0.7, 0.2, 1] as const;

export function Reveal({ children, delay = 0, y = 22, x = 0, className, once = true }: { children: ReactNode; delay?: number; y?: number; x?: number; className?: string; once?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

const container = (gap: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

/** Children fade up one after another when the group scrolls into view. */
export function Stagger({ children, className, gap = 0.07, delay = 0 }: { children: ReactNode; className?: string; gap?: number; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={container(gap, delay)} initial={reduce ? "show" : "hidden"} whileInView="show" viewport={{ once: true, margin: "0px 0px -6% 0px" }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

export function CountUp({ value, duration = 1.4, prefix = "", suffix = "", decimals = 0, className }: { value: number; duration?: number; prefix?: string; suffix?: string; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const fmt = (n: number) => `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = fmt(value);
      return;
    }
    const controls = animate(0, value, { duration, ease: "easeOut", onUpdate: (v) => (el.textContent = fmt(v)) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);
  return (
    <span ref={ref} className={className}>
      {fmt(0)}
    </span>
  );
}

/** Soft entrance for every page inside a layout. Used by template.tsx. */
export function PageFade({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}>
      {children}
    </motion.div>
  );
}
