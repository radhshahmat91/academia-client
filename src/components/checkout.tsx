"use client";

import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, Landmark, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Field } from "@/components/ui/kit";
import { Modal } from "@/components/ui/modal";
import { send, useAction } from "@/hooks/use-api";
import { methodLabel } from "@/lib/payments";
import { cn, money } from "@/lib/utils";

export type CheckoutSession = { paymentId: string; txnId: string; amount: number; invoice: { id: string; number: string; title: string } };
type Method = "bkash" | "nagad" | "rocket" | "card" | "bank";

type MethodInfo = {
  value: Method;
  label: string;
  /** Mobile wallets are shown as three tiles side by side, the other methods as rows */
  wallet?: boolean;
  /** Colour of the wallet tile when it is chosen */
  accent?: string;
  hint?: string;
  icon: ReactNode;
  field: string;
  placeholder: string;
  inputMode: "numeric" | "text";
  max: number;
};

const METHODS: MethodInfo[] = [
  { value: "bkash", label: "bKash", wallet: true, accent: "#e2136e", icon: <Smartphone className="size-5" />, field: "bKash number", placeholder: "01XXXXXXXXX", inputMode: "numeric", max: 11 },
  { value: "nagad", label: "Nagad", wallet: true, accent: "#f7941d", icon: <Smartphone className="size-5" />, field: "Nagad number", placeholder: "01XXXXXXXXX", inputMode: "numeric", max: 11 },
  { value: "rocket", label: "Rocket", wallet: true, accent: "#8c3494", icon: <Smartphone className="size-5" />, field: "Rocket number", placeholder: "01XXXXXXXXX", inputMode: "numeric", max: 12 },
  { value: "card", label: "Bank card", hint: "Debit or credit, Visa or Mastercard", icon: <CreditCard className="size-5" />, field: "Last 4 digits of your card", placeholder: "1234", inputMode: "numeric", max: 4 },
  { value: "bank", label: "Bank transfer", hint: "Any bank in Bangladesh", icon: <Landmark className="size-5" />, field: "Bank transaction reference", placeholder: "Reference number", inputMode: "text", max: 30 },
];
const WALLETS = METHODS.filter((x) => x.wallet);
const OTHERS = METHODS.filter((x) => !x.wallet);

/** A Rocket number can carry one extra digit, so it accepts 11 or 12 digits */
const WALLET_RULE: Partial<Record<Method, { pattern: RegExp; message: string }>> = {
  bkash: { pattern: /^01\d{9}$/, message: "Enter your 11 digit bKash number that starts with 01" },
  nagad: { pattern: /^01\d{9}$/, message: "Enter your 11 digit Nagad number that starts with 01" },
  rocket: { pattern: /^01\d{9,10}$/, message: "Enter your Rocket number: 11 or 12 digits that start with 01" },
};

function validate(method: Method, ref: string, code: string) {
  const errors: { ref?: string; code?: string } = {};
  const wallet = WALLET_RULE[method];
  if (wallet && !wallet.pattern.test(ref)) errors.ref = wallet.message;
  if (method === "card" && !/^\d{4}$/.test(ref)) errors.ref = "Enter the last 4 digits of the card";
  if (method === "bank" && ref.trim().length < 4) errors.ref = "Enter the bank reference (at least 4 characters)";
  if (!/^\d{6}$/.test(code)) errors.code = "Enter the 6 digit verification code";
  return errors;
}

const tint = (color: string, percent: number) => `color-mix(in oklab, ${color} ${percent}%, transparent)`;

