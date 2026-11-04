"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { getToken, SOCKET_URL } from "@/lib/api";
import type { AppNotification, ChatMessage, Conversation, Person } from "@/lib/types";

type Ctx = {
  socket: Socket | null;
  connected: boolean;
  online: Set<string>;
  /** The chat window that is open right now (so new messages in it are not counted as unread) */
  activeChat: MutableRefObject<string | null>;
};
const SocketCtx = createContext<Ctx>({ socket: null, connected: false, online: new Set(), activeChat: { current: null } });
export const useSocket = () => useContext(SocketCtx);

type NewMessage = { message: ChatMessage; conversationId: string; last: Conversation["last"]; person: Person };
const CONV_KEY = ["/chat/conversations"];

export function SocketProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const activeChat = useRef<string | null>(null);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionDelayMax: 8000,
      // Fetched on every (re)connect so an expired token never keeps a tab offline
      auth: (cb) => {
        void getToken().then((token) => cb({ token }));
      },
    });
    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("presence:list", (ids: string[]) => setOnline(new Set(ids)));
    s.on("presence:update", ({ userId: id, online: on }: { userId: string; online: boolean }) =>
      setOnline((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      }),
    );

    s.on("message:new", (p: NewMessage) => {
      const mine = p.message.sender === userId;
      const open = activeChat.current === p.conversationId;
      let known = false;
      qc.setQueryData<{ items: Conversation[]; online: string[] }>(CONV_KEY, (old) => {
        if (!old) return old;
        const idx = old.items.findIndex((c) => c.id === p.conversationId);
        if (idx < 0) return old;
        known = true;
        const cur = old.items[idx]!;
        const updated: Conversation = { ...cur, last: p.last, unread: mine || open ? cur.unread : cur.unread + 1 };
        return { ...old, items: [updated, ...old.items.filter((_, i) => i !== idx)] };
      });
      if (!known) void qc.invalidateQueries({ queryKey: CONV_KEY });
      if (!mine && !open) {
        toast(p.person.name, {
          description: p.message.text.length > 90 ? `${p.message.text.slice(0, 90)}…` : p.message.text,
          action: { label: "Open", onClick: () => router.push(`/messages?c=${p.conversationId}`) },
        });
      }
    });

    s.on("notification:new", (n: AppNotification) => {
      qc.setQueryData<{ items: AppNotification[]; unread: number }>(["/notifications"], (old) => (old ? { items: [n, ...old.items].slice(0, 50), unread: old.unread + 1 } : old));
      void qc.invalidateQueries({ queryKey: ["/dashboard"] });
      toast(n.title, { description: n.body, action: n.link ? { label: "View", onClick: () => router.push(n.link!) } : undefined });
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [userId, qc, router]);

  const value = useMemo(() => ({ socket, connected, online, activeChat }), [socket, connected, online]);
  return <SocketCtx.Provider value={value}>{children}</SocketCtx.Provider>;
}
