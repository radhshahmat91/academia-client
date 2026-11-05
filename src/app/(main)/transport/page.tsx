"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bus, CheckCircle2, ChevronDown, Clock, MapPin, Printer, Users, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useCheckout } from "@/components/checkout";
import { EmptyState, ErrorState, Meter, PageHeader, Pill } from "@/components/ui/kit";
import { Modal, useConfirm } from "@/components/ui/modal";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Photo } from "@/components/ui/photo";
import { send, useAction, useGet } from "@/hooks/use-api";
import type { Pass, Route } from "@/lib/types";
import { cn, fmtDate, money, plural } from "@/lib/utils";

type PassRes = { passes: Pass[]; target: { id: string; name: string } | null; student: { name: string; studentId?: string; department?: string } };

function StopList({ stops }: { stops: Route["stops"] }) {
  return (
    <ol className="relative ml-2 grid gap-3 border-l-2 border-primary/25 pl-5">
      {stops.map((s, i) => (
        <li key={s.name} className="relative flex items-baseline justify-between gap-3">
          <span className={cn("absolute top-1.5 -left-[1.6rem] size-3 rounded-full border-2 border-base-100", i === stops.length - 1 ? "bg-secondary" : "bg-primary")} />
          <span className="font-medium">{s.name}</span>
          <span className="text-sm whitespace-nowrap text-base-content/60">{s.time}</span>
        </li>
      ))}
    </ol>
  );
}

