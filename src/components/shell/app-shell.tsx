"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Bus, CalendarDays, ClipboardList, Contact, GraduationCap, LayoutDashboard, Megaphone, Menu, MessagesSquare, ShieldCheck, Star, Users, Wallet, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo, ThemeToggle } from "@/components/shell/brand";
import { NotificationBell, UserMenu } from "@/components/shell/user-controls";
import { Avatar } from "@/components/ui/kit";
import { useGet } from "@/hooks/use-api";
import type { SessionUser } from "@/lib/session";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: "messages" };
const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Learn",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/my-courses", label: "Semester courses", icon: GraduationCap },
      { href: "/registration", label: "Registration", icon: ClipboardList },
      { href: "/evaluation", label: "Course evaluation", icon: Star },
    ],
  },
  {
    title: "Campus",
    items: [
      { href: "/messages", label: "Messages", icon: MessagesSquare, badge: "messages" },
      { href: "/clubs", label: "Clubs", icon: Users },
      { href: "/events", label: "Events", icon: CalendarDays },
      { href: "/notices", label: "Notices", icon: Megaphone },
      { href: "/students", label: "Students", icon: Contact },
    ],
  },
  {
    title: "Money and travel",
    items: [
      { href: "/fees", label: "Fees", icon: Wallet },
      { href: "/transport", label: "Transport", icon: Bus },
    ],
  },
];

function Sidebar({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data } = useGet<{ items: Conversation[] }>("/chat/conversations", { staleTime: 60_000 });
  const unread = (data?.items ?? []).reduce((n, c) => n + c.unread, 0);
  const groups = user.role === "admin" ? [...NAV, { title: "Administration", items: [{ href: "/admin", label: "Admin panel", icon: ShieldCheck }] }] : NAV;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Logo />
      </div>
      <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="Student navigation" onClick={onNavigate}>
        {groups.map((g) => (
          <div key={g.title} className="mt-4 first:mt-1">
            <p className="px-3 pb-1.5 text-sm font-semibold text-base-content/45">{g.title}</p>
            <ul className="grid gap-0.5">
              {g.items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
                const count = it.badge === "messages" ? unread : 0;
                return (
                  <li key={it.href}>
                    <Link href={it.href} aria-current={active ? "page" : undefined} className={cn("relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-semibold transition-colors", active ? "text-primary" : "text-base-content/70 hover:bg-base-200 hover:text-base-content")}>
                      {active && <motion.span layoutId="app-nav-active" className="absolute inset-0 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                      <it.icon className="relative size-[1.15rem]" />
                      <span className="relative flex-1">{it.label}</span>
                      {count > 0 && <span className="badge badge-secondary badge-sm relative font-bold">{count > 99 ? "99+" : count}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <Link href="/profile" onClick={onNavigate} className="m-3 flex items-center gap-3 rounded-2xl border border-base-content/10 bg-base-200/60 p-3 transition-colors hover:border-primary/30">
        <Avatar name={user.name} src={user.image} size={40} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{user.name}</span>
          <span className="block truncate text-xs text-base-content/55">{user.role === "admin" ? "Administrator" : "View profile"}</span>
        </span>
      </Link>
    </div>
  );
}

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="no-print sticky top-0 hidden h-dvh border-r border-base-content/10 bg-base-100 lg:block">
        <Sidebar user={user} />
      </aside>

      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-neutral/55 backdrop-blur-sm" onClick={() => setDrawer(false)} aria-hidden="true" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 320 }} className="absolute inset-y-0 left-0 w-[17.5rem] max-w-[85vw] bg-base-100 shadow-2xl">
              <button type="button" className="btn btn-ghost btn-sm btn-circle absolute top-4 right-3" onClick={() => setDrawer(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
              <Sidebar user={user} onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-w-0">
        <header className="glass no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-base-content/10 px-4 sm:px-6 lg:px-8">
          <button type="button" className="btn btn-ghost btn-circle lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu className="size-6" />
          </button>
          <Logo compact className="lg:hidden" />
          <div className="flex-1" />
          <Link href="/" className="btn btn-ghost btn-sm hidden sm:inline-flex">
            Home
          </Link>
          <ThemeToggle />
          <NotificationBell />
          <UserMenu user={user} />
        </header>
        <main id="main" className="mx-auto w-full max-w-[84rem] px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
