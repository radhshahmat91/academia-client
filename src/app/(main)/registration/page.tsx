"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Lock, Plus, Trash2, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Timetable, type Block } from "@/components/timetable";
import { EmptyState, ErrorState, Meter, PageHeader, Pill, SearchBox, Select } from "@/components/ui/kit";
import { useConfirm } from "@/components/ui/modal";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { send, useAction, useGet } from "@/hooks/use-api";
import type { Instructor, Slot } from "@/lib/types";
import { cn, dayDistance, fmtDate, money, plural, sum } from "@/lib/utils";

type Course = { id: string; code: string; title: string; credits: number; department: string; category: string; image: string; prerequisites: string[] };
type RegSection = {
  id: string;
  course: Course;
  name: string;
  instructor: Instructor;
  schedule: Slot[];
  capacity: number;
  enrolled: number;
  seatsLeft: number;
  missingPrereqs: string[];
  alreadyPassed: boolean;
  inProgress: boolean;
};
type RegSemester = { id: string; name: string; registrationDeadline?: string; minCredits: number; maxCredits: number; fees: { perCredit: number; registration: number; library: number; activity: number } };
type RegContext = {
  semester: RegSemester | null;
  sections: RegSection[];
  registered: { sectionIds: string[]; invoiceId: string | null; paid: number; locked: boolean };
  waiverPercent: number;
};

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
const overlap = (a: Slot, b: Slot) => a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
function firstClash(a: RegSection, b: RegSection) {
  for (const x of a.schedule) for (const y of b.schedule) if (overlap(x, y)) return { day: x.day, start: x.start };
  return null;
}
const slotText = (s: Slot) => `${s.day} ${s.start} to ${s.end}`;

function estimate(fees: RegSemester["fees"], credits: number, waiver: number) {
  const tuition = fees.perCredit * credits;
  const rows = [
    { label: `Tuition, ${credits} credits at ${money(fees.perCredit)}`, amount: tuition },
    { label: "Registration fee", amount: fees.registration },
    { label: "Library fee", amount: fees.library },
    { label: "Student activity fee", amount: fees.activity },
  ];
  const subtotal = sum(rows.map((r) => r.amount));
  const waiverAmount = Math.round((tuition * waiver) / 100);
  const total = subtotal - waiverAmount;
  return { rows, subtotal, waiverAmount, total, first: Math.round(total * 0.4) };
}

const REFRESH = ["/registration", "/dashboard", "/fees", "/academics", "/chat", "/notifications", "/courses"];

