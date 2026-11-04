"use client";

import { SearchX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { EventCard } from "@/components/cards";
import { CardGridSkeleton, Chips, EmptyState, ErrorState, PageHeader, Pagination, SearchBox, Tabs } from "@/components/ui/kit";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import { qs, useUrlState } from "@/hooks/use-url-state";
import type { EventCard as EventT, Paged } from "@/lib/types";

type Res = Paged<EventT> & { categories: string[] };

function Events() {
  const [f, set] = useUrlState({ q: "", category: "", status: "upcoming", page: "1" });
  const [text, setText] = useState(f.q);
  useEffect(() => {
    const t = setTimeout(() => text !== f.q && set({ q: text }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  const { data, isLoading, isError, error, refetch } = useGet<Res>(`/events${qs({ q: f.q, category: f.category, status: f.status, page: f.page === "1" ? "" : f.page, limit: 9 })}`, { auth: false, keepPrevious: true });

  return (
    <>
      <PageHeader title="Events" sub="Lectures, workshops, competitions and festivals. Reserve a seat and get your ticket number." />
      <Tabs
        tabs={[
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past events" },
        ]}
        value={f.status as "upcoming" | "past"}
        onChange={(v) => set({ status: v, category: "" })}
      />
      <div className="my-6 grid gap-4">
        <SearchBox value={text} onChange={setText} placeholder="Search events by name, venue or topic" className="max-w-xl" />
        <Chips options={data?.categories ?? []} value={f.category} onChange={(v) => set({ category: v })} all="All types" />
      </div>
      {isError ? (
        <ErrorState message={error?.message} retry={() => refetch()} />
      ) : isLoading || !data ? (
        <CardGridSkeleton n={6} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<SearchX className="size-7" />} title={f.status === "past" ? "No past events found" : "No upcoming events found"} body="Try another search, or check back soon." />
      ) : (
        <>
          <Stagger key={`${f.q}${f.category}${f.status}${f.page}`} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((e) => (
              <StaggerItem key={e.id} className="h-full">
                <EventCard e={e} />
              </StaggerItem>
            ))}
          </Stagger>
          <Pagination page={data.page} pages={data.pages} onChange={(p) => { set({ page: String(p) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<CardGridSkeleton n={6} />}>
      <Events />
    </Suspense>
  );
}
