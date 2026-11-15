import { headers } from "next/headers";
import { auth, siteURL } from "@/lib/auth";
import { isHealthyAnswer, loginServiceVerdict, readJson, type Probe } from "@/lib/auth-probe";

export const dynamic = "force-dynamic";

const say = (e: unknown) => String((e as { message?: string } | null)?.message ?? e).slice(0, 240);

// A login that no account matches. It creates nothing and changes nothing.
const MADE_UP_LOGIN = JSON.stringify({ email: "auth-check@example.invalid", password: "not-a-real-password-1" });
const LOGIN_PATH = "/api/auth/sign-in/email";

async function probe(via: string, send: () => Promise<Response>): Promise<Probe> {
  const t0 = Date.now();
  try {
    const res = await send();
    const text = await res.text();
    const json = readJson(text);
    return {
      via,
      status: res.status,
      code: typeof json?.code === "string" ? json.code : undefined,
      message: typeof json?.message === "string" ? json.message : json ? undefined : text.replace(/\s+/g, " ").trim().slice(0, 100) || undefined,
      ms: Date.now() - t0,
      looksRight: isHealthyAnswer(res.status, json),
    };
  } catch (e) {
    return { via, status: 0, error: say(e), ms: Date.now() - t0, looksRight: false };
  }
}

/**
 * "What does the server see for this browser?" Open /api/auth-check right after a login to tell apart a cookie problem,
 * an address problem, a database problem and a login service that is not answering properly. It shows names and yes/no
 * answers only, never a secret or a cookie value.
 * It is safe to leave in place; delete this file if you would rather not have it.
 */
export async function GET() {
  const h = await headers();
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host") || "";
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  const openedAt = `${proto}://${host}`;
  const cookieNames = (h.get("cookie") ?? "").split(";").map((c) => c.split("=")[0]!.trim()).filter(Boolean);
  const loginCookieSent = cookieNames.some((n) => /better-auth\.session_token$/.test(n));

  let configuredOrigin = siteURL;
  try {
    configuredOrigin = new URL(siteURL).origin;
  } catch {
    /* shown as written */
  }

  // The session, read the same way every page reads it
  const session: { signedIn: boolean; email?: string; error?: string } = { signedIn: false };
  try {
    const s = await auth.api.getSession({ headers: h });
    if (s?.user) Object.assign(session, { signedIn: true, email: s.user.email });
  } catch (e) {
    session.error = say(e);
  }

  // The database, asked through the same connection BetterAuth uses
  const database: { reachable: boolean; ms?: number; users?: number; sessions?: number; error?: string } = { reachable: false };
  let trusted: string[] = [];
  try {
    const ctx = await auth.$context;
    trusted = ctx.trustedOrigins;
    const t0 = Date.now();
    database.users = await ctx.adapter.count({ model: "user" });
    database.sessions = await ctx.adapter.count({ model: "session" });
    database.ms = Date.now() - t0;
    database.reachable = true;
  } catch (e) {
    database.error = say(e);
  }

  // The login service itself: the made-up login handed straight to it, and the same one sent to the website's public address
  const [inside, outside] = await Promise.all([
    probe("inside the server", () => auth.handler(new Request(`${openedAt}${LOGIN_PATH}`, { method: "POST", headers: { "content-type": "application/json" }, body: MADE_UP_LOGIN }))),
    probe("through the website's public address", () => fetch(`${openedAt}${LOGIN_PATH}`, { method: "POST", headers: { "content-type": "application/json" }, body: MADE_UP_LOGIN, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(8000) })),
  ]);
  const serviceVerdict = database.reachable ? loginServiceVerdict(inside, outside) : null;

  const secretSet = !!process.env.BETTER_AUTH_SECRET;
  const addressTrusted = trusted.some((o) => o.replace(/\/+$/, "") === openedAt);

  let verdict: string;
  if (!secretSet) verdict = "BETTER_AUTH_SECRET is missing on this server. Add it in the website's environment variables and redeploy.";
  else if (!database.reachable) verdict = `The website cannot reach its database (${database.error}). Check MONGODB_URI and MONGODB_DB, and that Atlas Network Access allows 0.0.0.0/0.`;
  else if (!addressTrusted) verdict = `This page was opened at ${openedAt}, but the website is set up for ${configuredOrigin}. Set BETTER_AUTH_URL to ${openedAt} and redeploy.`;
  else if (serviceVerdict) verdict = serviceVerdict;
  else if (!loginCookieSent) verdict = "No login cookie reached the server. If you have just logged in, your browser refused to keep it: check the cookie settings for this site, turn off extensions that clear cookies, or try a private window.";
  else if (!session.signedIn) verdict = `A login cookie arrived, but the server could not use it${session.error ? ` (${session.error})` : ""}. This happens when BETTER_AUTH_SECRET was changed after the login, or the session is missing from the database. Log in again.`;
  else verdict = `All good: the server sees you signed in as ${session.email}.`;

  const body = {
    verdict,
    time: new Date().toISOString(),
    address: { openedAt, configuredFor: configuredOrigin, trustedByLogin: addressTrusted, onVercel: !!process.env.VERCEL },
    settings: {
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ? "set" : "missing",
      BETTER_AUTH_SECRET: secretSet ? "set" : "missing",
      MONGODB_URI: process.env.MONGODB_URI ? "set" : "missing",
      MONGODB_DB: process.env.MONGODB_DB ?? "(not set, using academiaconnect)",
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "(not set)",
    },
    cookies: { namesSent: cookieNames, loginCookieSent },
    session,
    database,
    loginService: { madeUpLoginInsideServer: inside, madeUpLoginThroughPublicAddress: outside },
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
