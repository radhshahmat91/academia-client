"use client";

import { MessageCircle, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSocket } from "@/components/socket-provider";
import { Avatar, CardGridSkeleton, EmptyState, ErrorState, PageHeader, Pagination, SearchBox, Select } from "@/components/ui/kit";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { send, useAction, useGet } from "@/hooks/use-api";
import { qs, useUrlState } from "@/hooks/use-url-state";
import type { Conversation, Paged, Student } from "@/lib/types";

type Res = Paged<Student> & { departments: string[] };

function Students() {
  const router = useRouter();
  const { online } = useSocket();
  const [f, set] = useUrlState({ q: "", department: "", page: "1" });
  const [text, setText] = useState(f.q);
  useEffect(() => {
    const t = setTimeout(() => text !== f.q && set({ q: text }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  const { data, isLoading, isError, error, refetch } = useGet<Res>(`/students${qs({ q: f.q, department: f.department, page: f.page === "1" ? "" : f.page, limit: 12 })}`, { keepPrevious: true });
  const dm = useAction((userId: string) => send<Conversation>("POST", "/chat/direct", { userId }), { refresh: ["/chat/conversations"], onSuccess: (c) => router.push(`/messages?c=${c.id}`) });

  return (
    <>
      <PageHeader title="Students" sub="Find classmates, see their clubs and courses, and start a conversation." />
      <div className="mb-7 grid gap-3 sm:grid-cols-[1fr_20rem]">
        <SearchBox value={text} onChange={setText} placeholder="Search by name, student ID or department" />
        <Select label="Department" all="All departments" value={f.department} onChange={(v) => set({ department: v })} options={(data?.departments ?? []).map((d) => ({ value: d, label: d }))} />
      </div>
      {isError ? (
        <ErrorState message={error?.message} retry={() => refetch()} />
      ) : isLoading || !data ? (
        <CardGridSkeleton n={6} ratio="aspect-[16/6]" cols="sm:grid-cols-2 xl:grid-cols-3" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<SearchX className="size-7" />} title="No students found" body="Try a different name or clear the department filter." />
      ) : (
        <>
          <Stagger key={`${f.q}${f.department}${f.page}`} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((s) => (
              <StaggerItem key={s.id} className="h-full">
                <article className="surface card-lift flex h-full flex-col gap-4 p-5">
                  <div className="flex items-center gap-4">
                    <Avatar name={s.name} src={s.image} size={64} online={online.has(s.id)} />
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">
                        <Link href={`/students/${s.id}`} className="transition-colors hover:text-primary">
                          {s.name}
                        </Link>
                      </h2>
                      <p className="truncate text-sm text-base-content/65">{s.department}</p>
                      <p className="text-xs text-base-content/50">
                        {s.batch ? `Batch ${s.batch}` : ""}
                        {s.batch && s.studentId ? " · " : ""}
                        {s.studentId ? `ID ${s.studentId}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="line-clamp-2 min-h-[2.8rem] text-[0.95rem] text-base-content/70">{s.bio || "This student has not written a bio yet."}</p>
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <Link href={`/students/${s.id}`} className="btn btn-outline btn-sm">
                      View profile
                    </Link>
                    <button type="button" className="btn btn-primary btn-sm" disabled={dm.isPending} onClick={() => dm.mutate(s.id)}>
                      <MessageCircle className="size-4" /> Message
                    </button>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
          <Pagination page={data.page} pages={data.pages} onChange={(p) => { set({ page: String(p) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<CardGridSkeleton n={6} />}>
      <Students />
    </Suspense>
  );
}
