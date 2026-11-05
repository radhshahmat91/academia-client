"use client";

import { Bell, Bus, CalendarDays, CheckCheck, ClipboardList, MessagesSquare, Star, Users, Wallet, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, ErrorState, PageHeader, Tabs } from "@/components/ui/kit";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { send, useAction, useGet } from "@/hooks/use-api";
import type { AppNotification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const ICONS: Record<string, { Icon: LucideIcon; cls: string }> = {
  registration: { Icon: ClipboardList, cls: "bg-primary/10 text-primary" },
  payment: { Icon: Wallet, cls: "bg-success/12 text-success" },
  event: { Icon: CalendarDays, cls: "bg-secondary/25 text-secondary-content dark:text-secondary" },
  club: { Icon: Users, cls: "bg-info/12 text-info" },
  transport: { Icon: Bus, cls: "bg-info/12 text-info" },
  message: { Icon: MessagesSquare, cls: "bg-primary/10 text-primary" },
  evaluation: { Icon: Star, cls: "bg-warning/18 text-warning-content dark:text-warning" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useGet<{ items: AppNotification[]; unread: number }>("/notifications", { staleTime: 60_000 });
  const [tab, setTab] = useState<"all" | "unread">("all");
  const read = useAction((ids?: string[]) => send("POST", "/notifications/read", ids ? { ids } : {}), { refresh: ["/notifications", "/dashboard"], silent: true });
  const readAll = useAction(() => send("POST", "/notifications/read", {}), { refresh: ["/notifications", "/dashboard"], success: "All notifications are marked as read" });

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;
  const items = (data?.items ?? []).filter((n) => tab === "all" || !n.read);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        sub="Payments, registration, events, clubs and messages that need your attention."
        actions={
          !!data?.unread && (
            <button type="button" className="btn btn-outline btn-sm" disabled={readAll.isPending} onClick={() => readAll.mutate()}>
              <CheckCheck className="size-4" /> Mark all as read
            </button>
          )
        }
      />
      <Tabs
        tabs={[
          { value: "all", label: "All", count: data?.items.length },
          { value: "unread", label: "Unread", count: data?.unread },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="pt-6">
        {isLoading || !data ? (
          <div className="grid gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={<Bell className="size-7" />} title={tab === "unread" ? "No unread notifications" : "Nothing here yet"} body={tab === "unread" ? "You have read everything. Nice." : "When something happens on your account you will see it here."} />
        ) : (
          <Stagger className="grid gap-3" gap={0.04}>
            {items.map((n) => {
              const meta = ICONS[n.type] ?? { Icon: Bell, cls: "bg-base-200 text-base-content/70" };
              return (
                <StaggerItem key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read) read.mutate([n.id]);
                      if (n.link) router.push(n.link);
                    }}
                    className={cn("surface card-lift flex w-full items-start gap-4 p-5 text-left", !n.read && "border-primary/30 bg-primary/5")}
                  >
                    <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", meta.cls)}>
                      <meta.Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className={cn("leading-snug", n.read ? "font-semibold" : "font-extrabold")}>{n.title}</span>
                        <span className="shrink-0 text-xs text-base-content/50">{timeAgo(n.createdAt)}</span>
                      </span>
                      {n.body && <span className="mt-1 block text-[0.95rem] text-base-content/70">{n.body}</span>}
                    </span>
                    {!n.read && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-secondary" aria-label="Unread" />}
                  </button>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </div>
    </div>
  );
}
