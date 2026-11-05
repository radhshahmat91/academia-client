"use client";

import { Mail, Reply } from "lucide-react";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Avatar } from "@/components/ui/kit";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import { fmtDateTime, timeAgo } from "@/lib/utils";

type Msg = { id: string; name: string; email: string; subject?: string; message: string; createdAt: string };

export default function AdminInbox() {
  const { data, isLoading, isError, error, refetch } = useGet<{ items: Msg[] }>("/admin/messages", { refetchInterval: 60_000 });
  return (
    <>
      <PageHeader title="Inbox" sub="Messages sent from the contact form. The 50 most recent are shown, newest first." />
      {isError ? (
        <ErrorState message={error?.message} retry={() => refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton n={4} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Mail className="size-7" />} title="The inbox is empty" body="Messages from the contact page will show up here." />
      ) : (
        <Stagger className="grid gap-4" gap={0.04}>
          {data.items.map((m) => (
            <StaggerItem key={m.id}>
              <article className="surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={m.name} size={44} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{m.name}</p>
                      <a href={`mailto:${m.email}`} className="truncate text-sm text-primary hover:underline">
                        {m.email}
                      </a>
                    </div>
                  </div>
                  <time dateTime={m.createdAt} title={fmtDateTime(m.createdAt)} className="text-sm text-base-content/55">
                    {timeAgo(m.createdAt)}
                  </time>
                </div>
                {m.subject && <h2 className="mt-4 text-lg font-bold">{m.subject}</h2>}
                <p className="mt-2 leading-relaxed whitespace-pre-wrap text-base-content/80">{m.message}</p>
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "Your message to AcademiaConnect"}`)}`} className="btn btn-outline btn-sm mt-4">
                  <Reply className="size-4" /> Reply by email
                </a>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </>
  );
}