function PassCard({ pass, onPay, onCancel, busy }: { pass: Pass; onPay: () => void; onCancel: () => void; busy: boolean }) {
  const active = pass.status === "active";
  const pending = pass.status === "pending";
  const inv = pass.invoice;
  return (
    <article className="print-sheet surface overflow-hidden">
      <div className={cn("flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-primary-content sm:px-8", active ? "bg-primary" : pending ? "bg-warning text-warning-content" : "bg-neutral")}>
        <p className="flex items-center gap-2 font-bold">
          <Bus className="size-5" /> University bus pass
        </p>
        <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">{active ? "Active" : pending ? "Waiting for payment" : pass.status === "expired" ? "Expired" : "Cancelled"}</span>
      </div>
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:p-8">
        <div className="grid gap-5">
          <div>
            <h2 className="h-section text-2xl">{pass.route.name}</h2>
            <p className="mt-1 text-base-content/65">
              Bus {pass.route.busNo} · route {pass.route.code}
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-base-content/55">Pickup stop</dt>
              <dd className="font-bold">{pass.stop}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/55">Semester</dt>
              <dd className="font-bold">{pass.semester.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/55">Pass number</dt>
              <dd className="font-bold tracking-wide">{pass.passNo}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/55">Valid</dt>
              <dd className="font-bold">{active && pass.validFrom && pass.validTo ? `${fmtDate(pass.validFrom)} to ${fmtDate(pass.validTo)}` : "After payment"}</dd>
            </div>
          </dl>
          <div className="no-print flex flex-wrap gap-3">
            {pending && inv && (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={onPay}>
                Pay {money(inv.total - inv.paid)} to activate
              </button>
            )}
            {pending && (
              <button type="button" className="btn btn-ghost text-error" disabled={busy} onClick={onCancel}>
                Cancel request
              </button>
            )}
            {active && (
              <button type="button" className="btn btn-outline" onClick={() => window.print()}>
                <Printer className="size-4" /> Print pass
              </button>
            )}
          </div>
        </div>
        <div className="grid justify-items-center gap-2 border-t-2 border-dashed border-base-content/20 pt-6 sm:border-t-0 sm:border-l-2 sm:pt-0 sm:pl-8">
          <div className={cn("rounded-2xl bg-white p-3 shadow-sm", !active && "opacity-30 grayscale")}>
            <QRCodeSVG value={`${pass.passNo}|${pass.route.code}|${pass.stop}`} size={140} level="M" />
          </div>
          <p className="max-w-40 text-center text-xs text-base-content/60">{active ? "Show this code to the bus supervisor" : "The code works after payment"}</p>
        </div>
      </div>
    </article>
  );
}

export default function TransportPage() {
  const routes = useGet<{ items: Route[] }>("/transport/routes", { auth: false });
  const mine = useGet<PassRes>("/transport/pass");
  const confirm = useConfirm();
  const { pay, starting, modal } = useCheckout();
  const [picking, setPicking] = useState<Route | null>(null);
  const [stop, setStop] = useState("");
  const [openRoute, setOpenRoute] = useState<string | null>(null);

  const request = useAction(() => send<{ passId: string; invoiceId: string }>("POST", "/transport/pass", { routeId: picking!.id, stop }), {
    refresh: ["/transport", "/fees", "/dashboard", "/notifications"],
    success: "Bus pass requested. Pay the fee to activate it.",
    onSuccess: (r) => {
      setPicking(null);
      pay(r.invoiceId, "full");
    },
  });
  const cancel = useAction((id: string) => send("DELETE", `/transport/pass/${id}`), { refresh: ["/transport", "/fees", "/dashboard"], success: "Your bus pass request was cancelled" });

  if (routes.isError) return <ErrorState message={routes.error?.message} retry={() => routes.refetch()} />;
  if (mine.isError) return <ErrorState message={mine.error?.message} retry={() => mine.refetch()} />;
  if (routes.isLoading || mine.isLoading || !routes.data || !mine.data)
    return (
      <div className="grid gap-5">
        <div className="skeleton h-20 w-full max-w-lg rounded-2xl" />
        <div className="skeleton h-56 rounded-2xl" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );

  const { passes, target } = mine.data;
  const current = passes.find((p) => target && p.semester.id === target.id && p.status !== "cancelled");
  const earlier = passes.filter((p) => p !== current);

  async function onCancel(p: Pass) {
    if (await confirm({ title: "Cancel this bus pass request?", body: "Your seat on the bus will be released and the unpaid invoice will be removed.", confirmText: "Cancel request", cancelText: "Keep it", tone: "danger" })) cancel.mutate(p.id);
  }

  return (
    <div className="grid gap-8">
      <PageHeader title="Transport" sub={`University buses connect the campus with the main parts of Dhaka. Pick a route and a pickup stop${target ? ` for ${target.name}` : ""}, pay the fee, and your pass appears here.`} />

      {current ? (
        <PassCard pass={current} busy={starting || cancel.isPending} onPay={() => current.invoice && pay(current.invoice.id, "full")} onCancel={() => onCancel(current)} />
      ) : (
        <div className="no-print rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
          <p className="text-lg font-bold">You do not have a bus pass{target ? ` for ${target.name}` : ""} yet</p>
          <p className="mt-1 text-base-content/70">Choose a route below to get one.</p>
        </div>
      )}

      <section className="no-print">
        <h2 className="h-section matra mb-7 text-2xl">Bus routes</h2>
        {routes.data.items.length === 0 ? (
          <EmptyState title="No routes yet" body="The transport office has not published any bus routes." />
        ) : (
          <Stagger className="grid gap-6 md:grid-cols-2" gap={0.06}>
            {routes.data.items.map((r) => {
              const isMine = current?.route.id === r.id;
              const open = openRoute === r.id;
              return (
                <StaggerItem key={r.id} className="h-full">
                  <article className="surface flex h-full flex-col overflow-hidden">
                    <Photo src={r.image} alt={r.name} ratio="aspect-[16/7]">
                      <span className="absolute top-3 left-3 rounded-full bg-base-100/95 px-3 py-1 text-xs font-bold backdrop-blur">Bus {r.busNo}</span>
                      <span className="absolute top-3 right-3 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-content">{money(r.fee)} per semester</span>
                    </Photo>
                    <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                      <div>
                        <h3 className="text-xl font-bold">{r.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-base-content/65">
                          <MapPin className="size-4 text-primary" /> {r.stops[0]?.name} to {r.stops[r.stops.length - 1]?.name} · {plural(r.stops.length, "stop")}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-base-content/65">
                          <Clock className="size-4 text-primary" /> First pickup {r.stops[0]?.time}
                        </p>
                      </div>
                      <div>
                        <Meter value={r.enrolled} max={r.capacity} tone={r.seatsLeft === 0 ? "error" : "primary"} />
                        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-base-content/60">
                          <Users className="size-4" /> {r.seatsLeft === 0 ? "No seats left" : `${r.seatsLeft} of ${r.capacity} seats left`}
                        </p>
                      </div>
                      <button type="button" aria-expanded={open} onClick={() => setOpenRoute(open ? null : r.id)} className="flex items-center gap-1 text-sm font-bold text-primary">
                        {open ? "Hide" : "See"} all stops <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <StopList stops={r.stops} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="mt-auto">
                        {isMine ? (
                          <p className="flex items-center justify-center gap-2 rounded-xl bg-success/12 py-2.5 font-semibold text-success">
                            <CheckCircle2 className="size-5" /> This is your route
                          </p>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary w-full"
                            disabled={!!current || r.seatsLeft === 0 || !target}
                            onClick={() => {
                              setPicking(r);
                              setStop(r.stops[0]?.name ?? "");
                            }}
                          >
                            {current ? "You already have a pass" : r.seatsLeft === 0 ? "Route is full" : !target ? "Passes are not open" : "Choose this route"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </section>

      {earlier.length > 0 && (
        <section className="no-print">
          <h2 className="h-section matra mb-7 text-2xl">Earlier passes</h2>
          <ul className="grid gap-3">
            {earlier.map((p) => (
              <li key={p.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
                <span>
                  <span className="font-bold">{p.route.name}</span>
                  <span className="block text-sm text-base-content/60">
                    {p.semester.name} · {p.stop} · {p.passNo}
                  </span>
                </span>
                <Pill tone={p.status === "expired" ? "info" : p.status === "active" ? "success" : "warning"}>{p.status}</Pill>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal
        open={!!picking}
        onClose={() => setPicking(null)}
        title={picking ? `Pickup stop on ${picking.name}` : ""}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setPicking(null)}>
              <X className="size-4" /> Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={!stop || request.isPending} onClick={() => request.mutate()}>
              {request.isPending && <span className="loading loading-spinner loading-sm" />} Request pass, {money(picking?.fee)}
            </button>
          </>
        }
      >
        {picking && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm text-base-content/70">Where will you board the bus?</legend>
            {picking.stops.map((s) => (
              <label key={s.name} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors", stop === s.name ? "border-primary bg-primary/6" : "border-base-content/10 hover:border-base-content/25")}>
                <input type="radio" name="stop" className="radio radio-primary radio-sm" checked={stop === s.name} onChange={() => setStop(s.name)} />
                <span className="flex-1 font-medium">{s.name}</span>
                <span className="text-sm text-base-content/60">{s.time}</span>
              </label>
            ))}
          </fieldset>
        )}
      </Modal>
      {modal}
    </div>
  );
}
