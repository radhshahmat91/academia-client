"use client";

import { SearchX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { CourseCard } from "@/components/cards";
import { CardGridSkeleton, EmptyState, ErrorState, PageHeader, Pagination, SearchBox, Select } from "@/components/ui/kit";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import { qs, useUrlState } from "@/hooks/use-url-state";
import type { CourseCard as Course, Paged } from "@/lib/types";
import { pretty } from "@/lib/utils";

const SORTS = [
  { value: "code", label: "Course code" },
  { value: "az", label: "Title A to Z" },
  { value: "credits", label: "Most credits" },
  { value: "featured", label: "Featured first" },
];

function Courses() {
  const [f, set] = useUrlState({ q: "", department: "", category: "", level: "", sort: "code", page: "1" });
  const [text, setText] = useState(f.q);
  useEffect(() => {
    const t = setTimeout(() => text !== f.q && set({ q: text }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const meta = useGet<{ departments: string[]; categories: string[]; levels: number[] }>("/courses/meta", { auth: false, staleTime: 10 * 60_000 });
  const { data, isLoading, isError, error, refetch, isFetching } = useGet<Paged<Course>>(`/courses${qs({ ...f, page: f.page === "1" ? "" : f.page, sort: f.sort === "code" ? "" : f.sort, limit: 9 })}`, { auth: false, keepPrevious: true });
  const active = !!(f.q || f.department || f.category || f.level);

  return (
    <>
      <PageHeader title="Courses" sub="Every course comes with video lectures, notes and a group chat. Open one to start learning." />
      <div className="surface mb-8 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.3fr_1fr_1fr_1fr]">
        <SearchBox value={text} onChange={setText} placeholder="Search by title, code or topic" className="sm:col-span-2 lg:col-span-1" />
        <Select label="Department" all="All departments" value={f.department} onChange={(v) => set({ department: v })} options={(meta.data?.departments ?? []).map((d) => ({ value: d, label: d }))} />
        <Select label="Subject area" all="All subjects" value={f.category} onChange={(v) => set({ category: v })} options={(meta.data?.categories ?? []).map((d) => ({ value: d, label: pretty(d) }))} />
        <Select label="Level" all="All levels" value={f.level} onChange={(v) => set({ level: v })} options={(meta.data?.levels ?? []).map((l) => ({ value: String(l), label: `Level ${l}` }))} />
        <Select label="Sort by" value={f.sort} onChange={(v) => set({ sort: v })} options={SORTS} />
      </div>

      {isError ? (
        <ErrorState message={error?.message} retry={() => refetch()} />
      ) : isLoading || !data ? (
        <CardGridSkeleton n={9} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<SearchX className="size-7" />} title="No courses match" body="Try a different word or clear a filter." action={active ? <button className="btn btn-primary btn-sm" onClick={() => { setText(""); set({ q: "", department: "", category: "", level: "" }); }}>Clear filters</button> : undefined} />
      ) : (
        <>
          <p className="mb-5 text-sm text-base-content/60" aria-live="polite">
            Showing {data.items.length} of {data.total} courses
            {isFetching && <span className="loading loading-dots loading-xs ml-2 align-middle" />}
          </p>
          <Stagger key={`${f.q}${f.department}${f.category}${f.level}${f.sort}${f.page}`} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((c) => (
              <StaggerItem key={c.id} className="h-full">
                <CourseCard c={c} />
              </StaggerItem>
            ))}
          </Stagger>
          <Pagination page={data.page} pages={data.pages} onChange={(p) => { set({ page: String(p) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CardGridSkeleton n={9} />}>
      <Courses />
    </Suspense>
  );
}
