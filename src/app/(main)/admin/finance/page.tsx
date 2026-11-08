"use client";

import { HandCoins, Undo2 } from "lucide-react";
import { useState } from "react";
import type { Column } from "@/components/admin/table";
import { ListView } from "@/components/admin/table";
import { Field, PageHeader, Pill, Spinner, Tabs, type Tone } from "@/components/ui/kit";
import { Modal, useConfirm } from "@/components/ui/modal";
import { send, useAction } from "@/hooks/use-api";
import { methodLabel } from "@/lib/payments";
import { fmtDate, fmtDateTime, money, pretty } from "@/lib/utils";

type Invoice = { id: string; number: string; title: string; type: string; status: "unpaid" | "partial" | "paid" | "cancelled"; total: number; paid: number; due: number; dueDate?: string; studentName: string; studentCode: string; semester?: { name: string } | null };
type Payment = { id: string; receiptNo?: string; txnId?: string; amount: number; method?: string; status: "pending" | "success" | "failed" | "refunded"; paidAt?: string; createdAt: string; studentName: string; studentCode: string; invoice?: { title?: string; number?: string } | null };

const INV_TONE: Record<Invoice["status"], Tone> = { paid: "success", partial: "warning", unpaid: "error", cancelled: "info" };
const PAY_TONE: Record<Payment["status"], Tone> = { success: "success", pending: "warning", failed: "error", refunded: "info" };

const Student = ({ name, code }: { name: string; code: string }) => (
  <div>
    <p className="font-semibold">{name}</p>
    <p className="text-sm text-base-content/60">{code}</p>
  </div>
);

/** Mounted fresh (via `key`) for every invoice, so the fields always start from that invoice's balance. */
function RecordPayment({ invoice, open, onClose }: { invoice: Invoice; open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState(String(invoice.due));
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const pay = useAction((v: { id: string; amount: number; note: string }) => send("POST", `/admin/invoices/${v.id}/payments`, { amount: v.amount, note: v.note || undefined }), {
    refresh: ["/admin/invoices", "/admin/payments", "/admin/stats", "/admin/passes", "/fees", "/dashboard", "/notifications", "/transport"],
    success: (_, v) => `Recorded ${money(v.amount)} against the invoice`,
    onSuccess: onClose,
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!amount.trim() || !Number.isFinite(n) || n <= 0) return setErr("Enter an amount above zero");
    if (n > invoice.due) return setErr(`That is more than the ${money(invoice.due)} still due`);
    setErr("");
    pay.mutate({ id: invoice.id, amount: n, note: note.trim() });
  };
  return (
    <Modal
      open={open}
      onClose={() => !pay.isPending && onClose()}
      title="Record a payment"
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={pay.isPending}>
            Cancel
          </button>
          <button type="submit" form="record-payment" className="btn btn-primary min-w-32" disabled={pay.isPending}>
            {pay.isPending ? <Spinner className="size-4" /> : "Record payment"}
          </button>
        </>
      }
    >
      <form id="record-payment" onSubmit={submit} noValidate className="grid gap-5">
        <div className="rounded-2xl bg-base-200 p-4 text-sm">
          <p className="font-bold">{invoice.title}</p>
          <p className="text-base-content/65">
            {invoice.studentName} · {invoice.studentCode} · {invoice.number}
          </p>
          <p className="mt-2">
            Still due: <b>{money(invoice.due)}</b> of {money(invoice.total)}
          </p>
        </div>
        <Field label="Amount received (taka)" htmlFor="rp-amount" error={err} hint="Use this for cash or bank deposits taken at the accounts office.">
          <input id="rp-amount" className={`input w-full ${err ? "input-error" : ""}`} type="number" inputMode="decimal" min={1} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!err || undefined} autoFocus />
        </Field>
        <Field label="Note" htmlFor="rp-note" optional>
          <input id="rp-note" className="input w-full" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="Counter 2, cash" />
        </Field>
      </form>
    </Modal>
  );
}

