"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, CheckCircle2, ChevronDown, ExternalLink, FileText, GraduationCap, Layers, Link2, MessagesSquare, Play, Presentation, Target, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CourseCard, catTone } from "@/components/cards";
import { EmptyState, ErrorState, Meter, Pill, ProgressRing, Tabs } from "@/components/ui/kit";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { Photo } from "@/components/ui/photo";
import { send, useGet } from "@/hooks/use-api";
import type { CourseDetail, Lecture, Note } from "@/lib/types";
import { cn, plural, ytThumb } from "@/lib/utils";

type Tab = "overview" | "lectures" | "notes" | "sections";

const noteIcon = { note: FileText, link: Link2, pdf: FileText, slides: Presentation } as const;
const noteLabel = { note: "Reading", link: "Web link", pdf: "PDF", slides: "Slides" } as const;

function Player({ lecture }: { lecture: Lecture }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(false), [lecture.id]);
  return (
    <div className="overflow-hidden rounded-2xl bg-neutral shadow-lg">
      {on ? (
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${lecture.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={lecture.title}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="size-full"
          />
        </div>
      ) : (
        <button type="button" onClick={() => setOn(true)} className="group block w-full text-left" aria-label={`Play ${lecture.title}`}>
          <Photo src={ytThumb(lecture.youtubeId)} alt={lecture.title} ratio="aspect-video" zoom>
            <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-20 place-items-center rounded-full bg-secondary text-secondary-content shadow-xl transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-1 size-9 fill-current" />
              </span>
            </span>
          </Photo>
        </button>
      )}
    </div>
  );
}

