"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronUp, Send, Users, WifiOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/components/socket-provider";
import { Avatar, ErrorState } from "@/components/ui/kit";
import { send } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { ChatMessage, Conversation, Person } from "@/lib/types";
import { cn, dayDistance, fmtDate, fmtDay, fmtTime } from "@/lib/utils";

type Loaded = { conversation: Conversation; items: ChatMessage[]; hasMore: boolean; people: Record<string, Person>; members: string[] };
type ConvCache = { items: Conversation[]; online: string[] };
const CONV_KEY = ["/chat/conversations"];
const FIVE_MIN = 5 * 60_000;

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/g;
function Linkify({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_RE).map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-2">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/** Adds a message once: ignores repeats, and swaps out the grey "sending" copy of our own message. */
function merge(items: ChatMessage[], msg: ChatMessage, me: string) {
  if (items.some((m) => m.id === msg.id)) return items;
  let out = items;
  if (msg.sender === me) {
    const i = items.findIndex((m) => m.pending && m.text === msg.text);
    if (i >= 0) out = items.filter((_, k) => k !== i);
  }
  return [...out, msg];
}

const dayLabel = (iso: string) => {
  const d = dayDistance(iso);
  return d === "today" ? "Today" : d === "yesterday" ? "Yesterday" : fmtDay(iso);
};

export function ChatPane({ id, meId, onBack }: { id: string; meId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const { socket, connected, online, activeChat } = useSocket();
  const [state, setState] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [typers, setTypers] = useState<Record<string, string>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const typingSent = useRef(0);
  const typingOff = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typerTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const tmp = useRef(0);

  /* ---- load the conversation ---- */
  useEffect(() => {
    let off = false;
    setState(null);
    setError(null);
    setTypers({});
    setDraft("");
    stick.current = true;
    api<Loaded>(`/chat/conversations/${id}/messages?limit=40`)
      .then((res) => !off && setState(res))
      .catch((e: Error) => !off && setError(e.message));
    return () => {
      off = true;
    };
  }, [id]);

  /* ---- reading ---- */
  const markRead = useCallback(() => {
    if (socket?.connected) socket.emit("conversation:read", { conversationId: id });
    else void send("POST", `/chat/conversations/${id}/read`).catch(() => {});
    qc.setQueryData<ConvCache>(CONV_KEY, (old) => (old ? { ...old, items: old.items.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) } : old));
  }, [socket, id, qc]);

  useEffect(() => {
    activeChat.current = id;
    return () => {
      if (activeChat.current === id) activeChat.current = null;
    };
  }, [id, activeChat]);

  useEffect(() => {
    if (state) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.conversation.id, connected]);

  /* ---- live events ---- */
  useEffect(() => {
    if (!socket) return;
    const onNew = (p: { message: ChatMessage; conversationId: string; person: Person }) => {
      if (p.conversationId !== id) return;
      setState((s) => (s ? { ...s, items: merge(s.items, p.message, meId), people: s.people[p.person.id] ? s.people : { ...s.people, [p.person.id]: p.person } } : s));
      if (p.message.sender !== meId) {
        markRead();
        setTypers((t) => {
          const { [p.message.sender]: _gone, ...rest } = t;
          return rest;
        });
      }
    };
    const onTyping = (p: { conversationId: string; userId: string; name: string; typing: boolean }) => {
      if (p.conversationId !== id || p.userId === meId) return;
      clearTimeout(typerTimers.current[p.userId]);
      if (p.typing) {
        setTypers((t) => ({ ...t, [p.userId]: p.name }));
        typerTimers.current[p.userId] = setTimeout(() => setTypers(({ [p.userId]: _x, ...rest }) => rest), 4500);
      } else setTypers(({ [p.userId]: _x, ...rest }) => rest);
    };
    const onRead = (p: { conversationId: string; userId: string }) => {
      if (p.conversationId !== id || p.userId === meId) return;
      setState((s) => (s ? { ...s, items: s.items.map((m) => (m.sender === meId && !m.readBy?.includes(p.userId) ? { ...m, readBy: [...(m.readBy ?? []), p.userId] } : m)) } : s));
    };
    socket.on("message:new", onNew);
    socket.on("typing", onTyping);
    socket.on("message:read", onRead);
    const timers = typerTimers.current;
    return () => {
      socket.off("message:new", onNew);
      socket.off("typing", onTyping);
      socket.off("message:read", onRead);
      Object.values(timers).forEach(clearTimeout);
    };
  }, [socket, id, meId, markRead]);

  /* ---- scrolling ---- */
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const last = state?.items[state.items.length - 1];
    if (stick.current || last?.sender === meId) el.scrollTop = el.scrollHeight;
  }, [state?.items.length, typers, meId, state]);

  function onScroll() {
    const el = listRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  }

  async function loadEarlier() {
    if (!state || loadingMore || !state.items[0]) return;
    setLoadingMore(true);
    const el = listRef.current;
    const before = el?.scrollHeight ?? 0;
    try {
      const res = await api<Loaded>(`/chat/conversations/${id}/messages?limit=40&before=${encodeURIComponent(state.items[0].createdAt)}`);
      stick.current = false;
      setState((s) => (s ? { ...s, items: [...res.items, ...s.items], hasMore: res.hasMore, people: { ...res.people, ...s.people } } : s));
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - before;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load earlier messages");
    } finally {
      setLoadingMore(false);
    }
  }

  /* ---- typing + sending ---- */
  function emitTyping(on: boolean) {
    if (socket?.connected) socket.emit("typing", { conversationId: id, typing: on });
  }
  function onType(v: string) {
    setDraft(v);
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
    if (!v.trim()) return;
    if (Date.now() - typingSent.current > 2500) {
      typingSent.current = Date.now();
      emitTyping(true);
    }
    if (typingOff.current) clearTimeout(typingOff.current);
    typingOff.current = setTimeout(() => {
      typingSent.current = 0;
      emitTyping(false);
    }, 2200);
  }

  async function submit() {
    const text = draft.trim();
    if (!text || !state) return;
    const pending: ChatMessage = { id: `tmp-${++tmp.current}`, conversation: id, sender: meId, text, createdAt: new Date().toISOString(), readBy: [meId], pending: true };
    stick.current = true;
    setState((s) => (s ? { ...s, items: [...s.items, pending] } : s));
    setDraft("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    if (typingOff.current) clearTimeout(typingOff.current);
    typingSent.current = 0;
    emitTyping(false);
    try {
      const saved = socket?.connected
        ? await new Promise<ChatMessage>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("The server took too long to answer")), 8000);
            socket.emit("message:send", { conversationId: id, text }, (ack: { ok: boolean; data?: ChatMessage; message?: string }) => {
              clearTimeout(timer);
              if (ack?.ok && ack.data) resolve(ack.data);
              else reject(new Error(ack?.message ?? "Could not send the message"));
            });
          })
        : await send<ChatMessage>("POST", `/chat/conversations/${id}/messages`, { text });
      setState((s) => (s ? { ...s, items: merge(s.items.filter((m) => m.id !== pending.id), saved, meId) } : s));
      qc.setQueryData<ConvCache>(CONV_KEY, (old) => {
        if (!old) return old;
        const i = old.items.findIndex((c) => c.id === id);
        if (i < 0) return old;
        const upd = { ...old.items[i]!, last: { text: text.slice(0, 140), sender: meId, at: saved.createdAt } };
        return { ...old, items: [upd, ...old.items.filter((_, k) => k !== i)] };
      });
    } catch (e) {
      setState((s) => (s ? { ...s, items: s.items.filter((m) => m.id !== pending.id) } : s));
      setDraft((d) => d || text);
      toast.error(e instanceof Error ? e.message : "Could not send the message");
    }
  }

  /* ---- render ---- */
  if (error) return <div className="grid h-full place-items-center p-6"><ErrorState message={error} retry={() => setError(null)} /></div>;
  if (!state)
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-base-content/10 p-4">
          <div className="skeleton size-11 rounded-full" />
          <div className="skeleton h-5 w-40 rounded" />
        </div>
        <div className="grid flex-1 content-end gap-3 p-6">
          {[60, 40, 70, 30].map((w, i) => (
            <div key={i} className={cn("skeleton h-10 rounded-2xl", i % 2 ? "justify-self-end" : "justify-self-start")} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );

  const { conversation: c, items, people } = state;
  const group = c.kind === "group";
  const otherOnline = !!c.otherId && online.has(c.otherId);
  const typingNames = Object.values(typers);
  const lastMine = [...items].reverse().find((m) => m.sender === meId)?.id;
  const headHref = group ? (c.refKind === "club" ? `/clubs/${c.refId}` : c.refKind === "course" ? `/courses/${c.refId}` : null) : c.otherId ? `/students/${c.otherId}` : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-base-content/10 px-3 py-3 sm:px-5">
        <button type="button" onClick={onBack} aria-label="Back to all chats" className="btn btn-ghost btn-sm btn-circle lg:hidden">
          <ArrowLeft className="size-5" />
        </button>
        <Avatar name={c.name} src={c.image} size={44} online={group ? undefined : otherOnline} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg leading-tight font-bold">{headHref ? <Link href={headHref} className="hover:text-primary">{c.name}</Link> : c.name}</h2>
          <p className="truncate text-sm text-base-content/60" aria-live="polite">
            {typingNames.length ? (
              <span className="font-medium text-primary">{group ? `${typingNames.slice(0, 2).join(" and ")} ${typingNames.length > 1 ? "are" : "is"} typing` : "typing"}…</span>
            ) : group ? (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" /> {c.memberCount} members{c.refKind ? ` · ${c.refKind} group` : ""}
              </span>
            ) : otherOnline ? (
              <span className="text-success">Online now</span>
            ) : (
              c.department ?? "Offline"
            )}
          </p>
        </div>
      </header>

      <div ref={listRef} onScroll={onScroll} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6" role="log" aria-label="Messages">
        {state.hasMore && (
          <div className="mb-3 grid place-items-center">
            <button type="button" className="btn btn-ghost btn-xs" onClick={loadEarlier} disabled={loadingMore}>
              {loadingMore ? <span className="loading loading-spinner loading-xs" /> : <ChevronUp className="size-4" />} Load earlier messages
            </button>
          </div>
        )}
        {items.length === 0 && (
          <div className="grid h-full place-items-center text-center text-base-content/60">
            <div>
              <p className="text-lg font-semibold text-base-content/80">{group ? "No messages yet" : `Say hello to ${c.name.split(" ")[0]}`}</p>
              <p>Messages arrive instantly while you are both online.</p>
            </div>
          </div>
        )}
        {items.map((m, i) => {
          const prev = items[i - 1];
          const next = items[i + 1];
          const mine = m.sender === meId;
          const newDay = !prev || fmtDate(prev.createdAt) !== fmtDate(m.createdAt);
          const starts = newDay || prev!.sender !== m.sender || +new Date(m.createdAt) - +new Date(prev!.createdAt) > FIVE_MIN;
          const ends = !next || next.sender !== m.sender || fmtDate(next.createdAt) !== fmtDate(m.createdAt) || +new Date(next.createdAt) - +new Date(m.createdAt) > FIVE_MIN;
          const who = people[m.sender];
          const seen = !group && !!c.otherId && !!m.readBy?.includes(c.otherId);
          return (
            <div key={m.id}>
              {newDay && (
                <p className="my-4 text-center">
                  <span className="rounded-full bg-base-200 px-3 py-1 text-xs font-semibold text-base-content/60">{dayLabel(m.createdAt)}</span>
                </p>
              )}
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start", starts ? "mt-3" : "mt-0.5")}>
                {!mine && group && <span className="w-8 shrink-0">{ends && <Avatar name={who?.name} src={who?.image} size={32} />}</span>}
                <div className={cn("flex max-w-[82%] flex-col sm:max-w-[68%]", mine ? "items-end" : "items-start")}>
                  {!mine && group && starts && <p className="mb-0.5 ml-1 text-xs font-semibold text-base-content/60">{who?.name ?? "Student"}</p>}
                  <p className={cn("px-4 py-2.5 text-[0.95rem] leading-snug break-words whitespace-pre-wrap", mine ? "bg-primary text-primary-content" : "bg-base-200", mine ? (ends ? "rounded-2xl rounded-br-md" : "rounded-2xl") : ends ? "rounded-2xl rounded-bl-md" : "rounded-2xl", m.pending && "opacity-60")}>
                    <Linkify text={m.text} />
                  </p>
                  {(ends || m.id === lastMine) && (
                    <p className="mt-1 px-1 text-[11px] text-base-content/50">
                      {fmtTime(m.createdAt)}
                      {mine && m.id === lastMine && !group ? ` · ${m.pending ? "Sending…" : seen ? "Seen" : "Sent"}` : ""}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
        {typingNames.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 pl-10" aria-hidden="true">
            {[0, 1, 2].map((d) => (
              <motion.span key={d} className="size-2 rounded-full bg-base-content/35" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }} />
            ))}
          </div>
        )}
      </div>

      {!connected && (
        <p className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-warning/15 px-3 py-2 text-sm sm:mx-5" role="status">
          <WifiOff className="size-4 shrink-0" /> Reconnecting to live chat. You can still send messages.
        </p>
      )}
      <form
        className="flex items-end gap-2 border-t border-base-content/10 p-3 sm:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Write a message
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={1}
          maxLength={2000}
          value={draft}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={group ? `Message ${c.name}` : `Message ${c.name.split(" ")[0]}`}
          className="textarea max-h-36 min-h-11 flex-1 resize-none py-2.5 leading-snug"
        />
        <button type="submit" className="btn btn-primary btn-circle" disabled={!draft.trim()} aria-label="Send message">
          <Send className="size-5" />
        </button>
      </form>
    </div>
  );
}

export type { Person };
