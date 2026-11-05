"use client";

import { BookOpen, Bus, CalendarDays, ClipboardCheck, GraduationCap, HandCoins, Megaphone, Star, Users, UsersRound, Wallet, Receipt } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, ErrorState, Meter, PageHeader, Pill, StatCard, type Tone } from "@/components/ui/kit";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import { fmtDateTime, money, pretty } from "@/lib/utils";

type Stats = {
  counts: { students: number; courses: number; clubs: number; upcomingEvents: number; notices: number; activeEnrollments: number; evaluations: number; pendingPasses: number };
  revenue: { total: number; thisMonth: number; byMonth: { month: string; amount: number; payments: number }[]; byMethod: { method: string; amount: number; payments: number }[] };
  outstanding: { amount: number; invoices: number };
  registrations: { semester: string; enrollments: number }[];
  recentPayments: { id: string; amount: number; method?: string; status: string; paidAt?: string; receiptNo?: string; studentName: string; invoice?: { title?: string } | null }[];
};

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
/** Every month from the first to the last payment, so a quiet month shows as an empty slot instead of vanishing. */
const monthSeries = (rows: { month: string; amount: number }[]) => {
  if (!rows.length) return [];
  const by = new Map(rows.map((r) => [r.month, r.amount]));
  const out: { month: string; amount: number }[] = [];
  let [y, m] = rows[0]!.month.split("-").map(Number) as [number, number];
  const [ly, lm] = rows[rows.length - 1]!.month.split("-").map(Number) as [number, number];
  while (y < ly || (y === ly && m <= lm)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ month: key, amount: by.get(key) ?? 0 });
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out.slice(-12);
};
const monthLabel = (m: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", month: "short", year: "2-digit" }).format(new Date(`${m}-01T12:00:00+06:00`));
const tooltipStyle = { background: "var(--color-base-100)", border: "1px solid color-mix(in oklab, currentColor 12%, transparent)", borderRadius: 12, color: "var(--color-base-content)" };
const METHOD_TONE: Record<string, Tone> = { wallet: "secondary", card: "info", bank: "primary" };

function BarPanel({ title, sub, data, x, y, format, unit, color }: { title: string; sub: string; data: Record<string, string | number>[]; x: string; y: string; format: (n: number) => string; unit: string; color: string }) {
  return (
    <section className="surface p-6">
      <h2 className="h-section text-xl">{title}</h2>
      <p className="mt-1 text-sm text-base-content/60">{sub}</p>
      {data.length === 0 ? (
        <p className="py-16 text-center text-base-content/55">Nothing to show yet.</p>
      ) : (
        <div className="mt-5 h-64 w-full text-base-content" role="img" aria-label={`${title}: ${data.map((d) => `${d[x]} ${format(Number(d[y]))}`).join(", ")}`}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey={x} tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }} tickLine={false} axisLine={false} interval={0} />
              <YAxis tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }} tickLine={false} axisLine={false} tickFormatter={(v) => compact.format(Number(v))} width={48} />
              <Tooltip cursor={{ fill: "currentColor", fillOpacity: 0.06 }} contentStyle={tooltipStyle} formatter={(v) => [`${format(Number(v))}${unit}`, ""]} separator="" />
              <Bar dataKey={y} fill={color} radius={[8, 8, 0, 0]} maxBarSize={52} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default function AdminOverview() {
  const { data, isLoading, isError, error, refetch } = useGet<Stats>("/admin/stats", { staleTime: 30_000 });

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <>
        <PageHeader title="Admin overview" sub="How the platform is doing right now." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
        <div className="skeleton mt-6 h-80 rounded-3xl" />
      </>
    );

  const { counts: c, revenue: r, outstanding: o } = data;
  const methodTotal = r.byMethod.reduce((n, m) => n + m.amount, 0) || 1;
  const stats: { icon: React.ReactNode; label: string; value: number; tone: Tone; href: string; hint?: string }[] = [
    { icon: <Users />, label: "Students", value: c.students, tone: "primary", href: "/admin/users" },
    { icon: <BookOpen />, label: "Courses", value: c.courses, tone: "info", href: "/admin/courses" },
    { icon: <UsersRound />, label: "Clubs", value: c.clubs, tone: "secondary", href: "/admin/clubs" },
    { icon: <CalendarDays />, label: "Upcoming events", value: c.upcomingEvents, tone: "success", href: "/admin/events" },
    { icon: <Megaphone />, label: "Notices", value: c.notices, tone: "warning", href: "/admin/notices" },
    { icon: <ClipboardCheck />, label: "Active enrolments", value: c.activeEnrollments, tone: "primary", href: "/admin/grades" },
    { icon: <Star />, label: "Evaluations", value: c.evaluations, tone: "secondary", href: "/admin/evaluations", hint: "Submitted so far" },
    { icon: <Bus />, label: "Pending bus passes", value: c.pendingPasses, tone: c.pendingPasses ? "error" : "info", href: "/admin/passes", hint: c.pendingPasses ? "Awaiting payment" : "All settled" },
  ];

  return (
    <>
      <PageHeader
        title="Admin overview"
        sub="How the platform is doing right now."
        actions={
          <>
            <Link href="/admin/grades" className="btn btn-outline">
              <GraduationCap className="size-4" /> Enter grades
            </Link>
            <Link href="/admin/notices" className="btn btn-primary">
              <Megaphone className="size-4" /> Publish a notice
            </Link>
          </>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" gap={0.05}>
        {stats.map((s) => (
          <StaggerItem key={s.label} className="h-full">
            <StatCard icon={s.icon} label={s.label} value={<CountUp value={s.value} />} tone={s.tone} href={s.href} hint={s.hint} />
          </StaggerItem>
        ))}
      </Stagger>

      <Stagger className="mt-4 grid gap-4 md:grid-cols-3" gap={0.05} delay={0.15}>
        <StaggerItem className="h-full">
          <StatCard icon={<Wallet />} label="Collected so far" value={<CountUp value={r.total} prefix="৳" />} tone="success" href="/admin/finance" />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard icon={<Receipt />} label="Collected this month" value={<CountUp value={r.thisMonth} prefix="৳" />} tone="primary" href="/admin/finance" />
        </StaggerItem>
        <StaggerItem className="h-full">
          <StatCard icon={<HandCoins />} label="Still to collect" value={<CountUp value={o.amount} prefix="৳" />} tone={o.amount ? "warning" : "success"} hint={`${o.invoices} open invoice${o.invoices === 1 ? "" : "s"}`} href="/admin/finance" />
        </StaggerItem>
      </Stagger>

      <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-5">
        <Reveal className="lg:col-span-3">
          <BarPanel title="Fees collected" sub="Successful payments per month, in taka." data={monthSeries(r.byMonth).map((m) => ({ label: monthLabel(m.month), amount: m.amount }))} x="label" y="amount" format={money} unit="" color="var(--color-primary)" />
        </Reveal>
        <Reveal className="lg:col-span-2" delay={0.08}>
          <section className="surface h-full p-6">
            <h2 className="h-section text-xl">How students pay</h2>
            <p className="mt-1 text-sm text-base-content/60">Share of the money collected, by payment method.</p>
            {r.byMethod.length === 0 ? (
              <p className="py-16 text-center text-base-content/55">No payments yet.</p>
            ) : (
              <ul className="mt-6 grid gap-5">
                {[...r.byMethod]
                  .sort((a, b) => b.amount - a.amount)
                  .map((m) => (
                    <li key={m.method}>
                      <p className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="font-semibold">{pretty(m.method === "wallet" ? "Mobile wallet" : m.method === "card" ? "Card" : m.method === "bank" ? "Bank and counter" : m.method)}</span>
                        <span className="text-sm text-base-content/65">
                          {money(m.amount)} · {Math.round((m.amount / methodTotal) * 100)}%
                        </span>
                      </p>
                      <Meter value={(m.amount / methodTotal) * 100} tone={m.method === "wallet" ? "secondary" : m.method === "bank" ? "success" : "primary"} />
                      <p className="mt-1 text-xs text-base-content/55">{m.payments} payment{m.payments === 1 ? "" : "s"}</p>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </Reveal>
      </div>

      <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-5">
        <Reveal className="lg:col-span-2">
          <BarPanel title="Registrations" sub="Students enrolled per semester." data={data.registrations.map((x) => ({ label: x.semester.replace(/^(\w{3})\w* \d\d(\d\d)$/, "$1 $2"), count: x.enrollments }))} x="label" y="count" format={(n) => String(n)} unit=" enrolments" color="var(--color-secondary)" />
        </Reveal>
        <Reveal className="lg:col-span-3" delay={0.08}>
          <section className="surface h-full p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="h-section text-xl">Latest payments</h2>
                <p className="mt-1 text-sm text-base-content/60">The most recent money in and out.</p>
              </div>
              <Link href="/admin/finance" className="btn btn-ghost btn-sm">
                See all
              </Link>
            </div>
            {data.recentPayments.length === 0 ? (
              <EmptyState title="No payments yet" body="Payments show up here as students pay their fees." />
            ) : (
              <ul className="mt-4 divide-y divide-base-content/10">
                {data.recentPayments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.studentName}</p>
                      <p className="truncate text-sm text-base-content/60">
                        {p.invoice?.title ?? "Payment"} · {fmtDateTime(p.paidAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {p.method && <Pill tone={METHOD_TONE[p.method] ?? "primary"}>{pretty(p.method)}</Pill>}
                      <span className={p.status === "refunded" ? "font-bold text-error line-through" : "font-bold"}>{money(p.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Reveal>
      </div>
    </>
  );
}