function Lectures({ id, lectures, completed, setCompleted }: { id: string; lectures: Lecture[]; completed: Set<string>; setCompleted: (s: Set<string>) => void }) {
  const [current, setCurrent] = useState(() => lectures.find((l) => !completed.has(l.id))?.id ?? lectures[0]?.id);
  const lecture = lectures.find((l) => l.id === current) ?? lectures[0];
  const pct = lectures.length ? Math.round((completed.size / lectures.length) * 100) : 0;
  const [busy, setBusy] = useState(false);

  async function toggle(lectureId: string) {
    const done = !completed.has(lectureId);
    const next = new Set(completed);
    if (done) next.add(lectureId);
    else next.delete(lectureId);
    setCompleted(next);
    setBusy(true);
    try {
      await send("POST", `/courses/${id}/progress`, { lectureId, done });
      if (done && next.size === lectures.length) toast.success("You finished every lecture in this course");
    } catch (e) {
      setCompleted(completed);
      toast.error(e instanceof Error ? e.message : "Could not save your progress");
    } finally {
      setBusy(false);
    }
  }

  if (!lecture) return <EmptyState icon={<Play className="size-7" />} title="No lectures yet" body="Video lectures for this course will appear here." />;
  const idx = lectures.findIndex((l) => l.id === lecture.id);
  const nextLecture = lectures[idx + 1];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="grid gap-4">
        <Player lecture={lecture} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">
              Lecture {idx + 1} of {lectures.length}
            </p>
            <h3 className="h-section mt-0.5 text-2xl">{lecture.title}</h3>
            <p className="mt-1 text-sm text-base-content/60">
              {lecture.channel}
              {lecture.minutes ? ` · ${lecture.minutes} min` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => toggle(lecture.id)} disabled={busy} className={cn("btn btn-sm", completed.has(lecture.id) ? "btn-success btn-soft" : "btn-primary")}>
              <CheckCircle2 className="size-4" /> {completed.has(lecture.id) ? "Watched" : "Mark as watched"}
            </button>
            {nextLecture && (
              <button type="button" onClick={() => setCurrent(nextLecture.id)} className="btn btn-outline btn-sm">
                Next lecture
              </button>
            )}
            <a href={`https://www.youtube.com/watch?v=${lecture.youtubeId}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              <ExternalLink className="size-4" /> YouTube
            </a>
          </div>
        </div>
      </div>

      <aside className="surface overflow-hidden">
        <div className="flex items-center gap-4 border-b border-base-content/10 p-5">
          <ProgressRing value={pct} size={64} stroke={7}>
            <span className="text-sm font-bold">{pct}%</span>
          </ProgressRing>
          <div>
            <p className="font-bold">Your progress</p>
            <p className="text-sm text-base-content/60">
              {completed.size} of {lectures.length} lectures watched
            </p>
          </div>
        </div>
        <ol className="max-h-[28rem] overflow-y-auto">
          {lectures.map((l, i) => {
            const active = l.id === lecture.id;
            const done = completed.has(l.id);
            return (
              <li key={l.id} className={cn("flex items-stretch border-b border-base-content/6 last:border-0", active && "bg-primary/8")}>
                <button type="button" onClick={() => setCurrent(l.id)} className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-base-200/70" aria-current={active ? "true" : undefined}>
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold", active ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/70")}>{active ? <Play className="size-3.5 fill-current" /> : i + 1}</span>
                  <span className="min-w-0">
                    <span className={cn("line-clamp-2 text-[0.95rem] font-semibold", active && "text-primary")}>{l.title}</span>
                    {l.minutes ? <span className="text-xs text-base-content/55">{l.minutes} min</span> : null}
                  </span>
                </button>
                <button type="button" onClick={() => toggle(l.id)} aria-label={done ? `Mark ${l.title} as not watched` : `Mark ${l.title} as watched`} className="grid w-12 shrink-0 place-items-center text-base-content/30 transition-colors hover:text-success">
                  {done ? <CheckCircle2 className="size-5 text-success" /> : <span className="size-5 rounded-full border-2 border-current" />}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}

function NoteCard({ n }: { n: Note }) {
  const [open, setOpen] = useState(false);
  const Icon = noteIcon[n.kind] ?? FileText;
  const external = n.kind !== "note";
  const head = (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{n.title}</span>
          <Pill tone={n.kind === "note" ? "primary" : n.kind === "slides" ? "warning" : "info"}>{noteLabel[n.kind]}</Pill>
        </span>
        {n.description && <span className="mt-0.5 block text-sm text-base-content/65">{n.description}</span>}
      </span>
    </>
  );
  if (external)
    return (
      <a href={n.url} target="_blank" rel="noopener noreferrer" className="surface card-lift flex items-center gap-4 p-4">
        {head}
        <ExternalLink className="size-5 shrink-0 text-base-content/40" />
      </a>
    );
  return (
    <div className="surface overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 p-4 text-left" aria-expanded={open}>
        {head}
        <ChevronDown className={cn("size-5 shrink-0 text-base-content/40 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="grid gap-3 border-t border-base-content/10 px-5 py-5 leading-relaxed text-base-content/85">
              {(n.body ?? "").split(/\n{1,}/).filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CourseView({ data, id }: { data: CourseDetail; id: string }) {
  const { course, sections, related, enrollment, chatId } = data;
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [completed, setCompletedState] = useState(() => new Set(data.progress));
  const setCompleted = (s: Set<string>) => {
    setCompletedState(s);
    qc.setQueryData<CourseDetail>([`/courses/${id}`], (old) => (old ? { ...old, progress: [...s] } : old));
  };
  const pct = course.lectures.length ? Math.round((completed.size / course.lectures.length) * 100) : 0;
  const weightTotal = course.assessment.reduce((s, a) => s + a.weight, 0) || 100;

  return (
    <div className="grid gap-8">
      <section className="surface overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <Photo src={course.image} alt={course.title} ratio="aspect-[16/10] lg:aspect-auto lg:min-h-[22rem]" priority>
            <span className="absolute top-4 left-4 rounded-full bg-base-100/92 px-3.5 py-1.5 text-sm font-bold backdrop-blur">{course.code}</span>
          </Photo>
          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={catTone(course.category)}>{course.category}</Pill>
                <Pill tone="secondary">{plural(course.credits, "credit")}</Pill>
                <Pill tone="info">Level {course.level}</Pill>
                {enrollment && (
                  <Pill tone={enrollment.status === "enrolled" ? "success" : "primary"}>
                    <Check className="size-3.5" /> {enrollment.status === "enrolled" ? "You are enrolled" : enrollment.grade ? `Completed, grade ${enrollment.grade}` : "Completed"}
                  </Pill>
                )}
              </div>
              <h1 className="h-section mt-3 text-3xl leading-tight sm:text-4xl">{course.title}</h1>
              <p className="mt-2 text-base-content/65">{course.department}</p>
            </div>
            <p className="text-lg leading-relaxed text-base-content/80">{course.summary}</p>
            <dl className="mt-auto grid grid-cols-3 gap-3 text-center">
              {[
                { k: "Lectures", v: course.lectures.length },
                { k: "Notes", v: course.notes.length },
                { k: "Progress", v: `${pct}%` },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl bg-base-200/70 px-2 py-3">
                  <dd className="text-2xl font-extrabold">{s.v}</dd>
                  <dt className="text-sm text-base-content/60">{s.k}</dt>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setTab("lectures")} className="btn btn-primary">
                <Play className="size-4 fill-current" /> {completed.size ? "Continue learning" : "Start learning"}
              </button>
              {chatId && (
                <Link href={`/messages?c=${chatId}`} className="btn btn-outline">
                  <MessagesSquare className="size-4" /> Course group chat
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div>
        <Tabs
          tabs={[
            { value: "overview", label: "Overview" },
            { value: "lectures", label: "Video lectures", count: course.lectures.length },
            { value: "notes", label: "Notes and resources", count: course.notes.length },
            { value: "sections", label: "Sections", count: sections.length },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="pt-7">
          {tab === "overview" && (
            <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="grid gap-6">
                <section className="surface p-6 sm:p-8">
                  <h2 className="h-section text-xl">About this course</h2>
                  <div className="mt-4 grid gap-4 text-lg leading-relaxed text-base-content/85">
                    {course.description.split(/\n{1,}/).filter(Boolean).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </section>
                {course.outcomes.length > 0 && (
                  <section className="surface p-6 sm:p-8">
                    <h2 className="h-section flex items-center gap-2 text-xl">
                      <Target className="size-5 text-primary" /> What you will be able to do
                    </h2>
                    <ul className="mt-4 grid gap-3">
                      {course.outcomes.map((o) => (
                        <li key={o} className="flex gap-3">
                          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {course.topics.length > 0 && (
                  <section className="surface p-6 sm:p-8">
                    <h2 className="h-section flex items-center gap-2 text-xl">
                      <Layers className="size-5 text-primary" /> Topics covered
                    </h2>
                    <ol className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                      {course.topics.map((t, i) => (
                        <li key={t} className="flex items-start gap-3">
                          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>
              <aside className="grid gap-6">
                <section className="surface p-6">
                  <h2 className="h-section flex items-center gap-2 text-xl">
                    <GraduationCap className="size-5 text-primary" /> How you are assessed
                  </h2>
                  <ul className="mt-4 grid gap-4">
                    {course.assessment.map((a) => (
                      <li key={a.id}>
                        <div className="mb-1.5 flex justify-between gap-3 text-sm">
                          <span className="font-semibold">{a.label}</span>
                          <span className="text-base-content/65">{a.weight}%</span>
                        </div>
                        <Meter value={a.weight} max={weightTotal} tone="secondary" />
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="surface p-6">
                  <h2 className="h-section text-xl">Before you start</h2>
                  {course.prerequisites.length ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {course.prerequisites.map((p) => (
                        <li key={p}>
                          <Pill tone="warning">{p}</Pill>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-base-content/70">No prerequisites. Anyone can take this course.</p>
                  )}
                  {course.tags.length > 0 && (
                    <>
                      <h3 className="mt-6 mb-2 text-sm font-bold text-base-content/60">Tags</h3>
                      <ul className="flex flex-wrap gap-2">
                        {course.tags.map((t) => (
                          <li key={t} className="rounded-full border border-base-content/15 px-3 py-1 text-sm">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>
              </aside>
            </div>
          )}

          {tab === "lectures" && <Lectures id={id} lectures={course.lectures} completed={completed} setCompleted={setCompleted} />}

          {tab === "notes" &&
            (course.notes.length ? (
              <Stagger className="grid max-w-4xl gap-3">
                {course.notes.map((n) => (
                  <StaggerItem key={n.id}>
                    <NoteCard n={n} />
                  </StaggerItem>
                ))}
              </Stagger>
            ) : (
              <EmptyState icon={<BookOpen className="size-7" />} title="No notes yet" body="Notes, slides and reading links will appear here." />
            ))}

          {tab === "sections" &&
            (sections.length ? (
              <div className="grid max-w-5xl gap-4">
                {sections.map((s) => {
                  const left = Math.max(0, s.capacity - s.enrolled);
                  return (
                    <div key={s.id} className="surface grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone={s.semester.status === "ongoing" ? "success" : s.semester.registrationOpen ? "primary" : "info"}>{s.semester.name}</Pill>
                          <span className="font-bold">Section {s.name}</span>
                        </div>
                        <p className="mt-2 inline-flex items-center gap-2 text-sm text-base-content/70">
                          <UserRound className="size-4" /> {s.instructor.name}
                          {s.instructor.title ? `, ${s.instructor.title}` : ""}
                        </p>
                      </div>
                      <ul className="grid gap-1 text-sm text-base-content/75">
                        {s.schedule.map((sl) => (
                          <li key={`${sl.day}${sl.start}`}>
                            <span className="font-semibold">{sl.day}</span> {sl.start} to {sl.end}
                            {sl.room ? `, ${sl.room}` : ""}
                          </li>
                        ))}
                      </ul>
                      <div className="min-w-32">
                        <Meter value={s.enrolled} max={s.capacity} tone={left === 0 ? "error" : "primary"} />
                        <p className="mt-1.5 text-sm text-base-content/60">{left === 0 ? "Full" : `${plural(left, "seat")} left`}</p>
                      </div>
                    </div>
                  );
                })}
                {sections.some((s) => s.semester.registrationOpen) && (
                  <Link href="/registration" className="btn btn-primary w-fit">
                    Register for this semester
                  </Link>
                )}
              </div>
            ) : (
              <EmptyState title="Not offered right now" body={`${course.code} has no sections this semester. Check back when registration opens.`} />
            ))}
        </div>
      </div>

      {related.length > 0 && (
        <Reveal>
          <h2 className="h-section matra mb-7 text-2xl">More courses you may like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGet<CourseDetail>(`/courses/${id}`);
  if (isError) return error?.status === 404 ? <EmptyState title="That course was not found" body="It may have been removed from the catalogue." action={<Link href="/courses" className="btn btn-primary btn-sm">Browse courses</Link>} /> : <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data) return <div className="skeleton h-[28rem] w-full rounded-3xl" />;
  return (
    <>
      <Link href="/courses" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-base-content/60 transition-colors hover:text-primary">
        ← All courses
      </Link>
      <CourseView key={data.course.id} data={data} id={id} />
    </>
  );
}
