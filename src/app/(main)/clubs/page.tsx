"use client";

import { SearchX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { ClubCard } from "@/components/cards";
import { CardGridSkeleton, Chips, EmptyState, ErrorState, PageHeader, SearchBox } from "@/components/ui/kit";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import { qs, useUrlState } from "@/hooks/use-url-state";
import type { ClubCard as Club } from "@/lib/types";

function Clubs() {
  const [f, set] = useUrlState({ q: "", category: "" });
  const [text, setText] = useState(f.q);
  useEffect(() => {
    const t = setTimeout(() => text !== f.q && set({ q: text }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  const { data, isLoading, isError, error, refetch } = useGet<{ items: Club[]; categories: string[] }>(`/clubs${qs(f)}`, { auth: false, keepPrevious: true });

  return (
    <>
      <PageHeader title="Clubs" sub="Join a club to meet people who care about the same things, and get a group chat with them." />
      <div className="mb-8 grid gap-4">
        <SearchBox value={text} onChange={setText} placeholder="Search clubs by name or interest" className="max-w-xl" />
        <Chips options={data?.categories ?? []} value={f.category} onChange={(v) => set({ category: v })} all="All clubs" />
      </div>
      {isError ? (
        <ErrorState message={error?.message} retry={() => refetch()} />
      ) : isLoading || !data ? (
        <CardGridSkeleton n={6} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<SearchX className="size-7" />} title="No clubs found" body="Try a different search or pick another category." />
      ) : (
        <Stagger key={`${f.q}${f.category}`} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((c) => (
            <StaggerItem key={c.id} className="h-full">
              <ClubCard c={c} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </>
  );
}

export default function ClubsPage() {
  return (
    <Suspense fallback={<CardGridSkeleton n={6} />}>
      <Clubs />
    </Suspense>
  );
}
