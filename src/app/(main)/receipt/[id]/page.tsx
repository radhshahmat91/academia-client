"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/kit";
import { Logo } from "@/components/shell/brand";
import { useGet } from "@/hooks/use-api";
import type { Invoice, Payment } from "@/lib/types";
import { cn, fmtDateTime, money } from "@/lib/utils";

type Res = {
  payment: Omit<Payment, "invoice"> & { invoice: Invoice };
  student: { name: string; email: string; studentId?: string; department?: string; batch?: string };
};
const METHOD = { wallet: "Mobile wallet", card: "Card", bank: "Bank transfer" } as const;

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGet<Res>(`/payments/${id}`);

  if (isError) return error?.status === 404 ? <EmptyState title="Receipt not found" body="This receipt does not exist or belongs to another student." action={<Link href="/fees" className="btn btn-primary btn-sm">Back to fees</Link>} /> : <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data) return <div className="skeleton mx-auto h-[40rem] w-full max-w-3xl rounded-3xl" />;

  const { payment: p, student: s } = data;
  const inv = p.invoice;
  const refunded = p.status === "refunded";
  const meta = [
    { k: "Receipt number", v: p.receiptNo },
    { k: "Date and time", v: fmtDateTime(p.paidAt ?? p.createdAt) },
    { k: "Transaction ID", v: p.txnId },
    { k: "Invoice number", v: inv.number },
    { k: "Payment method", v: `${METHOD[p.method as keyof typeof METHOD] ?? p.method}${p.payerRef ? `, ${p.payerRef}` : ""}` },
    ...(p.installmentNo ? [{ k: "Installment", v: `Number ${p.installmentNo}` }] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print">
        <PageHeader
          back={{ href: "/fees", label: "Fees and payments" }}
          title="Payment receipt"
          actions={
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer className="size-4" /> Print or save as PDF
            </button>
          }
        />
      </div>

      <article className="print-sheet surface relative overflow-hidden p-7 sm:p-10">
        <span aria-hidden="true" className={cn("pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 text-[7rem] font-black tracking-widest opacity-[0.05] select-none sm:text-[9rem]", refunded ? "text-warning" : "text-success")}>
          {refunded ? "REFUNDED" : "PAID"}
        </span>
        <header className="relative flex flex-wrap items-start justify-between gap-4 border-b-2 border-base-content/80 pb-6">
          <Logo />
          <div className="text-right">
            <h2 className="h-section text-2xl">Payment receipt</h2>
            <p className={cn("mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold", refunded ? "bg-warning/20 text-warning-content" : "bg-success/15 text-success")}>{refunded ? "Refunded" : "Payment received"}</p>
          </div>
        </header>

        <section className="relative mt-7 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 text-xs font-bold tracking-widest text-base-content/55 uppercase">Received from</h3>
            <p className="text-lg font-bold">{s.name}</p>
            <p className="text-base-content/75">{s.email}</p>
            {s.studentId && <p className="text-base-content/75">Student ID {s.studentId}</p>}
            {(s.department || s.batch) && (
              <p className="text-base-content/75">
                {s.department}
                {s.batch ? `, batch ${s.batch}` : ""}
              </p>
            )}
          </div>
          <dl className="grid gap-2 text-sm">
            {meta.map((m) => (
              <div key={m.k} className="flex justify-between gap-4">
                <dt className="text-base-content/60">{m.k}</dt>
                <dd className="text-right font-semibold break-all">{m.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="relative mt-9">
          <h3 className="mb-3 text-xs font-bold tracking-widest text-base-content/55 uppercase">{inv.title}</h3>
          <table className="w-full text-left text-[0.95rem]">
            <thead>
              <tr className="border-b border-base-content/15 text-sm text-base-content/60">
                <th className="py-2 font-semibold">Description</th>
                <th className="py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((i) => (
                <tr key={i.label} className="border-b border-base-content/8">
                  <td className="py-2.5 pr-4">{i.label}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">{money(i.amount)}</td>
                </tr>
              ))}
              {inv.waiverAmount > 0 && (
                <tr className="border-b border-base-content/8 text-success">
                  <td className="py-2.5 pr-4">Waiver ({inv.waiverPercent}% of tuition)</td>
                  <td className="py-2.5 text-right whitespace-nowrap">- {money(inv.waiverAmount)}</td>
                </tr>
              )}
              <tr>
                <td className="py-2.5 pr-4 font-bold">Invoice total</td>
                <td className="py-2.5 text-right font-bold whitespace-nowrap">{money(inv.total)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="relative mt-6 grid gap-2 rounded-2xl bg-base-200/70 p-5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-lg font-bold">Amount paid in this payment</span>
            <span className="text-3xl font-extrabold text-primary">{money(p.amount)}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm text-base-content/70">
            <span>Paid on the invoice so far</span>
            <span className="font-semibold">{money(inv.paid)}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm text-base-content/70">
            <span>Balance still due</span>
            <span className="font-semibold">{money(Math.max(0, inv.total - inv.paid))}</span>
          </div>
        </section>

        <footer className="relative mt-8 border-t border-base-content/12 pt-5 text-sm text-base-content/60">
          <p>This receipt was generated by AcademiaConnect and is valid without a signature. Keep it for your records.</p>
        </footer>
      </article>
    </div>
  );
}
