"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/providers";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9", className)} aria-hidden="true">
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <g transform="translate(32 33)" fill="none" strokeLinejoin="round">
        <path d="M0-21c8 7 8 16 0 23-8-7-8-16 0-23z" className="fill-secondary" />
        <path d="M-1-3c-9-6-17-5-22 2 7 7 15 8 22 2z" className="fill-primary-content" opacity=".92" transform="rotate(8)" />
        <path d="M1-3c9-6 17-5 22 2-7 7-15 8-22 2z" className="fill-primary-content" opacity=".92" transform="rotate(-8)" />
        <path d="M-22 8c9 9 35 9 44 0" className="stroke-primary-content" strokeWidth="3" strokeLinecap="round" opacity=".85" />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", className, compact }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="AcademiaConnect home">
      <motion.span whileHover={{ rotate: -6, scale: 1.06 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>
        <LogoMark />
      </motion.span>
      {!compact && (
        <span className="text-xl font-bold tracking-tight" style={{ fontStretch: "108%" }}>
          Academia<span className="text-primary">Connect</span>
        </span>
      )}
    </Link>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "shapla-night";
  return (
    <button type="button" onClick={toggle} className={cn("btn btn-ghost btn-circle", className)} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} aria-pressed={dark}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? "moon" : "sun"} initial={{ rotate: -80, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 80, opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} className="grid place-items-center">
          {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
