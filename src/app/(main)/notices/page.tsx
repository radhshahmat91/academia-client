"use client";

import { SearchX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { NoticeRow } from "@/components/cards";
import { Chips, EmptyState, ErrorState, ListSkeleton, PageHeader, Pagination, SearchBox } from "@/components/ui/kit";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import { qs, useUrlState } from "@/hooks/use-url-state";
import type { Notice, Paged } from "@/lib/types";

function Notices() {
  const [f, set] = useUrlState({ q: "", category: "", page: "1" });
  const [text, setText] = useState(f.q);
  useEffect(() => {
    const t = setTimeout(() => text !== f.q && set({ q: text }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  const { data, isLoading, isError, error, refetch } = useGet<Paged<Notice> & { categories: string[] }>(`/notices${qs({ q: f.q, category: f.category, page: f.page === "1" ? "" : f.page, limit: 8 })}`, { auth: false, keepPrevious: true });

  return (
    <>
      <PageHeader title="Notices" sub="Announcements from the offices that matter: academic, finance, exams, transport and more." />
      <div className="mb-8 grid gap-4">
        <SearchBox value={text} onChange={setText} placeholder="Search notices" className="max-w-xl" />
        <Chips options={data?.categories ?? []} value={f.category} onChange={(v) => set({ category: v })} all="All notices" />
      </div>
      {isError ? (
        <ErrorState message={error?.message} retry={() => refetch()} />
      ) : isLoading || !data ? (
        <ListSkeleton n={6} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<SearchX className="size-7" />} title="No notices found" body="Try a different search or category." />
      ) : (
        <>
          <Stagger key={`${f.q}${f.category}${f.page}`} className="grid gap-4" gap={0.05}>
            {data.items.map((n) => (
              <StaggerItem key={n.id}>
                <NoticeRow n={n} />
              </StaggerItem>
            ))}
          </Stagger>
          <Pagination page={data.page} pages={data.pages} onChange={(p) => { set({ page: String(p) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </>
  );
}

export default function NoticesPage() {
  return (
    <Suspense fallback={<ListSkeleton n={6} />}>
      <Notices />
    </Suspense>
  );
}
