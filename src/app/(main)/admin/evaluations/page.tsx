"use client";

import { MessageSquareQuote, ShieldCheck, Star, Users } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorState, Field, Meter, PageHeader, Pill, Select, StatCard, type Tone } from "@/components/ui/kit";
import { CountUp, Stagger, StaggerItem } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import type { Paged } from "@/lib/types";

const QUESTIONS: Record<string, string> = {
  outline: "Clear outline and goals",
  clarity: "Explains concepts clearly",
  pace: "Pace and use of class time",
  assessment: "Exams match what was taught",
  support: "Approachable, useful feedback",
  materials: "Notes, slides and videos help",
  workload: "Reasonable workload",
  overall: "Would recommend to a friend",
};

type Result = {
  sectionId: string;
  course: { code: string; title: string };
  section: { name: string; instructor?: { name?: string; title?: string }; enrolled?: number };
  semester?: { name: string } | null;
  responses: number;
  responseRate: number | null;
  averages: Record<string, number>;
  overall: number | null;
  comments: string[];
};

const tone = (v: number | null): Tone => (v === null ? "info" : v >= 4 ? "success" : v >= 3 ? "warning" : "error");
const barTone = (v: number): "success" | "primary" | "error" => (v >= 4 ? "success" : v >= 3 ? "primary" : "error");

export default function AdminEvaluations() {
  const [semester, setSemester] = useState("");
  const sems = useGet<Paged<{ id: string; name: string }>>("/admin/semesters?limit=100", { staleTime: 60_000 });
  const { data, isLoading, isError, error, refetch } = useGet<{ items: Result[] }>(`/admin/evaluations${semester ? `?semester=${semester}` : ""}`, { keepPrevious: true });
  const items = data?.items ?? [];
  const responses = items.reduce((n, r) => n + r.responses, 0);
  const scored = items.filter((r) => r.overall !== null);
  const avg = scored.length ? scored.reduce((a, r) => a + (r.overall ?? 0), 0) / scored.length : null;

  return (
    <>
      <PageHeader title="Course evaluations" sub="What students think of each course and instructor. Every response is anonymous: names are never stored with the answers." />
      <div className="mb-6 grid gap-4 sm:grid-cols-[18rem_1fr] sm:items-end">
        <Field label="Semester">
          <Select label="Semester" all="All semesters" value={semester} onChange={setSemester} options={(sems.data?.items ?? []).map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
        <p className="flex items-center gap-2 text-sm text-base-content/60">
          <ShieldCheck className="size-4 shrink-0 text-success" /> Ratings are on a scale of 1 to 5. Highest rated courses come first.
        </p>
      </div>

      {isError ? (
        <ErrorState message={error?.message} retry={() => refetch()} />
      ) : isLoading || !data ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-80 rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Star className="size-7" />} title="No evaluations yet" body="Results appear here as soon as students submit their evaluations." />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard icon={<Users />} label="Responses" value={<CountUp value={responses} />} tone="primary" />
            <StatCard icon={<Star />} label="Courses evaluated" value={<CountUp value={items.length} />} tone="secondary" />
            <StatCard icon={<Star />} label="Average rating" value={avg === null ? "–" : <CountUp value={avg} decimals={2} suffix=" / 5" />} tone={tone(avg)} />
          </div>
          <Stagger key={semester} className="grid gap-5 lg:grid-cols-2" gap={0.05}>
            {items.map((r) => (
              <StaggerItem key={r.sectionId} className="h-full">
                <article className="surface flex h-full flex-col gap-5 p-6">
                  <header className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary">
                        {r.course.code} · Section {r.section.name}
                      </p>
                      <h2 className="h-section mt-0.5 text-xl">{r.course.title}</h2>
                      <p className="mt-1 text-sm text-base-content/65">
                        {r.section.instructor?.name}
                        {r.section.instructor?.title ? `, ${r.section.instructor.title}` : ""}
                        {r.semester?.name ? ` · ${r.semester.name}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Pill tone={tone(r.overall)} className="text-base">
                        <Star className="size-4 fill-current" /> {r.overall?.toFixed(2) ?? "–"}
                      </Pill>
                    </div>
                  </header>

                  <div>
                    <p className="mb-1.5 flex justify-between text-sm">
                      <span className="text-base-content/65">Response rate</span>
                      <span className="font-semibold">
                        {r.responses}
                        {r.section.enrolled ? ` of ${r.section.enrolled}` : ""} {r.responseRate !== null ? `(${r.responseRate}%)` : ""}
                      </span>
                    </p>
                    <Meter value={r.responseRate ?? 0} tone="secondary" />
                  </div>

                  <ul className="grid gap-3">
                    {Object.entries(QUESTIONS).map(([key, text]) => {
                      const v = r.averages[key];
                      if (v === undefined) return null;
                      return (
                        <li key={key}>
                          <p className="mb-1 flex justify-between gap-3 text-sm">
                            <span>{text}</span>
                            <span className="font-bold tabular-nums">{v.toFixed(2)}</span>
                          </p>
                          <Meter value={v} max={5} tone={barTone(v)} />
                        </li>
                      );
                    })}
                  </ul>

                  {r.comments.length > 0 && (
                    <details className="group mt-auto rounded-2xl bg-base-200/70 p-4">
                      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
                        <MessageSquareQuote className="size-4 text-primary" /> Student comments ({r.comments.length})
                      </summary>
                      <ul className="mt-3 grid gap-2 text-[0.95rem] text-base-content/80">
                        {r.comments.map((c, i) => (
                          <li key={i} className="border-l-2 border-secondary pl-3">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}
    </>
  );
}
