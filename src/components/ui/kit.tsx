"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Inbox, RefreshCw, Search, Star, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { cn, initials } from "@/lib/utils";

/* ------------------------------------------------------------------ headings */
export function SectionTitle({ title, sub, action, center, className }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; center?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-4", center && "justify-center text-center", className)}>
      <div className={cn("max-w-2xl", center && "mx-auto")}>
        <h2 className={cn("h-section matra text-3xl sm:text-4xl", center && "matra-center")}>{title}</h2>
        {sub && <p className="mt-3 text-lg text-base-content/70">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Title block at the top of every signed-in page */
export function PageHeader({ title, sub, actions, back }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-base-content/60 transition-colors hover:text-primary">
            <ChevronLeft className="size-4" /> {back.label}
          </Link>
        )}
        <h1 className="h-section matra text-3xl sm:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-base-content/65">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ states */
export const Spinner = ({ className }: { className?: string }) => <span className={cn("loading loading-spinner", className)} aria-label="Loading" />;

export function EmptyState({ title, body, icon, action }: { title: string; body?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="surface grid place-items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">{icon ?? <Inbox className="size-7" />}</span>
      <h3 className="text-lg font-bold">{title}</h3>
      {body && <p className="max-w-md text-base-content/65">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, retry }: { message?: string; retry?: () => void }) {
  return (
    <div role="alert" className="surface grid place-items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-error/10 text-error">
        <TriangleAlert className="size-7" />
      </span>
      <h3 className="text-lg font-bold">That did not load</h3>
      <p className="max-w-md text-base-content/65">{message ?? "Something went wrong while loading this page."}</p>
      {retry && (
        <button type="button" onClick={retry} className="btn btn-primary btn-sm">
          <RefreshCw className="size-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function CardGridSkeleton({ n = 6, ratio = "aspect-[16/10]", cols = "sm:grid-cols-2 lg:grid-cols-3" }: { n?: number; ratio?: string; cols?: string }) {
  return (
    <div className={cn("grid gap-6", cols)}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="surface overflow-hidden">
          <div className={cn("skeleton rounded-none", ratio)} />
          <div className="grid gap-3 p-5">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ n = 5 }: { n?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ forms */
export function Field({ label, htmlFor, error, hint, optional, children, className }: { label?: ReactNode; htmlFor?: string; error?: string | null; hint?: ReactNode; optional?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
          {optional && <span className="ml-1.5 font-normal text-base-content/50">optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm font-medium text-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-base-content/55">{hint}</p>
      ) : null}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={cn("input w-full", className)}>
      <Search className="size-4 opacity-60" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const items: (number | "gap")[] = [];
  for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - page) <= 1) items.push(p);
  else if (items[items.length - 1] !== "gap") items.push("gap");
  return (
    <nav className="join mt-10 flex justify-center" aria-label="Pagination">
      <button type="button" className="btn join-item" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </button>
      {items.map((p, i) =>
        p === "gap" ? (
          <span key={`g${i}`} className="btn join-item btn-disabled">
            …
          </span>
        ) : (
          <button key={p} type="button" className={cn("btn join-item", p === page && "btn-primary")} onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined}>
            {p}
          </button>
        ),
      )}
      <button type="button" className="btn join-item" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

/** Pill row for single-choice filters */
export function Chips<T extends string>({ options, value, onChange, all = "All" }: { options: readonly T[]; value: T | ""; onChange: (v: T | "") => void; all?: string }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="group">
      {[["", all] as const, ...options.map((o) => [o, o] as const)].map(([v, label]) => (
        <button key={v || "all"} type="button" onClick={() => onChange(v as T | "")} aria-pressed={value === v} className={cn("btn btn-sm shrink-0 rounded-full", value === v ? "btn-primary" : "btn-ghost border-base-content/15 bg-base-100")}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ small pieces */
export function Avatar({ name, src, size = 40, online, className }: { name?: string | null; src?: string | null; size?: number; online?: boolean; className?: string }) {
  const [bad, setBad] = useState(false);
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      {src && !bad ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "Profile photo"} referrerPolicy="no-referrer" onError={() => setBad(true)} className="size-full rounded-full object-cover ring-1 ring-base-content/10" />
      ) : (
        <span className="grid size-full place-items-center rounded-full bg-primary/12 font-bold text-primary ring-1 ring-primary/15" style={{ fontSize: size * 0.38 }}>
          {initials(name)}
        </span>
      )}
      {online !== undefined && <span className={cn("absolute right-0 bottom-0 rounded-full border-2 border-base-100", online ? "bg-success" : "bg-base-300")} style={{ width: size * 0.28, height: size * 0.28 }} />}
    </span>
  );
}

const tones = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/25 text-secondary-content dark:text-secondary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/18 text-warning-content dark:text-warning",
  error: "bg-error/12 text-error",
  info: "bg-info/12 text-info",
} as const;
export type Tone = keyof typeof tones;

export function StatCard({ icon, label, value, hint, tone = "primary", href }: { icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; href?: string }) {
  const body = (
    <div className={cn("surface flex h-full items-start gap-4 p-5", href && "card-lift")}>
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl [&>svg]:size-6", tones[tone])}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-base-content/60">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-sm text-base-content/55">{hint}</p>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export const Pill = ({ tone = "primary", children, className }: { tone?: Tone; children: ReactNode; className?: string }) => <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;

export function ProgressRing({ value, size = 96, stroke = 9, children, tone = "var(--color-primary)" }: { value: number; size?: number; stroke?: number; children?: ReactNode; tone?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ duration: 1.1, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-base-content/10">
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)} className={cn("relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors", value === t.value ? "text-primary" : "text-base-content/60 hover:text-base-content")}>
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-base-300 px-2 py-0.5 text-xs">{t.count}</span>}
          {value === t.value && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  );
}

export function Stars({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} out of 5`} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)} className="rounded-md p-0.5 transition-transform hover:scale-110 active:scale-95">
          <Star className={cn("size-7 transition-colors", n <= shown ? "fill-secondary text-secondary" : "text-base-content/25")} />
        </button>
      ))}
    </div>
  );
}

export function Meter({ value, max = 100, tone = "primary", className }: { value: number; max?: number; tone?: "primary" | "secondary" | "success" | "error"; className?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  const fill = { primary: "bg-primary", secondary: "bg-secondary", success: "bg-success", error: "bg-error" }[tone];
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-base-content/10", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className={cn("h-full rounded-full", fill)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
    </div>
  );
}
