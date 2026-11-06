"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo, ThemeToggle } from "@/components/shell/brand";
import { NotificationBell, UserMenu } from "@/components/shell/user-controls";
import type { SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const SITE_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
  { href: "/notices", label: "Notices" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteNavbar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const loginHref = pathname === "/" ? "/login" : `/login?next=${encodeURIComponent(pathname)}`;
  return (
    <header className={cn("glass sticky top-0 z-40 border-b transition-colors", scrolled ? "border-base-content/10" : "border-transparent")}>
      <div className="wrap flex h-[4.5rem] items-center justify-between gap-2 sm:gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {SITE_LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link key={l.href} href={l.href} className={cn("relative rounded-full px-4 py-2 text-[0.95rem] font-semibold transition-colors", active ? "text-primary" : "text-base-content/70 hover:text-base-content")} aria-current={active ? "page" : undefined}>
                {l.label}
                {active && <motion.span layoutId="site-nav-active" className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-secondary" />}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden sm:contents">
                <NotificationBell />
              </span>
              <Link href="/dashboard" className="btn btn-primary btn-sm hidden sm:inline-flex">
                Dashboard
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link href={loginHref} className="btn btn-ghost btn-sm hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm hidden sm:inline-flex">
                Create account
              </Link>
            </>
          )}
          <button type="button" className="btn btn-ghost btn-circle lg:hidden" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden border-t border-base-content/10 lg:hidden" aria-label="Mobile">
            <div className="wrap grid gap-1 py-4">
              {SITE_LINKS.map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={l.href} className={cn("block rounded-xl px-4 py-3 text-lg font-semibold", pathname === l.href ? "bg-primary/10 text-primary" : "hover:bg-base-200")}>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              {user ? (
                <Link href="/dashboard" className="btn btn-primary mt-2">
                  Go to dashboard
                </Link>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link href={loginHref} className="btn btn-outline">
                    Log in
                  </Link>
                  <Link href="/register" className="btn btn-primary">
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
