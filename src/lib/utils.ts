import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

const TZ = "Asia/Dhaka";
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts });
const dateFmt = fmt({ day: "numeric", month: "short", year: "numeric" });
const shortFmt = fmt({ day: "numeric", month: "short" });
const timeFmt = fmt({ hour: "numeric", minute: "2-digit", hour12: true });
const dayFmt = fmt({ weekday: "short", day: "numeric", month: "short" });
const longFmt = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const monthFmt = fmt({ month: "short" });
const dayNumFmt = fmt({ day: "numeric" });

const asDate = (d: string | number | Date | null | undefined) => {
  const x = d ? new Date(d) : null;
  return x && !Number.isNaN(+x) ? x : null;
};

export const fmtDate = (d?: string | number | Date | null) => (asDate(d) ? dateFmt.format(asDate(d)!) : "");
export const fmtShort = (d?: string | number | Date | null) => (asDate(d) ? shortFmt.format(asDate(d)!) : "");
export const fmtTime = (d?: string | number | Date | null) => (asDate(d) ? timeFmt.format(asDate(d)!).replace(/\b(am|pm)\b/i, (m) => m.toUpperCase()) : "");
export const fmtDay = (d?: string | number | Date | null) => (asDate(d) ? dayFmt.format(asDate(d)!) : "");
export const fmtLong = (d?: string | number | Date | null) => (asDate(d) ? longFmt.format(asDate(d)!) : "");
export const fmtDateTime = (d?: string | number | Date | null) => (asDate(d) ? `${dateFmt.format(asDate(d)!)}, ${fmtTime(d)}` : "");
export const monthOf = (d?: string | number | Date | null) => (asDate(d) ? monthFmt.format(asDate(d)!) : "");
export const dayNum = (d?: string | number | Date | null) => (asDate(d) ? dayNumFmt.format(asDate(d)!) : "");

/** "5 min ago", "yesterday", "3 Nov" */
export function timeAgo(d?: string | number | Date | null) {
  const x = asDate(d);
  if (!x) return "";
  const s = Math.round((Date.now() - +x) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86_400) return `${Math.round(s / 3600)} h ago`;
  if (s < 172_800) return "yesterday";
  if (s < 7 * 86_400) return `${Math.round(s / 86_400)} days ago`;
  return fmtShort(x);
}

/** "in 3 days", "tomorrow", "today", "2 days ago" */
export function dayDistance(d?: string | number | Date | null) {
  const x = asDate(d);
  if (!x) return "";
  const key = (v: Date) => new Date(v.toLocaleString("en-US", { timeZone: TZ })).setHours(0, 0, 0, 0);
  const n = Math.round((key(x) - key(new Date())) / 86_400_000);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

export const money = (n: number | null | undefined) => `৳${Math.round(n ?? 0).toLocaleString("en-US")}`;
const SMALL = new Set(["of", "and", "the", "to", "in", "for", "a", "an", "on", "at", "&"]);
export const initials = (name?: string | null) => {
  const words = (name ?? "?").split(/\s+/).filter(Boolean);
  const big = words.filter((w) => !SMALL.has(w.toLowerCase()));
  return (big.length ? big : words).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
};
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
export const DAY_ORDER = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"] as const;

export function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function ytThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Where to go after login: the page the visitor asked for, otherwise the Home page. Only same-site paths are allowed. */
export const safeNext = (next: string | null | undefined, fallback = "/") => (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback);

/** Said when the login service cannot be reached at all (offline, blocked, wrong address). */
export const NETWORK_MESSAGE = "We could not reach the login service. Check your internet connection and try again.";

const OWNER_HINT = "If you run this website: open /api/auth-check on it to see what to change.";

/** Said when the login service answers 200 but with nothing in it. */
export const EMPTY_ANSWER_MESSAGE = `The login service gave an empty answer. That points to the website's setup, not to what you typed. ${OWNER_HINT}`;

/** Long messages stay on screen longer (undefined keeps the default). */
export const toastMs = (message: string) => (message.length > 90 ? 12_000 : undefined);

type AuthError = { status?: number; statusText?: string; code?: string; message?: string } | null | undefined;

/**
 * Words for a sign in, sign up or password problem.
 *
 * The login service always says why when the problem is something the person typed (wrong password, email already used,
 * password too short). An answer with no reason, or a 404, 403 or 5xx, means the website itself is not set up right. Say that,
 * with the status code, instead of blaming the password.
 */
export function authErrorMessage(error: AuthError, fallback: string): string {
  if (!error) return fallback;
  const status = error.status ?? 0;
  const message = (error.message ?? "").trim();

  if (status >= 500) {
    return process.env.NODE_ENV === "production"
      ? `Something went wrong on our side (error ${status}). Please try again in a moment. ${OWNER_HINT}`
      : "The website could not reach its database. Look at the terminal that runs the website for the reason (usually MONGODB_URI in client/.env.local).";
  }
  // The address in the browser is not the one the website was set up for (BETTER_AUTH_URL)
  if (status === 403 && /origin/i.test(message)) return `This website address is not set up for login yet. ${OWNER_HINT}`;
  if (error.code === "INVALID_EMAIL_OR_PASSWORD" || (status === 401 && /invalid email or password/i.test(message))) return "Email or password is not correct";
  if (status === 429) return message || "Too many attempts. Please wait a minute and try again.";
  if (message) return message;
  if (status >= 400) {
    return `The login service answered with an unexpected reply (HTTP ${status}${error.statusText ? ` ${error.statusText}` : ""}). That points to the website's setup, not to what you typed. ${OWNER_HINT}`;
  }
  return fallback;
}

/** Path prefixes that need a signed-in user. Mirrors proxy.ts */
export const PRIVATE_RE = /^\/(dashboard|registration|my-courses|evaluation|fees|receipt|transport|messages|students|profile|notifications|admin)(\/|$)|^\/(courses|clubs|events)\/[^/]+/;
export const isPrivatePath = (p: string) => PRIVATE_RE.test(p);

/** "03" and "Bus 03" both read as "Bus 03" */
export const busLabel = (n?: string | null) => (/^bus\b/i.test(n ?? "") ? String(n) : `Bus ${n ?? ""}`.trim());

export const pretty = (s: string) => s.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase());
