"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpenCheck, CheckCheck, LayoutDashboard, LogOut, MessagesSquare, ShieldCheck, UserRound, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/kit";
import { useAction, useGet, send } from "@/hooks/use-api";
import { clearToken } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { flash } from "@/lib/flash";
import type { SessionUser } from "@/lib/session";
import type { AppNotification } from "@/lib/types";
import { authErrorMessage, cn, NETWORK_MESSAGE, timeAgo } from "@/lib/utils";

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function Popover({ open, children, align = "right" }: { open: boolean; children: ReactNode; align?: "right" | "left" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.16 }} className={cn("absolute top-full z-50 mt-2 w-[min(92vw,22rem)] origin-top overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-2xl", align === "right" ? "right-0" : "left-0")}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ notification bell */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const router = useRouter();
  const { data } = useGet<{ items: AppNotification[]; unread: number }>("/notifications", { staleTime: 60_000 });
  const unread = data?.unread ?? 0;
  const [wiggle, setWiggle] = useState(0);
  useEffect(() => {
    if (unread > 0) setWiggle((n) => n + 1);
  }, [unread]);
  const markRead = useAction((ids?: string[]) => send("POST", "/notifications/read", ids ? { ids } : {}), { refresh: ["/notifications", "/dashboard"], silent: true });

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="btn btn-ghost btn-circle" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open}>
        <div className="indicator">
          <Bell key={wiggle} className={cn("size-5", wiggle > 0 && "animate-wiggle")} />
          {unread > 0 && <span className="indicator-item badge badge-secondary badge-xs h-4 min-w-4 px-1 text-[10px] font-bold">{unread > 9 ? "9+" : unread}</span>}
        </div>
      </button>
      <Popover open={open}>
        <div className="flex items-center justify-between border-b border-base-content/10 px-4 py-3">
          <h2 className="font-bold">Notifications</h2>
          {unread > 0 && (
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => markRead.mutate(undefined)}>
              <CheckCheck className="size-4" /> Mark all read
            </button>
          )}
        </div>
        <ul className="scroll-thin max-h-[22rem] overflow-y-auto">
          {(data?.items ?? []).slice(0, 8).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-base-200", !n.read && "bg-primary/5")}
                onClick={() => {
                  setOpen(false);
                  if (!n.read) markRead.mutate([n.id]);
                  if (n.link) router.push(n.link);
                }}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-secondary")} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug">{n.title}</span>
                  {n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-base-content/65">{n.body}</span>}
                  <span className="mt-1 block text-xs text-base-content/45">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
          {data && data.items.length === 0 && <li className="px-4 py-10 text-center text-sm text-base-content/55">You are all caught up.</li>}
        </ul>
        <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-base-content/10 px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-base-200">
          See all notifications
        </Link>
      </Popover>
    </div>
  );
}

/* ------------------------------------------------------------------ account menu */
export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const qc = useQueryClient();

  async function signOut() {
    setOpen(false);
    const attempt = await authClient.signOut().catch(() => null);
    if (!attempt || attempt.error) {
      toast.error(attempt?.error ? authErrorMessage(attempt.error, "We could not sign you out. Please try again.") : NETWORK_MESSAGE);
      return;
    }
    clearToken();
    qc.clear();
    // Load the Home page in full: the browser still holds pages and pre-loaded links from the time you were signed in.
    flash("You are signed out");
    window.location.replace("/");
  }

  const item = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-base-200";
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-base-content/5" aria-label="Account menu" aria-expanded={open}>
        <Avatar name={user.name} src={user.image} size={38} />
      </button>
      <Popover open={open}>
        <div className="flex items-center gap-3 border-b border-base-content/10 px-4 py-4">
          <Avatar name={user.name} src={user.image} size={44} />
          <div className="min-w-0">
            <p className="truncate font-bold">{user.name}</p>
            <p className="truncate text-sm text-base-content/60">{user.email}</p>
          </div>
        </div>
        <nav className="grid gap-0.5 p-2" onClick={() => setOpen(false)}>
          <Link href="/dashboard" className={item}>
            <LayoutDashboard className="size-4.5" /> Dashboard
          </Link>
          <Link href="/profile" className={item}>
            <UserRound className="size-4.5" /> My profile
          </Link>
          <Link href="/my-courses" className={item}>
            <BookOpenCheck className="size-4.5" /> Semester courses
          </Link>
          <Link href="/fees" className={item}>
            <Wallet className="size-4.5" /> Fees
          </Link>
          <Link href="/messages" className={item}>
            <MessagesSquare className="size-4.5" /> Messages
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className={item}>
              <ShieldCheck className="size-4.5" /> Admin panel
            </Link>
          )}
        </nav>
        <div className="border-t border-base-content/10 p-2">
          <button type="button" onClick={signOut} className={cn(item, "w-full text-error hover:bg-error/10")}>
            <LogOut className="size-4.5" /> Sign out
          </button>
        </div>
      </Popover>
    </div>
  );
}