function Invoices() {
  const [sel, setSel] = useState<{ inv: Invoice; n: number } | null>(null);
  const [open, setOpen] = useState(false);
  const columns: Column<Invoice>[] = [
    {
      header: "Invoice",
      cell: (r) => (
        <div className="min-w-0">
          <p className="max-w-[16rem] truncate font-bold">{r.title}</p>
          <p className="text-sm text-base-content/60">{r.number}</p>
        </div>
      ),
    },
    { header: "Student", cell: (r) => <Student name={r.studentName} code={r.studentCode} /> },
    {
      header: "Balance",
      cell: (r) => (
        <div className="whitespace-nowrap">
          <p className="font-bold">{money(r.due)}</p>
          <p className="text-xs text-base-content/55">
            {money(r.paid)} of {money(r.total)}
          </p>
        </div>
      ),
    },
    { header: "Status", cell: (r) => <Pill tone={INV_TONE[r.status]}>{pretty(r.status)}</Pill> },
    { header: "Semester", hide: "2xl", cell: (r) => <span className="text-sm whitespace-nowrap">{r.semester?.name}</span> },
    { header: "Next due", hide: "2xl", cell: (r) => (r.status === "paid" || r.status === "cancelled" ? "" : <span className="text-sm whitespace-nowrap">{fmtDate(r.dueDate)}</span>) },
  ];
  return (
    <>
      <ListView<Invoice>
        path="/admin/invoices"
        noun="invoices"
        placeholder="Search by invoice number, student name or ID"
        columns={columns}
        filters={[
          {
            key: "status",
            label: "Status",
            all: "Any status",
            options: ["unpaid", "partial", "paid", "cancelled"].map((v) => ({ value: v, label: pretty(v) })),
          },
          {
            key: "type",
            label: "Type",
            all: "Any type",
            options: [
              { value: "tuition", label: "Tuition" },
              { value: "transport", label: "Transport" },
              { value: "other", label: "Other" },
            ],
          },
        ]}
        actions={(r) =>
          r.due > 0 && r.status !== "cancelled" ? (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              aria-label={`Record a payment for ${r.number}`}
              title="Record a payment"
              onClick={() => {
                setSel({ inv: r, n: Date.now() });
                setOpen(true);
              }}
            >
              <HandCoins className="size-4" /> <span className="hidden 2xl:inline">Record payment</span>
            </button>
          ) : null
        }
      />
      {sel && <RecordPayment key={sel.n} invoice={sel.inv} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

function Payments() {
  const confirm = useConfirm();
  const refund = useAction((id: string) => send("POST", `/admin/payments/${id}/refund`), {
    refresh: ["/admin/payments", "/admin/invoices", "/admin/stats", "/admin/passes", "/fees", "/dashboard", "/notifications", "/transport"],
    success: "The payment was refunded and the student was told",
  });
  const columns: Column<Payment>[] = [
    {
      header: "Receipt",
      cell: (r) => (
        <div>
          <p className="font-bold">{r.receiptNo ?? "Pending"}</p>
          <p className="text-xs text-base-content/55">{r.txnId}</p>
        </div>
      ),
    },
    { header: "Student", cell: (r) => <Student name={r.studentName} code={r.studentCode} /> },
    { header: "For", hide: "2xl", cell: (r) => <span className="block max-w-[14rem] truncate text-sm">{r.invoice?.title}</span> },
    { header: "Method", hide: "xl", cell: (r) => (r.method ? <Pill tone="primary">{methodLabel(r.method)}</Pill> : null) },
    { header: "Amount", cell: (r) => <span className="font-bold whitespace-nowrap">{money(r.amount)}</span> },
    { header: "Status", cell: (r) => <Pill tone={PAY_TONE[r.status]}>{pretty(r.status)}</Pill> },
    { header: "Date", hide: "lg", cell: (r) => <span className="text-sm whitespace-nowrap">{fmtDateTime(r.paidAt ?? r.createdAt)}</span> },
  ];
  return (
    <ListView<Payment>
      path="/admin/payments"
      noun="payments"
      placeholder="Search by receipt or transaction number"
      columns={columns}
      filters={[{ key: "status", label: "Status", all: "Any status", options: ["success", "pending", "failed", "refunded"].map((v) => ({ value: v, label: pretty(v) })) }]}
      actions={(r) =>
        r.status === "success" ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm text-error"
            aria-label={`Refund ${r.receiptNo}`}
            title="Refund this payment"
            disabled={refund.isPending}
            onClick={async () => {
              const ok = await confirm({ title: "Refund this payment?", body: `${money(r.amount)} from ${r.studentName} (${r.receiptNo}) will be reversed and the invoice will show the balance as due again.`, confirmText: "Refund", tone: "danger" });
              if (ok) refund.mutate(r.id);
            }}
          >
            <Undo2 className="size-4" /> <span className="hidden 2xl:inline">Refund</span>
          </button>
        ) : null
      }
    />
  );
}

export default function AdminFinance() {
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  return (
    <>
      <PageHeader title="Fees and payments" sub="See every invoice, take cash at the counter and refund payments when something went wrong." />
      <div className="mb-6">
        <Tabs
          tabs={[
            { value: "invoices", label: "Invoices" },
            { value: "payments", label: "Payments" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === "invoices" ? <Invoices /> : <Payments />}
    </>
  );
}
