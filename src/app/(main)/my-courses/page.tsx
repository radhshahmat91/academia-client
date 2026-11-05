"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpenCheck, ChevronDown, GraduationCap, Layers, Lock, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, PageHeader, Pill, StatCard, type Tone } from "@/components/ui/kit";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import type { HistorySemester } from "@/lib/types";
import { cn, fmtShort, plural } from "@/lib/utils";

type Scale = { min: number; grade: string; point: number }[];
type History = { semesters: HistorySemester[]; cgpa: number | null; creditsEarned: number; scale: Scale };

const statusTone = (s: string): { tone: Tone; label: string } => (s === "ongoing" ? { tone: "success", label: "In progress" } : s === "completed" ? { tone: "info", label: "Completed" } : { tone: "primary", label: "Registered" });
const gradeTone = (g: string | null): Tone => (!g ? "info" : g === "F" ? "error" : g.startsWith("A") ? "success" : g.startsWith("B") ? "primary" : "warning");

function SemesterBlock({ s, open, onToggle }: { s: HistorySemester; open: boolean; onToggle: () => void }) {
  const st = statusTone(s.semester.status);
  return (
    <section className="surface overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 p-5 text-left transition-colors hover:bg-base-200/50 sm:px-7">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-3">
            <span className="h-section text-xl">{s.semester.name}</span>
            <Pill tone={st.tone}>{st.label}</Pill>
            {s.locked && (
              <Pill tone="warning">
                <Lock className="size-3.5" /> Results locked
              </Pill>
            )}
          </span>
          <span className="mt-1 block text-sm text-base-content/60">
            {fmtShort(s.semester.startDate)} to {fmtShort(s.semester.endDate)} · {plural(s.courses.length, "course")}, {s.credits} credits
          </span>
        </span>
        <span className="flex items-center gap-6 text-right">
          <span>
            <span className="block text-xs text-base-content/55">GPA</span>
            <span className="text-2xl font-extrabold">{s.locked ? <Lock className="inline size-5 text-base-content/40" aria-label="Locked" /> : s.gpa != null ? s.gpa.toFixed(2) : "Not yet"}</span>
          </span>
          <ChevronDown className={cn("size-5 text-base-content/45 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden">
            <div className="border-t border-base-content/10">
              {s.locked && (
                <div className="flex flex-wrap items-center gap-3 border-b border-warning/30 bg-warning/12 px-5 py-4 sm:px-7">
                  <Star className="size-5 shrink-0 text-warning" />
                  <p className="min-w-0 flex-1 text-sm">
                    Finish {plural(s.pendingEvaluations, "course evaluation")} to unlock your marks and grades for {s.semester.name}.
                  </p>
                  <Link href="/evaluation" className="btn btn-sm btn-primary">
                    Evaluate now
                  </Link>
                </div>
              )}
              <div className="hidden grid-cols-[minmax(0,1fr)_6rem_6rem_7rem] gap-4 px-7 py-3 text-xs font-bold tracking-wide text-base-content/55 uppercase sm:grid">
                <span>Course</span>
                <span>Credits</span>
                <span>Marks</span>
                <span>Grade</span>
              </div>
              <ul>
                {s.courses.map((c) => (
                  <li key={c.id} className="grid gap-2 border-t border-base-content/8 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_6rem_6rem_7rem] sm:items-center sm:gap-4 sm:px-7">
                    <div className="min-w-0">
                      <Link href={`/courses/${c.course.id}`} className="group font-bold">
                        <span className="text-primary">{c.course.code}</span> <span className="transition-colors group-hover:text-primary">{c.course.title}</span>
                      </Link>
                      <p className="mt-0.5 text-sm text-base-content/60">
                        {c.section ? `Section ${c.section.name}` : c.course.department}
                        {c.section?.instructor?.name ? `, ${c.section.instructor.name}` : ""}
                      </p>
                    </div>
                    <p className="text-sm sm:text-base">
                      <span className="text-base-content/55 sm:hidden">Credits: </span>
                      {c.course.credits}
                    </p>
                    <p className="text-sm sm:text-base">
                      <span className="text-base-content/55 sm:hidden">Marks: </span>
                      {s.locked ? <Lock className="inline size-4 text-base-content/40" aria-label="Locked" /> : c.marks != null ? c.marks : "–"}
                    </p>
                    <p>
                      {s.locked ? (
                        <Pill tone="warning">Locked</Pill>
                      ) : c.grade ? (
                        <Pill tone={gradeTone(c.grade)}>
                          {c.grade} <span className="font-medium opacity-70">{c.gradePoint?.toFixed(2)}</span>
                        </Pill>
                      ) : (
                        <Pill tone="info">{c.status === "enrolled" ? "In progress" : "Awaiting result"}</Pill>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function MyCoursesPage() {
  const { data, isLoading, isError, error, refetch } = useGet<History>("/academics/history");
  const [openIds, setOpenIds] = useState<Record<string, boolean> | null>(null);

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <div className="grid gap-5">
        <div className="skeleton h-20 w-full max-w-lg rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );

  const sems = [...data.semesters].reverse();
  const open = openIds ?? Object.fromEntries(sems.slice(0, 1).map((s) => [s.semester.id, true]));
  const flip = (id: string) => setOpenIds({ ...open, [id]: !open[id] });
  const courseCount = sems.reduce((n, s) => n + s.courses.length, 0);
  const ranges = data.scale.map((g, i) => ({ ...g, max: i === 0 ? 100 : data.scale[i - 1]!.min - 1 }));

  return (
    <div className="grid gap-7">
      <PageHeader title="Semester courses" sub="Every course you have taken, semester by semester, with marks, grades and GPA." />

      <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" gap={0.07}>
        <StaggerItem>
          <StatCard icon={<GraduationCap />} label="CGPA" value={data.cgpa != null ? <CountUp value={data.cgpa} decimals={2} /> : "Not yet"} hint="Locked semesters are not counted" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={<BookOpenCheck />} label="Credits earned" value={<CountUp value={data.creditsEarned} />} tone="success" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={<Layers />} label="Semesters" value={<CountUp value={sems.length} />} tone="info" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={<BookOpenCheck />} label="Courses taken" value={<CountUp value={courseCount} />} tone="secondary" />
        </StaggerItem>
      </Stagger>

      {sems.length === 0 ? (
        <EmptyState icon={<BookOpenCheck className="size-7" />} title="No courses yet" body="Once you register for a semester, your courses and results will be listed here." action={<Link href="/registration" className="btn btn-primary btn-sm">Go to registration</Link>} />
      ) : (
        <Stagger className="grid gap-4" gap={0.06}>
          {sems.map((s) => (
            <StaggerItem key={s.semester.id}>
              <SemesterBlock s={s} open={!!open[s.semester.id]} onToggle={() => flip(s.semester.id)} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Reveal>
        <section className="surface p-6 sm:p-7">
          <h2 className="h-section text-xl">Grading scale</h2>
          <p className="mt-1 text-sm text-base-content/60">GPA is the credit-weighted average of grade points.</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ranges.map((g) => (
              <li key={g.grade} className="flex items-center justify-between gap-3 rounded-xl bg-base-200/70 px-4 py-3">
                <span>
                  <Pill tone={gradeTone(g.grade)}>{g.grade}</Pill>
                  <span className="mt-1 block text-xs text-base-content/60">
                    {g.min} to {g.max}
                  </span>
                </span>
                <span className="text-lg font-bold">{g.point.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </div>
  );
}
