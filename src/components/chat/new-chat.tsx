"use client";

import { SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, SearchBox, Spinner } from "@/components/ui/kit";
import { Modal } from "@/components/ui/modal";
import { qs } from "@/hooks/use-url-state";
import { send, useAction, useGet } from "@/hooks/use-api";
import type { Conversation, Paged, Student } from "@/lib/types";

/** Pick a classmate to start a one-to-one chat with. */
export function NewChat({ open, onClose, onPicked }: { open: boolean; onClose: () => void; onPicked: (conversationId: string) => void }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text]);
  const { data, isLoading } = useGet<Paged<Student>>(open ? `/students${qs({ q, limit: 12 })}` : null, { keepPrevious: true });
  const start = useAction((userId: string) => send<Conversation>("POST", "/chat/direct", { userId }), {
    refresh: ["/chat/conversations"],
    onSuccess: (c) => {
      onPicked(c.id);
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="New message" size="md">
      <SearchBox value={text} onChange={setText} placeholder="Search by name, student ID or department" />
      <div className="mt-4 min-h-64">
        {isLoading && !data ? (
          <div className="grid h-48 place-items-center">
            <Spinner />
          </div>
        ) : !data?.items.length ? (
          <div className="grid h-48 place-items-center text-center text-base-content/60">
            <div>
              <SearchX className="mx-auto mb-2 size-7" />
              <p>No students match your search.</p>
            </div>
          </div>
        ) : (
          <ul className="grid gap-1">
            {data.items.map((s) => (
              <li key={s.id}>
                <button type="button" disabled={start.isPending} onClick={() => start.mutate(s.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-base-200 disabled:opacity-60">
                  <Avatar name={s.name} src={s.image} size={44} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{s.name}</span>
                    <span className="block truncate text-sm text-base-content/60">
                      {[s.department, s.batch ? `Batch ${s.batch}` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
