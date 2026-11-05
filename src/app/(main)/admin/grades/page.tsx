"use client";

import { CheckCheck, ClipboardList, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, Field, ListSkeleton, PageHeader, Pill, Select, Spinner } from "@/components/ui/kit";
import { Reveal } from "@/components/ui/motion";
import { send, useAction, useGet, useRefresh } from "@/hooks/use-api";
import { gradeFor, gradeTone } from "@/lib/grades";
import type { Paged } from "@/lib/types";
import { cn } from "@/lib/utils";

type Sem = { id: string; name: string; status: string };
type Sec = { id: string; name: string; course?: { code: string; title: string } | null };
type Enr = { id: string; studentName: string; studentCode: string; marks?: number | null; grade?: string | null; gradePoint?: number | null; status: string };

const parse = (s: string) => (s.trim() === "" ? null : Number(s));
const valid = (s: string) => {
  const n = parse(s);
  return n !== null && Number.isFinite(n) && n >= 0 && n <= 100;
};

export default function AdminGrades() {
  const refresh = useRefresh();
  const sems = useGet<Paged<Sem>>("/admin/semesters?limit=100", { staleTime: 60_000 });
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (semester || !sems.data?.items.length) return;
    setSemester((sems.data.items.find((s) => s.status === "ongoing") ?? sems.data.items[0]!).id);
  }, [sems.data, semester]);

  const secs = useGet<Paged<Sec>>(semester ? `/admin/sections?semester=${semester}&limit=100` : null, { staleTime: 30_000 });
  useEffect(() => {
    if (!secs.data) return;
    setSection((cur) => (secs.data!.items.some((s) => s.id === cur) ? cur : (secs.data!.items[0]?.id ?? "")));
  }, [secs.data]);
  useEffect(() => setDraft({}), [section]);

  const enr = useGet<{ items: Enr[] }>(section ? `/admin/enrollments?section=${section}` : null);
  const rows = enr.data?.items ?? [];
  const value = (r: Enr) => draft[r.id] ?? (r.marks == null ? "" : String(r.marks));
  const dirty = useMemo(() => rows.filter((r) => draft[r.id] !== undefined && draft[r.id]!.trim() !== (r.marks == null ? "" : String(r.marks))), [rows, draft]);
  const bad = dirty.filter((r) => !valid(draft[r.id]!));
  const graded = rows.filter((r) => r.marks != null);
  const avg = graded.length ? graded.reduce((a, r) => a + (r.marks ?? 0), 0) / graded.length : null;

  const saveRows = useAction(
    async (list: Enr[]) => {
      const results = await Promise.allSettled(list.map((r) => send("PATCH", `/admin/enrollments/${r.id}`, { marks: Number(draft[r.id]) })));
      return list.map((r, i) => ({ id: r.id, ok: results[i]!.status === "fulfilled" }));
    },
    {
      onSuccess: (res) => {
        const failed = res.filter((r) => !r.ok).length;
        if (failed) toast.error(`${failed} result${failed === 1 ? "" : "s"} could not be saved. Please try again.`);
        else toast.success(`${res.length} result${res.length === 1 ? "" : "s"} saved. The students were notified.`);
        setDraft((d) => Object.fromEntries(Object.entries(d).filter(([id]) => !res.find((r) => r.id === id && r.ok))));
        void refresh("/admin/enrollments", "/my-courses", "/dashboard", "/notifications");
      },
    },
  );

  return (
    <>
      <PageHeader
        title="Grades"
        sub="Pick a section and enter each student's marks out of 100. The grade and grade point are worked out for you."
        actions={
          <button type="button" className="btn btn-primary" disabled={!dirty.length || !!bad.length || saveRows.isPending} onClick={() => saveRows.mutate(dirty)}>
            {saveRows.isPending ? <Spinner className="size-4" /> : <Save className="size-4" />}
            {dirty.length ? `Save ${dirty.length} change${dirty.length === 1 ? "" : "s"}` : "No changes yet"}
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Field label="Semester">
          <Select
            label="Semester"
            value={semester}
            onChange={(v) => {
              setSemester(v);
              setSection("");
            }}
            options={(sems.data?.items ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
        </Field>
        <Field label="Section">
          <Select label="Section" value={section} onChange={setSection} options={(secs.data?.items ?? []).map((s) => ({ value: s.id, label: `${s.course?.code ?? "Course"} · ${s.course?.title ?? ""} (Section ${s.name})` }))} />
        </Field>
      </div>

      {sems.isError || secs.isError || enr.isError ? (
        <ErrorState message={(sems.error ?? secs.error ?? enr.error)?.message} retry={() => void Promise.all([sems.refetch(), secs.refetch(), enr.refetch()])} />
      ) : !section ? (
        secs.isLoading || sems.isLoading ? (
          <ListSkeleton n={4} />
        ) : (
          <EmptyState icon={<ClipboardList className="size-7" />} title="No sections in this semester" body="Create sections first, then come back to enter marks." />
        )
      ) : enr.isLoading ? (
        <ListSkeleton n={6} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-7" />} title="No students in this section" body="Nobody has registered for it yet." />
      ) : (
        <Reveal y={10}>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <Pill tone="primary">
              <CheckCheck className="size-3.5" /> {graded.length} of {rows.length} graded
            </Pill>
            {avg !== null && <Pill tone="info">Class average {avg.toFixed(1)}</Pill>}
          </div>
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="text-xs tracking-wide text-base-content/60 uppercase">
                    <th>Student</th>
                    <th className="w-36">Marks / 100</th>
                    <th>Grade</th>
                    <th className="hidden sm:table-cell">Grade point</th>
                    <th className="hidden md:table-cell">State</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const v = value(r);
                    const isDirty = dirty.some((d) => d.id === r.id);
                    const ok = v.trim() === "" || valid(v);
                    const g = v.trim() !== "" && ok ? gradeFor(Number(v)) : null;
                    return (
                      <tr key={r.id} className={cn(isDirty && "bg-secondary/8")}>
                        <td>
                          <p className="font-bold">{r.studentName}</p>
                          <p className="text-sm text-base-content/60">{r.studentCode}</p>
                        </td>
                        <td>
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={100}
                            step="any"
                            aria-label={`Marks for ${r.studentName}`}
                            aria-invalid={!ok || undefined}
                            className={cn("input input-sm w-28", !ok && "input-error")}
                            value={v}
                            onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const next = (e.currentTarget.closest("tr")?.nextElementSibling as HTMLElement | null)?.querySelector("input");
                                next?.focus();
                              }
                            }}
                          />
                          {!ok && <p className="mt-1 text-xs font-medium text-error">0 to 100 only</p>}
                        </td>
                        <td>{g ? <Pill tone={gradeTone(g.grade)}>{g.grade}</Pill> : <span className="text-base-content/40">–</span>}</td>
                        <td className="hidden sm:table-cell">{g ? g.point.toFixed(2) : <span className="text-base-content/40">–</span>}</td>
                        <td className="hidden md:table-cell">{isDirty ? <Pill tone="secondary">Unsaved</Pill> : r.marks != null ? <Pill tone="success">Saved</Pill> : <Pill tone="info">Not graded</Pill>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-sm text-base-content/60">Press Enter to move to the next student. Saving marks marks the course as completed and sends the student a notification.</p>
        </Reveal>
      )}
    </>
  );
}