function Picker({ ctx }: { ctx: RegContext & { semester: RegSemester } }) {
  const { semester, sections, registered, waiverPercent } = ctx;
  const confirm = useConfirm();
  const [picked, setPicked] = useState<string[]>(registered.sectionIds);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const byId = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);
  const selected = picked.map((id) => byId.get(id)).filter((s): s is RegSection => !!s);
  const credits = sum(selected.map((s) => s.course.credits));
  const bill = estimate(semester.fees, credits, waiverPercent);
  const closed = !!semester.registrationDeadline && +new Date(semester.registrationDeadline) < Date.now();
  const locked = registered.locked || closed;
  const isRegistered = registered.sectionIds.length > 0;
  const dirty = [...picked].sort().join() !== [...registered.sectionIds].sort().join();

  const clashes = useMemo(() => {
    const out: { a: RegSection; b: RegSection; day: string; start: string }[] = [];
    for (let i = 0; i < selected.length; i++)
      for (let j = i + 1; j < selected.length; j++) {
        const c = firstClash(selected[i]!, selected[j]!);
        if (c) out.push({ a: selected[i]!, b: selected[j]!, ...c });
      }
    return out;
  }, [selected]);
  const clashIds = new Set(clashes.flatMap((c) => [c.a.id, c.b.id]));

  function reasonFor(s: RegSection): string | null {
    if (picked.includes(s.id)) return null;
    if (s.alreadyPassed) return "You have already passed this course";
    if (s.inProgress) return "You are taking this course right now";
    if (s.missingPrereqs.length) return `Needs ${s.missingPrereqs.join(" and ")} first`;
    if (s.seatsLeft === 0 && !registered.sectionIds.includes(s.id)) return "This section is full";
    for (const o of selected) {
      if (o.course.code === s.course.code) continue;
      const c = firstClash(s, o);
      if (c) return `Clashes with ${o.course.code} on ${c.day} at ${c.start}`;
    }
    return null;
  }

  function toggle(s: RegSection) {
    setPicked((cur) => {
      if (cur.includes(s.id)) return cur.filter((x) => x !== s.id);
      const sameCourse = new Set(sections.filter((x) => x.course.code === s.course.code).map((x) => x.id));
      return [...cur.filter((x) => !sameCourse.has(x)), s.id];
    });
  }

  const departments = [...new Set(sections.map((s) => s.course.department))].sort();
  const needle = q.trim().toLowerCase();
  const list = sections.filter((s) => (!dept || s.course.department === dept) && (!needle || `${s.course.code} ${s.course.title} ${s.instructor.name}`.toLowerCase().includes(needle)) && (!onlyOpen || picked.includes(s.id) || !reasonFor(s)));

  const problem =
    selected.length === 0 ? "Pick at least one course" : credits < semester.minCredits ? `Pick ${semester.minCredits - credits} more credit${semester.minCredits - credits === 1 ? "" : "s"} (minimum ${semester.minCredits})` : credits > semester.maxCredits ? `Remove ${credits - semester.maxCredits} credit${credits - semester.maxCredits === 1 ? "" : "s"} (maximum ${semester.maxCredits})` : clashes.length ? "Fix the class time clash" : null;

  const save = useAction(() => send<{ courses: number; credits: number; invoiceId: string; total: number }>("POST", "/registration", { sectionIds: picked }), {
    refresh: REFRESH,
    success: (r) => `You are registered for ${plural(r.courses, "course")} (${r.credits} credits). Your fees are ready on the Fees page.`,
  });
  const drop = useAction(() => send("DELETE", "/registration"), { refresh: REFRESH, success: "Your registration was cancelled and your seats were released", onSuccess: () => setPicked([]) });

  async function onConfirm() {
    const ok = await confirm({
      title: isRegistered ? "Update your registration?" : "Confirm your registration?",
      body: (
        <p>
          {plural(selected.length, "course")}, {credits} credits for {semester.name}. Your total fees will be <strong>{money(bill.total)}</strong>
          {waiverPercent ? ` after your ${waiverPercent}% tuition waiver` : ""}. You can still change this until you make your first payment.
        </p>
      ),
      confirmText: isRegistered ? "Update registration" : "Register now",
      tone: "primary",
    });
    if (ok) save.mutate();
  }
  async function onDrop() {
    const ok = await confirm({ title: "Cancel your registration?", body: "Your seats will be released and your unpaid fee invoice will be removed. You can register again before the deadline.", confirmText: "Cancel registration", cancelText: "Keep it", tone: "danger" });
    if (ok) drop.mutate();
  }

  const blocks: Block[] = selected.flatMap((s) => s.schedule.map((sl, i) => ({ key: `${s.id}-${i}`, day: sl.day, start: sl.start, end: sl.end, title: s.course.code, sub: sl.room, clash: clashIds.has(s.id) })));

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Semester registration"
        sub={
          <>
            {semester.name}. {semester.registrationDeadline ? (closed ? `Registration closed on ${fmtDate(semester.registrationDeadline)}.` : `Deadline ${fmtDate(semester.registrationDeadline)} (${dayDistance(semester.registrationDeadline)}).`) : "Choose your sections below."}
          </>
        }
        actions={
          isRegistered ? (
            <Pill tone="success">
              <CheckCircle2 className="size-3.5" /> Registered for {plural(registered.sectionIds.length, "course")}
            </Pill>
          ) : undefined
        }
      />

      {registered.locked && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/40 bg-warning/12 p-4">
          <Lock className="size-5 shrink-0 text-warning" />
          <p className="min-w-0 flex-1 text-sm">Your registration is locked because you have already paid part of your fees. Contact the registrar&apos;s office if you need a change.</p>
          <Link href="/fees" className="btn btn-sm btn-outline">
            Open fees
          </Link>
        </div>
      )}
      {closed && !registered.locked && (
        <div className="flex items-center gap-3 rounded-2xl border border-error/30 bg-error/8 p-4">
          <CalendarClock className="size-5 shrink-0 text-error" />
          <p className="text-sm">The registration deadline has passed. You can look around, but changes are closed.</p>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_25rem]">
        <section aria-labelledby="offered" className="grid gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <h2 id="offered" className="h-section mr-auto text-xl">
              Courses offered ({list.length})
            </h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" role="switch" className="toggle toggle-sm toggle-primary" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} />
              Only courses I can take
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
            <SearchBox value={q} onChange={setQ} placeholder="Search by code, title or instructor" />
            <Select label="Department" all="All departments" value={dept} onChange={setDept} options={departments.map((d) => ({ value: d, label: d }))} />
          </div>

          {list.length === 0 ? (
            <EmptyState title="No sections match" body="Clear the search or the department filter." />
          ) : (
            <Stagger key={`${q}${dept}${onlyOpen}`} className="grid gap-3" gap={0.03}>
              {list.map((s) => {
                const isPicked = picked.includes(s.id);
                const reason = reasonFor(s);
                const bad = clashIds.has(s.id);
                return (
                  <StaggerItem key={s.id}>
                    <article className={cn("surface grid gap-4 p-5 transition-shadow sm:grid-cols-[1fr_auto] sm:items-center", isPicked && "ring-2 ring-primary/70", bad && "ring-error/70", !isPicked && reason && "opacity-80")}>
                      <div className="flex min-w-0 gap-4">
                        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-center text-[0.7rem] leading-tight font-extrabold text-primary">
                          {s.course.code.split(" ").map((p) => (
                            <span key={p} className="block">
                              {p}
                            </span>
                          ))}
                        </span>
                        <div className="min-w-0">
                          <h3 className="flex flex-wrap items-center gap-x-2 text-lg leading-snug font-bold">
                            <Link href={`/courses/${s.course.id}`} className="transition-colors hover:text-primary">
                              {s.course.title}
                            </Link>
                            <Pill tone="secondary">{plural(s.course.credits, "credit")}</Pill>
                          </h3>
                          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/65">
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound className="size-4" /> Section {s.name}, {s.instructor.name}
                            </span>
                            <span>{s.course.department}</span>
                          </p>
                          <ul className="mt-2 flex flex-wrap gap-1.5">
                            {s.schedule.map((sl) => (
                              <li key={slotText(sl)} className="rounded-full border border-base-content/15 px-2.5 py-0.5 text-xs">
                                {slotText(sl)}
                                {sl.room ? `, ${sl.room}` : ""}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 flex max-w-xs items-center gap-3">
                            <Meter value={s.enrolled} max={s.capacity} tone={s.seatsLeft === 0 ? "error" : "primary"} className="flex-1" />
                            <span className="text-xs whitespace-nowrap text-base-content/60">{s.seatsLeft === 0 ? "Full" : `${s.seatsLeft} of ${s.capacity} seats left`}</span>
                          </div>
                          {s.course.prerequisites.length > 0 && <p className="mt-2 text-xs text-base-content/55">Prerequisites: {s.course.prerequisites.join(", ")}</p>}
                          {reason && (
                            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-error">
                              <AlertTriangle className="size-4" /> {reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="sm:justify-self-end">
                        {isPicked ? (
                          <button type="button" className="btn btn-outline btn-sm w-full sm:w-auto" disabled={locked} onClick={() => toggle(s)}>
                            <X className="size-4" /> Remove
                          </button>
                        ) : (
                          <button type="button" className="btn btn-primary btn-sm w-full sm:w-auto" disabled={locked || !!reason} onClick={() => toggle(s)}>
                            <Plus className="size-4" /> Add
                          </button>
                        )}
                      </div>
                    </article>
                  </StaggerItem>
                );
              })}
            </Stagger>
          )}
        </section>

        <aside className="grid gap-5 xl:sticky xl:top-24">
          <section className="surface p-6" aria-labelledby="mine">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="mine" className="h-section text-xl">
                Your selection
              </h2>
              <p className="text-sm font-bold">
                {credits} <span className="font-medium text-base-content/55">of {semester.maxCredits} credits</span>
              </p>
            </div>
            <Meter value={credits} max={semester.maxCredits} tone={credits > semester.maxCredits ? "error" : credits >= semester.minCredits ? "success" : "primary"} className="mt-3" />
            <p className="mt-2 text-xs text-base-content/55">
              Take {semester.minCredits} to {semester.maxCredits} credits this semester.
            </p>

            <ul className="mt-4 grid gap-2">
              <AnimatePresence initial={false}>
                {selected.map((s) => (
                  <motion.li key={s.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", clashIds.has(s.id) ? "bg-error/10" : "bg-base-200/80")}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{s.course.code}</span>
                        <span className="block truncate text-xs text-base-content/60">
                          {s.course.title} · {s.course.credits} cr
                        </span>
                      </span>
                      <button type="button" disabled={locked} onClick={() => toggle(s)} aria-label={`Remove ${s.course.code}`} className="btn btn-ghost btn-xs btn-circle">
                        <X className="size-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
              {selected.length === 0 && <li className="rounded-xl bg-base-200/60 px-4 py-6 text-center text-sm text-base-content/60">Nothing picked yet. Add courses from the list.</li>}
            </ul>

            {clashes.length > 0 && (
              <ul className="mt-3 grid gap-1.5 text-sm text-error" role="alert">
                {clashes.map((c) => (
                  <li key={c.a.id + c.b.id} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    {c.a.course.code} and {c.b.course.code} clash on {c.day} at {c.start}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 border-t border-base-content/10 pt-4">
              <h3 className="text-sm font-bold text-base-content/60">Fee estimate</h3>
              <dl className="mt-3 grid gap-2 text-sm">
                {selected.length > 0 &&
                  bill.rows.map((r) => (
                    <div key={r.label} className="flex justify-between gap-4">
                      <dt className="text-base-content/70">{r.label}</dt>
                      <dd className="font-semibold whitespace-nowrap">{money(r.amount)}</dd>
                    </div>
                  ))}
                {selected.length > 0 && bill.waiverAmount > 0 && (
                  <div className="flex justify-between gap-4 text-success">
                    <dt>Waiver ({waiverPercent}% of tuition)</dt>
                    <dd className="font-semibold whitespace-nowrap">- {money(bill.waiverAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-base-content/10 pt-3 text-base font-extrabold">
                  <dt>Total</dt>
                  <dd>{selected.length ? money(bill.total) : money(0)}</dd>
                </div>
              </dl>
              {selected.length > 0 && <p className="mt-2 text-xs text-base-content/55">Pay in 3 installments (40%, 30%, 30%). The first is {money(bill.first)}.</p>}
            </div>

            <div className="mt-5 grid gap-2">
              <button type="button" className="btn btn-primary" disabled={locked || !!problem || !dirty || save.isPending} onClick={onConfirm}>
                {save.isPending && <span className="loading loading-spinner loading-sm" />}
                {isRegistered ? "Update my registration" : "Confirm registration"}
              </button>
              {!locked && problem && <p className="text-center text-sm text-base-content/60">{problem}</p>}
              {!locked && !problem && !dirty && isRegistered && <p className="text-center text-sm text-base-content/60">No changes to save.</p>}
              {isRegistered && !registered.locked && !closed && (
                <button type="button" className="btn btn-ghost btn-sm text-error" disabled={drop.isPending} onClick={onDrop}>
                  <Trash2 className="size-4" /> Cancel my registration
                </button>
              )}
              {isRegistered && (
                <Link href="/fees" className="btn btn-outline btn-sm">
                  Go to fees <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </section>
        </aside>
      </div>

      <section className="surface p-5 sm:p-7" aria-labelledby="tt">
        <h2 id="tt" className="h-section mb-5 text-xl">
          Your weekly timetable
        </h2>
        <Timetable blocks={blocks} />
      </section>
    </div>
  );
}

export default function RegistrationPage() {
  const { data, isLoading, isError, error, refetch } = useGet<RegContext>("/registration/context");
  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <div className="grid gap-5">
        <div className="skeleton h-20 w-full max-w-lg rounded-2xl" />
        <div className="grid gap-6 xl:grid-cols-[1fr_25rem]">
          <div className="skeleton h-[32rem] rounded-2xl" />
          <div className="skeleton h-[32rem] rounded-2xl" />
        </div>
      </div>
    );
  if (!data.semester)
    return (
      <>
        <PageHeader title="Semester registration" />
        <EmptyState title="Registration is not open right now" body="When the registrar opens the next semester you will see the offered sections here, and a notice will be posted." action={<Link href="/courses" className="btn btn-primary btn-sm">Browse the course catalogue</Link>} />
      </>
    );
  return <Picker key={data.semester.id} ctx={data as RegContext & { semester: RegSemester }} />;
}
