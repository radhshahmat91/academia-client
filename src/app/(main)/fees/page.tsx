"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bus, CheckCircle2, ChevronDown, CircleDollarSign, GraduationCap, ReceiptText, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCheckout } from "@/components/checkout";
import { EmptyState, ErrorState, Meter, PageHeader, Pill, StatCard, Tabs, type Tone } from "@/components/ui/kit";
import { CountUp, Stagger, StaggerItem } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import { methodLabel } from "@/lib/payments";
import type { Invoice, Payment } from "@/lib/types";
import { cn, fmtDate, fmtDateTime, money, plural } from "@/lib/utils";

type Res = { invoices: Invoice[]; payments: Payment[]; totals: { billed: number; paid: number; due: number } };
type Tab = "invoices" | "history";

function status(inv: Invoice): { tone: Tone; label: string } {
  if (inv.status === "paid") return { tone: "success", label: "Paid" };
  if (inv.overdue) return { tone: "error", label: "Overdue" };
  if (inv.status === "partial") return { tone: "warning", label: "Partly paid" };
  return { tone: "info", label: "Unpaid" };
}

function InvoiceCard({ inv, pay, busy }: { inv: Invoice; pay: (id: string, mode: "next" | "full") => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const st = status(inv);
  const split = inv.installments.length > 1;
  const Icon = inv.type === "transport" ? Bus : GraduationCap;
  return (
    <article className="surface overflow-hidden">
      <div className="grid gap-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", inv.type === "transport" ? "bg-info/12 text-info" : "bg-primary/10 text-primary")}>
              <Icon className="size-6" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg leading-snug font-bold">{inv.title}</h3>
              <p className="mt-0.5 text-sm text-base-content/60">
                {inv.number}
                {inv.semester ? ` · ${inv.semester.name}` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Pill tone={inv.type === "transport" ? "info" : "primary"}>{inv.type === "transport" ? "Transport" : "Tuition"}</Pill>
            <Pill tone={st.tone}>{st.label}</Pill>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-center sm:text-left">
          {[
            { k: "Total", v: inv.total, cls: "" },
            { k: "Paid", v: inv.paid, cls: "text-success" },
            { k: "Due", v: inv.due, cls: inv.due > 0 ? (inv.overdue ? "text-error" : "text-base-content") : "text-base-content/40" },
          ].map((x) => (
            <div key={x.k} className="rounded-2xl bg-base-200/70 px-3 py-3 sm:px-4">
              <dt className="text-sm text-base-content/60">{x.k}</dt>
              <dd className={cn("text-xl font-extrabold sm:text-2xl", x.cls)}>{money(x.v)}</dd>
            </div>
          ))}
        </dl>
        <Meter value={inv.paid} max={inv.total} tone="success" />

        {split && (
          <ol className="grid gap-2.5 sm:grid-cols-3">
            {inv.installments.map((ins) => {
              const late = !ins.paid && +new Date(ins.dueDate) < Date.now();
              return (
                <li key={ins.no} className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", ins.paid ? "border-success/30 bg-success/8" : late ? "border-error/40 bg-error/6" : "border-base-content/12")}>
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold", ins.paid ? "bg-success text-success-content" : "bg-base-200")}>{ins.paid ? <CheckCircle2 className="size-4" /> : ins.no}</span>
                  <span className="min-w-0">
                    <span className="block font-bold">{money(ins.amount)}</span>
                    <span className={cn("block text-xs", late ? "font-semibold text-error" : "text-base-content/60")}>{ins.paid ? "Paid" : `Due ${fmtDate(ins.dueDate)}`}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {!split && inv.status !== "paid" && <p className={cn("text-sm", inv.overdue ? "font-semibold text-error" : "text-base-content/65")}>Due by {fmtDate(inv.dueDate)}</p>}

        <div className="flex flex-wrap items-center gap-3">
          {inv.status !== "paid" &&
            (split && inv.next ? (
              <>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => pay(inv.id, "next")}>
                  <Wallet className="size-4" /> Pay installment {inv.next.no}, {money(inv.next.amount)}
                </button>
                {inv.due > inv.next.amount && (
                  <button type="button" className="btn btn-outline" disabled={busy} onClick={() => pay(inv.id, "full")}>
                    Pay everything, {money(inv.due)}
                  </button>
                )}
              </>
            ) : (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => pay(inv.id, "full")}>
                <Wallet className="size-4" /> Pay {money(inv.due)}
              </button>
            ))}
          <button type="button" className="btn btn-ghost ml-auto" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            Bill details <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <dl className="grid gap-2.5 border-t border-base-content/10 bg-base-200/40 px-5 py-5 text-sm sm:px-7">
              {inv.items.map((i) => (
                <div key={i.label} className="flex justify-between gap-6">
                  <dt className="text-base-content/75">{i.label}</dt>
                  <dd className="font-semibold whitespace-nowrap">{money(i.amount)}</dd>
                </div>
              ))}
              {inv.waiverAmount > 0 && (
                <div className="flex justify-between gap-6 text-success">
                  <dt>Waiver ({inv.waiverPercent}% of tuition)</dt>
                  <dd className="font-semibold whitespace-nowrap">- {money(inv.waiverAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-6 border-t border-base-content/10 pt-3 text-base font-extrabold">
                <dt>Total</dt>
                <dd>{money(inv.total)}</dd>
              </div>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export default function FeesPage() {
  const { data, isLoading, isError, error, refetch } = useGet<Res>("/fees");
  const [tab, setTab] = useState<Tab>("invoices");
  const { pay, starting, modal } = useCheckout();

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <div className="grid gap-5">
        <div className="skeleton h-20 w-full max-w-lg rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    );

  const { invoices, payments, totals } = data;
  const sorted = [...invoices].sort((a, b) => Number(b.status !== "paid") - Number(a.status !== "paid") || +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="grid gap-7">
      <PageHeader
        title="Fees and payments"
        sub="Pay your tuition and bus pass fees online. Every payment gets a receipt you can print."
        actions={
          <Link href="/transport" className="btn btn-outline btn-sm">
            <Bus className="size-4" /> Bus pass
          </Link>
        }
      />

      <Stagger className="grid gap-5 sm:grid-cols-3" gap={0.07}>
        <StaggerItem>
          <StatCard icon={<CircleDollarSign />} label="Total billed" value={<CountUp value={totals.billed} prefix="৳" />} tone="info" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={<CheckCircle2 />} label="Paid so far" value={<CountUp value={totals.paid} prefix="৳" />} tone="success" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={<Wallet />} label="Outstanding" value={<CountUp value={totals.due} prefix="৳" />} tone={totals.due ? "warning" : "success"} hint={totals.due ? undefined : "Nothing is due"} />
        </StaggerItem>
      </Stagger>

      <div>
        <Tabs
          tabs={[
            { value: "invoices", label: "Invoices", count: invoices.length },
            { value: "history", label: "Payment history", count: payments.length },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="pt-7">
          {tab === "invoices" &&
            (sorted.length === 0 ? (
              <EmptyState icon={<ReceiptText className="size-7" />} title="No invoices yet" body="Your fee invoice is created when you register for a semester." action={<Link href="/registration" className="btn btn-primary btn-sm">Go to registration</Link>} />
            ) : (
              <Stagger className="grid gap-5" gap={0.06}>
                {sorted.map((inv) => (
                  <StaggerItem key={inv.id}>
                    <InvoiceCard inv={inv} pay={pay} busy={starting} />
                  </StaggerItem>
                ))}
              </Stagger>
            ))}

          {tab === "history" &&
            (payments.length === 0 ? (
              <EmptyState icon={<ReceiptText className="size-7" />} title="No payments yet" body="Once you pay an installment, its receipt will be listed here." />
            ) : (
              <div className="surface overflow-hidden">
                <div className="hidden grid-cols-[1.1fr_1.6fr_1fr_1fr_auto] gap-4 border-b border-base-content/10 px-6 py-3 text-xs font-bold tracking-wide text-base-content/55 uppercase md:grid">
                  <span>Receipt</span>
                  <span>For</span>
                  <span>Method</span>
                  <span>Amount</span>
                  <span className="w-24" />
                </div>
                <ul>
                  {payments.map((p) => {
                    const inv = typeof p.invoice === "string" ? null : p.invoice;
                    return (
                      <li key={p.id} className="grid gap-2 border-b border-base-content/8 px-5 py-4 last:border-0 md:grid-cols-[1.1fr_1.6fr_1fr_1fr_auto] md:items-center md:gap-4 md:px-6">
                        <div>
                          <p className="font-bold">{p.receiptNo}</p>
                          <p className="text-sm text-base-content/60">{fmtDateTime(p.paidAt ?? p.createdAt)}</p>
                        </div>
                        <p className="min-w-0 text-[0.95rem]">
                          {inv?.title ?? "Payment"}
                          {p.installmentNo ? <span className="text-base-content/60"> · installment {p.installmentNo}</span> : null}
                        </p>
                        <p className="text-sm text-base-content/75">
                          {methodLabel(p.method)}
                          {p.payerRef ? <span className="block text-xs text-base-content/55">{p.payerRef}</span> : null}
                        </p>
                        <p className="flex items-center gap-2 font-bold">
                          {money(p.amount)} {p.status === "refunded" && <Pill tone="warning">Refunded</Pill>}
                        </p>
                        <Link href={`/receipt/${p.id}`} className="btn btn-outline btn-sm md:w-24">
                          Receipt
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <p className="px-6 py-4 text-sm text-base-content/55">Showing {plural(payments.length, "payment")}.</p>
              </div>
            ))}
        </div>
      </div>
      {modal}
    </div>
  );
}
