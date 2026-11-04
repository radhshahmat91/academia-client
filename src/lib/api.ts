import { authClient } from "./auth-client";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
export const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL ?? API_URL).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* The Express API trusts the JWT that BetterAuth signs. We keep it in memory and renew it shortly before it expires. */
let cached: { token: string; exp: number } | null = null;
let inflight: Promise<string | null> | null = null;

const decodeExp = (token: string) => {
  try {
    const part = token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    return Number(JSON.parse(atob(part)).exp) * 1000;
  } catch {
    return Date.now() + 5 * 60_000;
  }
};

export const clearToken = () => {
  cached = null;
};

export async function getToken(force = false): Promise<string | null> {
  if (!force && cached && cached.exp - Date.now() > 30_000) return cached.token;
  inflight ??= (async () => {
    try {
      const { data } = await authClient.token();
      const token = data?.token ?? null;
      cached = token ? { token, exp: decodeExp(token) } : null;
      return token;
    } catch {
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

type Init = { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal };

export async function api<T = unknown>(path: string, { method = "GET", body, auth = true, signal }: Init = {}): Promise<T> {
  const send = (token: string | null) =>
    fetch(`${API_URL}/api${path}`, {
      method,
      signal,
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res: Response;
  try {
    res = await send(auth ? await getToken() : null);
    if (res.status === 401 && auth) res = await send(await getToken(true));
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError("We could not reach the server. Check your connection and try again.", 0);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message = (data as { message?: string } | null)?.message ?? (res.status === 401 ? "Please log in again to continue." : "Something went wrong. Please try again.");
    throw new ApiError(message, res.status);
  }
  return data as T;
}
