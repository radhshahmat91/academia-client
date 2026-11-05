"use client";

import { MessageSquarePlus, MessagesSquare, SearchX, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ChatPane } from "@/components/chat/chat-pane";
import { NewChat } from "@/components/chat/new-chat";
import { useSocket } from "@/components/socket-provider";
import { Avatar, EmptyState, ErrorState, Pill, SearchBox } from "@/components/ui/kit";
import { useGet } from "@/hooks/use-api";
import type { Conversation, Me } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

type Seg = "all" | "direct" | "group";
const SEGS: { value: Seg; label: string }[] = [
  { value: "all", label: "All" },
  { value: "direct", label: "People" },
  { value: "group", label: "Groups" },
];

function Row({ c, active, online, meId, onOpen }: { c: Conversation; active: boolean; online: boolean; meId: string; onOpen: () => void }) {
  const group = c.kind === "group";
  return (
    <li>
      <button type="button" onClick={onOpen} aria-current={active ? "true" : undefined} className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors", active ? "bg-primary/10" : "hover:bg-base-200/70")}>
        <Avatar name={c.name} src={c.image} size={50} online={group ? undefined : online} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate", c.unread ? "font-extrabold" : "font-semibold")}>{c.name}</span>
            {c.last && <span className={cn("shrink-0 text-xs", c.unread ? "font-bold text-primary" : "text-base-content/50")}>{timeAgo(c.last.at)}</span>}
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className={cn("truncate text-sm", c.unread ? "font-semibold text-base-content" : "text-base-content/60")}>{c.last ? `${c.last.sender === meId ? "You: " : ""}${c.last.text}` : group ? `${c.memberCount} members` : "No messages yet"}</span>
            {c.unread > 0 && <span className="grid min-w-6 shrink-0 place-items-center rounded-full bg-secondary px-1.5 py-0.5 text-xs font-extrabold text-secondary-content">{c.unread > 99 ? "99+" : c.unread}</span>}
          </span>
          {group && c.refKind && (
            <span className="mt-1 inline-block">
              <Pill tone={c.refKind === "club" ? "secondary" : "info"}>{c.refKind === "club" ? "Club" : "Course"}</Pill>
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function Messages() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("c");
  const me = useGet<Me>("/me", { staleTime: 300_000 });
  const list = useGet<{ items: Conversation[]; online: string[] }>("/chat/conversations", { refetchInterval: 90_000 });
  const { online: live, connected } = useSocket();
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<Seg>("all");
  const [newOpen, setNewOpen] = useState(false);

  const online = useMemo(() => (live.size ? live : new Set(list.data?.online ?? [])), [live, list.data?.online]);
  const items = list.data?.items ?? [];
  const needle = q.trim().toLowerCase();
  const shown = items.filter((c) => (seg === "all" || c.kind === seg) && (!needle || c.name.toLowerCase().includes(needle)));
  const open = (id: string | null) => router.replace(id ? `/messages?c=${id}` : "/messages", { scroll: false });

  if (list.isError) return <ErrorState message={list.error?.message} retry={() => list.refetch()} />;
  const meId = me.data?.id;

  return (
    <div className="grid h-[calc(100dvh-9rem)] min-h-[32rem] overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm lg:grid-cols-[23rem_1fr]">
      <section className={cn("min-h-0 flex-col border-r border-base-content/10", active ? "hidden lg:flex" : "flex")} aria-label="Conversations">
        <div className="grid gap-3 border-b border-base-content/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="h-section flex items-center gap-2 text-2xl">
              Messages
              <span title={connected ? "Live: messages arrive instantly" : "Offline: reconnecting"} className={cn("size-2.5 rounded-full", connected ? "bg-success" : "bg-base-300")} aria-label={connected ? "Connected" : "Reconnecting"} />
            </h1>
            <button type="button" onClick={() => setNewOpen(true)} className="btn btn-primary btn-sm">
              <MessageSquarePlus className="size-4" /> New
            </button>
          </div>
          <SearchBox value={q} onChange={setQ} placeholder="Search chats" />
          <div role="tablist" className="flex gap-1.5">
            {SEGS.map((s) => (
              <button key={s.value} type="button" role="tab" aria-selected={seg === s.value} onClick={() => setSeg(s.value)} className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors", seg === s.value ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/70 hover:bg-base-300")}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          {list.isLoading ? (
            <div className="grid gap-4 p-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton size-12 rounded-full" />
                  <div className="grid flex-1 gap-2">
                    <div className="skeleton h-4 w-1/2 rounded" />
                    <div className="skeleton h-3 w-4/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={q ? <SearchX className="size-6" /> : <Users className="size-6" />} title={q ? "No chats match" : seg === "group" ? "No group chats yet" : "No chats yet"} body={q ? "Try another name." : "Join a club or register for courses to get group chats, or message a classmate."} action={!q ? <button type="button" className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}>Start a conversation</button> : undefined} />
            </div>
          ) : (
            <ul className="divide-y divide-base-content/6">
              {shown.map((c) => (
                <Row key={c.id} c={c} meId={meId ?? ""} active={c.id === active} online={!!c.otherId && online.has(c.otherId)} onOpen={() => open(c.id)} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={cn("min-h-0 min-w-0", active ? "block" : "hidden lg:block")} aria-label="Conversation">
        {active && meId ? (
          <ChatPane key={active} id={active} meId={meId} onBack={() => open(null)} />
        ) : (
          <div className="grid h-full place-items-center p-8 text-center">
            <div className="max-w-sm">
              <span className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-primary/10 text-primary">
                <MessagesSquare className="size-9" />
              </span>
              <h2 className="h-section text-2xl">Pick a conversation</h2>
              <p className="mt-2 text-base-content/65">Choose a chat on the left, or message a classmate. Everything you send arrives in real time.</p>
              <button type="button" className="btn btn-primary mt-5" onClick={() => setNewOpen(true)}>
                <MessageSquarePlus className="size-4" /> New message
              </button>
            </div>
          </div>
        )}
      </section>

      <NewChat open={newOpen} onClose={() => setNewOpen(false)} onPicked={(id) => open(id)} />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[32rem] w-full rounded-3xl" />}>
      <Messages />
    </Suspense>
  );
}
