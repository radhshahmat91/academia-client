/**
 * Helpers for /api/auth-check. They are plain functions so they can be tested without a server.
 *
 * The check sends the login service a made-up login that no account matches. A healthy service answers that with
 * 401 "Invalid email or password" (429 "slow down" is also its voice). Anything else, from the service or from
 * something standing in front of it, shows up here with its status code.
 */

export type Probe = {
  /** How the made-up login was sent */
  via: string;
  /** HTTP status, or 0 when nothing answered */
  status: number;
  code?: string;
  message?: string;
  ms: number;
  error?: string;
  /** True when the answer is what a healthy login service gives to a made-up account */
  looksRight: boolean;
};

export function readJson(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isHealthyAnswer(status: number, body: Record<string, unknown> | null): boolean {
  if (status === 429) return true;
  const code = typeof body?.code === "string" ? body.code : "";
  const message = typeof body?.message === "string" ? body.message : "";
  return status === 401 && (code === "INVALID_EMAIL_OR_PASSWORD" || /invalid email or password/i.test(message));
}

/** "HTTP 404", "HTTP 401 INVALID_EMAIL_OR_PASSWORD", "no answer: fetch failed" */
export function describeProbe(p: Pick<Probe, "status" | "code" | "message" | "error">): string {
  if (p.status === 0) return p.error ? `no answer: ${p.error}` : "no answer";
  const what = p.code ?? p.message;
  return `HTTP ${p.status}${what ? ` ${what}` : ""}`;
}

/**
 * One sentence about the login service, or null when it looks fine.
 * `inside` is the made-up login handed straight to the service, `outside` the same login sent to the website's public address
 * (null when that address was not called).
 */
export function loginServiceVerdict(inside: Probe, outside: Probe | null): string | null {
  if (!inside.looksRight) {
    return `The login service fails its own test (${describeProbe(inside)}). Check MONGODB_URI, MONGODB_DB and BETTER_AUTH_SECRET, then redeploy.`;
  }
  // The server did not call its own public address, or could not reach it at all: only a hint, so it does not decide the verdict
  if (!outside || outside.status === 0 || outside.looksRight) return null;
  if (outside.status === 404) {
    return "The login service works inside the server, but the website's public address answers HTTP 404 for /api/auth/sign-in/email. The file src/app/api/auth/[...all]/route.ts is missing from what was deployed. Make sure it is in the repository, then redeploy.";
  }
  return `The login service works inside the server, but a login sent to the website's public address gets ${describeProbe(outside)}. Something in front of the website is answering instead of it (on Vercel, look at Settings, Deployment Protection, and at the Firewall).`;
}
