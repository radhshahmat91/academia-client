import { cache } from "react";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { auth } from "./auth";

/** The signed-in user for this request, or null. Cached for the duration of one render. */
export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    // Next.js uses errors of its own to decide how a page is rendered; they must not be swallowed here
    unstable_rethrow(error);
    // A real failure (usually the database). The visitor is treated as signed out, and the reason is kept in the server log.
    console.error("[AcademiaConnect] Could not read the session:", error);
    return null;
  }
});

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "student" | "admin";
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const s = await getSession();
  if (!s?.user) return null;
  const u = s.user as typeof s.user & { role?: string };
  return { id: u.id, name: u.name, email: u.email, image: u.image ?? null, role: u.role === "admin" ? "admin" : "student" };
}
