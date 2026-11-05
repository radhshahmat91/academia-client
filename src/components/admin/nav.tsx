"use client";

import { BookOpen, CalendarDays, GraduationCap, Inbox, LayoutDashboard, Layers, Megaphone, Route, ScrollText, Star, Ticket, Users, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon };

export const ADMIN_LINKS: { title: string; items: Item[] }[] = [
  { title: "Overview", items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }] },
  {
    title: "Content",
    items: [
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/clubs", label: "Clubs", icon: UsersRound },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/notices", label: "Notices", icon: Megaphone },
    ],
  },
  {
    title: "Academics",
    items: [
      { href: "/admin/semesters", label: "Semesters", icon: Layers },
      { href: "/admin/sections", label: "Sections", icon: ScrollText },
      { href: "/admin/grades", label: "Grades", icon: GraduationCap },
      { href: "/admin/evaluations", label: "Evaluations", icon: Star },
    ],
  },
  {
    title: "Money and travel",
    items: [
      { href: "/admin/finance", label: "Fees and payments", icon: Wallet },
      { href: "/admin/routes", label: "Bus routes", icon: Route },
      { href: "/admin/passes", label: "Bus passes", icon: Ticket },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/inbox", label: "Inbox", icon: Inbox },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="Admin sections" className="no-print -mx-1 mb-6 overflow-x-auto no-scrollbar px-1 pb-1 lg:overflow-visible">
      <ul className="flex w-max items-center gap-x-1.5 gap-y-2 lg:w-auto lg:flex-wrap">
        {ADMIN_LINKS.flatMap((g, gi) =>
          g.items.map((it, i) => (
            <li key={it.href} className={cn("flex items-center", gi > 0 && i === 0 && "lg:ml-2 lg:border-l lg:border-base-content/15 lg:pl-3.5")}>
              <Link
                href={it.href}
                aria-current={active(it.href) ? "page" : undefined}
                className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors", active(it.href) ? "border-primary bg-primary text-primary-content" : "border-base-content/12 bg-base-100 text-base-content/75 hover:border-primary/40 hover:text-primary")}
              >
                <it.icon className="size-4" /> {it.label}
              </Link>
            </li>
          )),
        )}
      </ul>
    </nav>
  );
}

