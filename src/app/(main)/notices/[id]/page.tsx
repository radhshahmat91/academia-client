"use client";

import { CalendarDays, Link2, Paperclip, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { catTone } from "@/components/cards";
import { EmptyState, ErrorState, PageHeader, Pill } from "@/components/ui/kit";
import { useGet } from "@/hooks/use-api";
import type { Notice } from "@/lib/types";
import { fmtLong, fmtTime } from "@/lib/utils";

export default function NoticePage() {
  const { id } = useParams<{ id: string }>();
  const { data: n, isLoading, isError, error, refetch } = useGet<Notice>(`/notices/${id}`, { auth: false });

  if (isError) return error?.status === 404 ? <EmptyState title="That notice was not found" body="It may have been removed." /> : <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !n) return <div className="skeleton h-96 w-full max-w-3xl rounded-3xl" />;

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to your clipboard");
    } catch {
      toast.error("Could not copy the link. Copy it from the address bar instead.");
    }
  }

  return (
    <article className="max-w-3xl">
      <PageHeader back={{ href: "/notices", label: "All notices" }} title={n.title} />
      <div className="-mt-3 mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-base-content/65">
        <Pill tone={catTone(n.category)}>{n.category}</Pill>
        {n.priority !== "normal" && <Pill tone={n.priority === "urgent" ? "error" : "warning"}>{n.priority === "urgent" ? "Urgent" : "Important"}</Pill>}
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4" /> {fmtLong(n.publishedAt)}, {fmtTime(n.publishedAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="size-4" /> {n.author}
        </span>
      </div>
      <div className="surface grid gap-5 p-6 text-lg leading-relaxed sm:p-9">
        {(n.body ?? "").split(/\n{1,}/).filter(Boolean).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {!!n.attachments?.length && (
          <ul className="grid gap-2 border-t border-base-content/10 pt-5 text-base">
            {n.attachments.map((a) => (
              <li key={a.url}>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">
                  <Paperclip className="size-4" /> {a.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" onClick={copy} className="btn btn-outline btn-sm mt-6">
        <Link2 className="size-4" /> Copy link
      </button>
    </article>
  );
}
