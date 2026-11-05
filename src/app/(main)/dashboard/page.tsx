"use client";

import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, BookOpen, ClipboardList, GraduationCap, MessagesSquare, Star, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { catTone } from "@/components/cards";
import { Avatar, EmptyState, ErrorState, Pill, StatCard } from "@/components/ui/kit";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { Photo } from "@/components/ui/photo";
import { useGet } from "@/hooks/use-api";
import { DAY_ORDER, cn, dayDistance, dayNum, fmtDate, fmtTime, monthOf, money, plural } from "@/lib/utils";
import type { Me, Notice } from "@/lib/types";

type RoutineItem = { day: string; start: string; end: string; room?: string; code: string; title: string; instructor?: string };
type Dashboard = {
  user: Me;
  stats: { cgpa: number | null; creditsEarned: number; currentCredits: number; dueAmount: number; unreadMessages: number; unreadNotifications: number; pendingEvaluations: number };
  semester: { id: string; name: string; startDate: string; endDate: string } | null;
  routine: RoutineItem[];
  currentCourses: { id: string; code: string; title: string; credits: number; category: string }[];
  registration: { semester: { id: string; name: string; registrationDeadline?: string }; registered: boolean } | null;
  gpaTrend: { semester: string; gpa: number }[];
  notices: Pick<Notice, "id" | "title" | "category" | "priority" | "pinned" | "publishedAt">[];
  events: { id: string; title: string; category: string; image: string; venue: string; startAt: string; capacity: number; registered: number }[];
  dues: { id: string; number: string; title: string; total: number; paid: number; dueDate: string; status: string }[];
  clubs: { id: string; name: string; image: string; category: string }[];
  pass: { id: string; stop: string; passNo: string; route: { name: string; busNo: string } } | null;
};

