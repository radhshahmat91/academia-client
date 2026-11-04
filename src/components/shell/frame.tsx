"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteNavbar } from "@/components/shell/site-navbar";
import { SocketProvider } from "@/components/socket-provider";
import { PageFade } from "@/components/ui/motion";
import type { SessionUser } from "@/lib/session";
import { isPrivatePath } from "@/lib/utils";

/** Pages that always use the marketing layout, even for a signed-in student */
const MARKETING = new Set(["/", "/about", "/contact"]);

/**
 * Chooses the layout for every page in the main site:
 * signed-out visitors get the public navbar and footer, signed-in students get the app shell with the sidebar.
 * The user comes from the server (cookie checked on every full page load), so there is no flash on reload.
 */
export function Frame({ user, children }: { user: SessionUser | null; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Safety net: a stale cookie reached a private page. Send them to log in and bring them back.
  useEffect(() => {
    if (!user && isPrivatePath(pathname)) router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
  }, [user, pathname, router]);

  if (!user && isPrivatePath(pathname)) return null;

  const content = <PageFade key={pathname}>{children}</PageFade>;

  if (!user) {
    return (
      <>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-content">
          Skip to content
        </a>
        <SiteNavbar user={null} />
        <main id="main">{content}</main>
        <SiteFooter />
      </>
    );
  }

  return (
    <SocketProvider userId={user.id}>
      {MARKETING.has(pathname) ? (
        <>
          <SiteNavbar user={user} />
          <main id="main">{content}</main>
          <SiteFooter />
        </>
      ) : (
        <AppShell user={user}>{content}</AppShell>
      )}
    </SocketProvider>
  );
}
