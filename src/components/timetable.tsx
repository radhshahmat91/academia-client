"use client";

import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { DAY_ORDER, cn, hash } from "@/lib/utils";

export type Block = { key: string; day: string; start: string; end: string; title: string; sub?: string; clash?: boolean };

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
const hourLabel = (h: number) => `${h % 12 || 12} ${h >= 12 ? "PM" : "AM"}`;

const PALETTE = [
  "border-primary/50 bg-primary/15 text-primary",
  "border-info/50 bg-info/15 text-info",
  "border-secondary/70 bg-secondary/30 text-secondary-content dark:text-secondary",
  "border-success/50 bg-success/15 text-success",
  "border-warning/60 bg-warning/20 text-warning-content dark:text-warning",
];

const ROW = 48; // px per hour

/** A weekly grid: one column per day, one coloured block per class. Clashing classes turn red. */
export function Timetable({ blocks, empty = "Pick courses to see your weekly timetable." }: { blocks: Block[]; empty?: string }) {
  if (!blocks.length)
    return (
      <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-base-content/20 px-6 py-12 text-center text-base-content/60">
        <CalendarDays className="size-7 text-base-content/35" />
        <p>{empty}</p>
      </div>
    );

  const days = DAY_ORDER.filter((d) => d !== "Fri" || blocks.some((b) => b.day === "Fri"));
  const startH = Math.min(8, ...blocks.map((b) => Math.floor(toMin(b.start) / 60)));
  const endH = Math.max(17, ...blocks.map((b) => Math.ceil(toMin(b.end) / 60)));
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const height = hours.length * ROW;

  return (
    <div className="no-scrollbar overflow-x-auto" role="table" aria-label="Weekly timetable">
      <div className="min-w-[36rem]">
        <div className="grid" style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(0, 1fr))` }} role="row">
          <span />
          {days.map((d) => (
            <span key={d} role="columnheader" className="pb-2 text-center text-sm font-bold text-base-content/70">
              {d}
            </span>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(0, 1fr))` }}>
          <div className="relative" style={{ height }} aria-hidden="true">
            {hours.map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-base-content/50" style={{ top: (h - startH) * ROW }}>
                {hourLabel(h)}
              </span>
            ))}
          </div>
          {days.map((d) => (
            <div key={d} className="relative border-l border-base-content/10" style={{ height }} role="cell">
              {hours.map((h) => (
                <span key={h} aria-hidden="true" className="absolute inset-x-0 border-t border-base-content/8" style={{ top: (h - startH) * ROW }} />
              ))}
              {blocks
                .filter((b) => b.day === d)
                .map((b, i) => {
                  const top = ((toMin(b.start) - startH * 60) / 60) * ROW;
                  const h = Math.max(24, ((toMin(b.end) - toMin(b.start)) / 60) * ROW - 3);
                  return (
                    <motion.div
                      key={b.key}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04, type: "spring", damping: 22, stiffness: 300 }}
                      title={`${b.title}, ${b.start} to ${b.end}${b.sub ? `, ${b.sub}` : ""}`}
                      className={cn("absolute inset-x-1 overflow-hidden rounded-lg border px-1.5 py-1 leading-tight", b.clash ? "border-error bg-error/20 text-error" : PALETTE[hash(b.title) % PALETTE.length])}
                      style={{ top: top + 1, height: h }}
                    >
                      <span className="block truncate text-[11px] font-bold">{b.title}</span>
                      {h > 34 && <span className="block truncate text-[10px] opacity-80">{b.sub ?? `${b.start} to ${b.end}`}</span>}
                    </motion.div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