const DHAKA = "Asia/Dhaka";
const todayName = () => new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: DHAKA }).format(new Date());
const hourNow = () => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: DHAKA }).format(new Date()));
const greeting = () => (hourNow() < 12 ? "Good morning" : hourNow() < 17 ? "Good afternoon" : "Good evening");
const to12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h! % 12 || 12}:${String(m).padStart(2, "0")} ${h! >= 12 ? "PM" : "AM"}`;
};

function Banner({ tone, icon, title, text, href, cta }: { tone: "primary" | "warning" | "error"; icon: React.ReactNode; title: string; text: string; href: string; cta: string }) {
  const palette = { primary: "border-primary/25 bg-primary/8", warning: "border-warning/40 bg-warning/12", error: "border-error/30 bg-error/8" }[tone];
  return (
    <div className={cn("flex flex-wrap items-center gap-4 rounded-2xl border p-4 pr-5", palette)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-base-100 shadow-sm [&>svg]:size-5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-base-content/70">{text}</p>
      </div>
      <Link href={href} className="btn btn-sm btn-primary">
        {cta}
      </Link>
    </div>
  );
}

function Routine({ items }: { items: RoutineItem[] }) {
  const days = DAY_ORDER.filter((d) => d !== "Fri");
  const today = todayName();
  const byDay = useMemo(() => {
    const m: Record<string, RoutineItem[]> = {};
    for (const d of days) m[d] = items.filter((i) => i.day === d).sort((a, b) => a.start.localeCompare(b.start));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  const first = days.find((d) => d === today && byDay[d]!.length) ?? days.find((d) => byDay[d]!.length) ?? today;
  const [day, setDay] = useState<string>(days.includes(today as never) ? (byDay[today]?.length ? today : first) : first);
  const list = byDay[day] ?? [];

  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="h-section text-xl">Class routine</h2>
        <Link href="/my-courses" className="text-sm font-bold text-primary hover:underline">
          Semester courses
        </Link>
      </div>
      <div role="tablist" className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {days.map((d) => (
          <button key={d} type="button" role="tab" aria-selected={day === d} onClick={() => setDay(d)} className={cn("relative shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors", day === d ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/70 hover:bg-base-300")}>
            {d}
            {d === today && <span className={cn("absolute top-1.5 right-1.5 size-1.5 rounded-full", day === d ? "bg-secondary" : "bg-primary")} aria-label="today" />}
            {!!byDay[d]!.length && <span className="ml-1.5 opacity-70">{byDay[d]!.length}</span>}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        {list.length === 0 ? (
          <p className="rounded-xl bg-base-200 px-4 py-8 text-center text-base-content/60">No classes on {day}. Enjoy the free day.</p>
        ) : (
          list.map((c, i) => (
            <motion.div key={`${day}${c.code}${c.start}`} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-stretch gap-4 rounded-2xl border border-base-content/8 p-4">
              <div className="grid w-24 shrink-0 content-center border-r border-base-content/10 pr-4 text-sm">
                <span className="font-bold">{to12(c.start)}</span>
                <span className="text-base-content/55">{to12(c.end)}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold">
                  {c.code} <span className="font-medium text-base-content/70">{c.title}</span>
                </p>
                <p className="mt-0.5 text-sm text-base-content/60">
                  {c.room}
                  {c.instructor ? ` · ${c.instructor}` : ""}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}

function GpaChart({ data }: { data: Dashboard["gpaTrend"] }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="h-section text-xl">GPA by semester</h2>
      {data.length < 2 ? (
        <p className="mt-6 rounded-xl bg-base-200 px-4 py-10 text-center text-base-content/60">Your trend appears after two semesters of results.</p>
      ) : (
        <div className="mt-5 h-60 w-full text-base-content" role="img" aria-label={`GPA by semester: ${data.map((d) => `${d.semester} ${d.gpa}`).join(", ")}`}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gpaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="semester" tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }} tickLine={false} axisLine={false} />
              <YAxis domain={[2, 4]} ticks={[2, 2.5, 3, 3.5, 4]} tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--color-base-100)", border: "1px solid color-mix(in oklab, currentColor 12%, transparent)", borderRadius: 12, color: "var(--color-base-content)" }} formatter={(v) => [Number(v).toFixed(2), "GPA"]} />
              <Area type="monotone" dataKey="gpa" stroke="var(--color-primary)" strokeWidth={3} fill="url(#gpaFill)" dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }} activeDot={{ r: 6 }} animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useGet<Dashboard>("/dashboard", { staleTime: 20_000 });

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <div className="grid gap-6">
        <div className="skeleton h-24 w-full max-w-lg rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );

  const { user, stats, semester, registration } = data;
  const firstName = user.name.split(" ")[0];
  const overdue = data.dues.find((d) => +new Date(d.dueDate) < Date.now());

  return (
    <div className="grid gap-7">
      <Reveal y={10}>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="h-section matra text-3xl sm:text-4xl">
              {greeting()}, {firstName}
            </h1>
            <p className="mt-2 text-base-content/65">
              {semester ? (
                <>
                  {semester.name} runs until {fmtDate(semester.endDate)}.
                </>
              ) : (
                "No semester is running right now."
              )}
              {user.studentId && <> Student ID {user.studentId}.</>}
            </p>
          </div>
          <Link href="/profile" className="btn btn-outline btn-sm">
            <Avatar name={user.name} src={user.image} size={22} /> My profile
          </Link>
        </header>
      </Reveal>

      {(registration && !registration.registered) || stats.pendingEvaluations > 0 || overdue ? (
        <Stagger className="grid gap-3" gap={0.08}>
          {registration && !registration.registered && (
            <StaggerItem>
              <Banner tone="primary" icon={<ClipboardList className="text-primary" />} title={`Registration for ${registration.semester.name} is open`} text={registration.semester.registrationDeadline ? `Choose your sections before ${fmtDate(registration.semester.registrationDeadline)} (${dayDistance(registration.semester.registrationDeadline)}).` : "Choose your sections now."} href="/registration" cta="Register" />
            </StaggerItem>
          )}
          {stats.pendingEvaluations > 0 && (
            <StaggerItem>
              <Banner tone="warning" icon={<Star className="text-warning" />} title={`${plural(stats.pendingEvaluations, "course evaluation")} waiting`} text="Results for your last semester unlock once every evaluation is submitted." href="/evaluation" cta="Evaluate" />
            </StaggerItem>
          )}
          {overdue && (
            <StaggerItem>
              <Banner tone="error" icon={<AlertCircle className="text-error" />} title="A payment is overdue" text={`${overdue.title} was due on ${fmtDate(overdue.dueDate)}.`} href="/fees" cta="Pay now" />
            </StaggerItem>
          )}
        </Stagger>
      ) : null}

      <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" gap={0.07}>
        <StaggerItem>
          <StatCard icon={<GraduationCap />} label="CGPA" value={stats.cgpa != null ? <CountUp value={stats.cgpa} decimals={2} /> : "Not yet"} hint={`${stats.creditsEarned} credits earned`} href="/my-courses" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={<BookOpen />} label="This semester" value={<CountUp value={stats.currentCredits} suffix=" credits" />} hint={plural(data.currentCourses.length, "course")} tone="info" href="/my-courses" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={<Wallet />} label="Fees due" value={money(stats.dueAmount)} hint={stats.dueAmount ? "Pay from the fees page" : "You are all paid up"} tone={stats.dueAmount ? "warning" : "success"} href="/fees" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={<MessagesSquare />} label="Unread messages" value={<CountUp value={stats.unreadMessages} />} hint="Across chats and groups" tone="secondary" href="/messages" />
        </StaggerItem>
      </Stagger>

      <div className="grid items-start gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="grid gap-6">
          <Reveal>
            <Routine items={data.routine} />
          </Reveal>
          <Reveal>
            <GpaChart data={data.gpaTrend} />
          </Reveal>
          <Reveal>
            <section className="surface p-5 sm:p-6">
              <h2 className="h-section text-xl">My courses this semester</h2>
              {data.currentCourses.length === 0 ? (
                <p className="mt-4 text-base-content/60">You are not enrolled in any course right now.</p>
              ) : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {data.currentCourses.map((c) => (
                    <li key={c.id}>
                      <Link href={`/courses/${c.id}`} className="card-lift group flex h-full items-center gap-4 rounded-2xl border border-base-content/10 p-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">{c.code.split(" ")[0]}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold transition-colors group-hover:text-primary">{c.title}</span>
                          <span className="text-sm text-base-content/60">
                            {c.code} · {plural(c.credits, "credit")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>
        </div>

        <aside className="grid gap-6">
          <Reveal>
            <section className="surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="h-section text-xl">Upcoming events</h2>
                <Link href="/events" className="text-sm font-bold text-primary hover:underline">
                  All
                </Link>
              </div>
              <ul className="mt-4 grid gap-3">
                {data.events.length === 0 && <li className="text-base-content/60">Nothing scheduled yet.</li>}
                {data.events.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.id}`} className="group flex items-center gap-3">
                      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-secondary/25 text-center leading-none">
                        <span>
                          <span className="block text-lg font-extrabold">{dayNum(e.startAt)}</span>
                          <span className="block text-xs font-semibold">{monthOf(e.startAt)}</span>
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 font-bold transition-colors group-hover:text-primary">{e.title}</span>
                        <span className="text-sm text-base-content/60">{fmtTime(e.startAt)} · {e.venue}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal>
            <section className="surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="h-section text-xl">Latest notices</h2>
                <Link href="/notices" className="text-sm font-bold text-primary hover:underline">
                  All
                </Link>
              </div>
              <ul className="mt-4 grid gap-4">
                {data.notices.map((n) => (
                  <li key={n.id}>
                    <Link href={`/notices/${n.id}`} className="group block">
                      <span className="flex flex-wrap items-center gap-2">
                        <Pill tone={catTone(n.category)}>{n.category}</Pill>
                        {n.priority === "urgent" && <Pill tone="error">Urgent</Pill>}
                        <span className="text-xs text-base-content/50">{fmtDate(n.publishedAt)}</span>
                      </span>
                      <span className="mt-1 block font-semibold transition-colors group-hover:text-primary">{n.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal>
            <section className="surface p-5 sm:p-6">
              <h2 className="h-section text-xl">Payments</h2>
              {data.dues.length === 0 ? (
                <p className="mt-4 text-base-content/60">Nothing is due. Nice.</p>
              ) : (
                <ul className="mt-4 grid gap-3">
                  {data.dues.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-base-200/70 p-3">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{d.title}</span>
                        <span className={cn("text-sm", +new Date(d.dueDate) < Date.now() ? "font-semibold text-error" : "text-base-content/60")}>Due {fmtDate(d.dueDate)}</span>
                      </span>
                      <span className="text-right font-bold">{money(d.total - d.paid)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/fees" className="btn btn-primary btn-sm mt-4 w-full">
                Go to fees <ArrowRight className="size-4" />
              </Link>
            </section>
          </Reveal>

          <Reveal>
            <section className="surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="h-section text-xl">My clubs</h2>
                <Link href="/clubs" className="text-sm font-bold text-primary hover:underline">
                  Browse
                </Link>
              </div>
              {data.clubs.length === 0 ? (
                <EmptyState icon={<Users className="size-6" />} title="No clubs yet" body="Join one to get a group chat and event invites." />
              ) : (
                <ul className="mt-4 grid gap-3">
                  {data.clubs.map((c) => (
                    <li key={c.id}>
                      <Link href={`/clubs/${c.id}`} className="group flex items-center gap-3">
                        <Photo src={c.image} alt={c.name} ratio="size-12" className="shrink-0 rounded-xl" />
                        <span className="min-w-0">
                          <span className="block truncate font-bold transition-colors group-hover:text-primary">{c.name}</span>
                          <span className="text-sm text-base-content/60">{c.category}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>

          {data.pass && (
            <Reveal>
              <Link href="/transport" className="surface card-lift block bg-primary/5 p-5">
                <p className="font-bold">Bus pass active</p>
                <p className="mt-1 text-sm text-base-content/70">
                  {data.pass.route.name} · {data.pass.route.busNo} · pickup at {data.pass.stop}
                </p>
              </Link>
            </Reveal>
          )}
        </aside>
      </div>
    </div>
  );
}