function CheckoutModal({ session, onClose }: { session: CheckoutSession; onClose: () => void }) {
  const [method, setMethod] = useState<Method>("bkash");
  const [ref, setRef] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ ref?: string; code?: string }>({});
  const [done, setDone] = useState<{ paymentId: string; invoiceStatus: string; due: number } | null>(null);
  const m = METHODS.find((x) => x.value === method)!;

  const pay = useAction(() => send<{ paymentId: string; invoiceStatus: string; paid: number; due: number }>("POST", `/payments/${session.paymentId}/confirm`, { method, payerRef: ref.trim(), code }), {
    refresh: ["/fees", "/dashboard", "/transport", "/notifications"],
    onSuccess: (r) => setDone(r),
  });

  function choose(next: Method) {
    setMethod(next);
    setRef("");
    setErrors({});
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate(method, ref.trim(), code);
    setErrors(v);
    if (!v.ref && !v.code) pay.mutate();
  }

  if (done)
    return (
      <Modal open onClose={onClose} title="Payment complete" size="sm" footer={<><Link href={`/receipt/${done.paymentId}`} onClick={onClose} className="btn btn-primary">View receipt</Link><button type="button" className="btn btn-ghost" onClick={onClose}>Done</button></>}>
        <div className="grid justify-items-center gap-3 py-4 text-center">
          <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12, stiffness: 200 }} className="grid size-20 place-items-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-11" />
          </motion.span>
          <p className="text-3xl font-extrabold">{money(session.amount)}</p>
          <p className="text-base-content/70">
            received for <strong>{session.invoice.title}</strong>, paid with {methodLabel(method)}
          </p>
          <p className="rounded-full bg-base-200 px-4 py-1.5 text-sm font-semibold">{done.invoiceStatus === "paid" ? "This invoice is fully paid" : `${money(done.due)} still due on this invoice`}</p>
        </div>
      </Modal>
    );

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!pay.isPending}
      title="Secure checkout"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={pay.isPending}>
            Cancel
          </button>
          <button type="submit" form="checkout-form" className="btn btn-primary" disabled={pay.isPending}>
            {pay.isPending && <span className="loading loading-spinner loading-sm" />} Pay {money(session.amount)}
          </button>
        </>
      }
    >
      <div className="mb-5 rounded-2xl bg-base-200/80 p-4">
        <p className="text-sm text-base-content/60">{session.invoice.number}</p>
        <p className="font-bold">{session.invoice.title}</p>
        <p className="mt-2 text-3xl font-extrabold">{money(session.amount)}</p>
        <p className="mt-1 text-xs text-base-content/55">Transaction {session.txnId}</p>
      </div>
      <p className="mb-5 flex items-start gap-2 rounded-xl border border-secondary/50 bg-secondary/15 p-3 text-sm">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-secondary-content dark:text-secondary" />
        <span>
          This is a demo gateway, so no real money moves. Use the verification code <strong className="tracking-widest">123456</strong>.
        </span>
      </p>
      <form id="checkout-form" onSubmit={submit} noValidate className="grid gap-5">
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-semibold">Pay with</legend>

          <div>
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-base-content/55 uppercase">Mobile wallet</p>
            <div className="grid grid-cols-3 gap-2">
              {WALLETS.map((x) => {
                const on = method === x.value;
                return (
                  <label
                    key={x.value}
                    className={cn("relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/60", !on && "border-base-content/10 hover:border-base-content/25")}
                    style={on ? { borderColor: x.accent, backgroundColor: tint(x.accent!, 9) } : undefined}
                  >
                    <input type="radio" name="method" className="sr-only" checked={on} onChange={() => choose(x.value)} />
                    <span className="grid size-10 place-items-center rounded-full" style={{ backgroundColor: tint(x.accent!, 15), color: x.accent }}>
                      {x.icon}
                    </span>
                    <span className="text-sm font-bold">{x.label}</span>
                    {on && <CheckCircle2 className="absolute top-1.5 right-1.5 size-4" style={{ color: x.accent }} aria-hidden />}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <p className="-mb-0.5 text-xs font-semibold tracking-wide text-base-content/55 uppercase">Card or bank</p>
            {OTHERS.map((x) => (
              <label key={x.value} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors", method === x.value ? "border-primary bg-primary/6" : "border-base-content/10 hover:border-base-content/25")}>
                <input type="radio" name="method" className="radio radio-primary radio-sm" checked={method === x.value} onChange={() => choose(x.value)} />
                <span className="grid size-10 place-items-center rounded-lg bg-base-200 text-primary">{x.icon}</span>
                <span>
                  <span className="block font-semibold">{x.label}</span>
                  <span className="block text-xs text-base-content/60">{x.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label={m.field} htmlFor="payer-ref" error={errors.ref}>
          <input id="payer-ref" className={cn("input w-full", errors.ref && "input-error")} inputMode={m.inputMode} maxLength={m.max} placeholder={m.placeholder} autoComplete="off" value={ref} onChange={(e) => setRef(m.inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value)} />
        </Field>
        <Field label="Verification code" htmlFor="pay-code" error={errors.code} hint="Demo code: 123456">
          <input id="pay-code" className={cn("input w-full tracking-[0.4em]", errors.code && "input-error")} inputMode="numeric" maxLength={6} placeholder="••••••" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </Field>
      </form>
    </Modal>
  );
}

/** `const { pay, modal } = useCheckout()` then render `{modal}` once and call `pay(invoiceId, "next" | "full")`. */
export function useCheckout() {
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const start = useAction(({ invoiceId, mode }: { invoiceId: string; mode: "next" | "full" }) => send<CheckoutSession>("POST", "/payments/checkout", { invoiceId, mode }), { onSuccess: (s) => setSession(s) });
  return {
    pay: (invoiceId: string, mode: "next" | "full") => start.mutate({ invoiceId, mode }),
    starting: start.isPending,
    modal: session ? <CheckoutModal key={session.paymentId} session={session} onClose={() => setSession(null)} /> : null,
  };
}
