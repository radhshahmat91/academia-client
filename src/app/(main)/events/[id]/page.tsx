"use client";

import { CalendarDays, MapPin, Mic2, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { catTone, eventState } from "@/components/cards";
import { Avatar, EmptyState, ErrorState, Meter, PageHeader, Pill } from "@/components/ui/kit";
import { Reveal } from "@/components/ui/motion";
import { Photo } from "@/components/ui/photo";
import { send, useAction, useGet } from "@/hooks/use-api";
import type { EventDetail } from "@/lib/types";
import { dayDistance, fmtLong, fmtTime, plural } from "@/lib/utils";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGet<EventDetail>(`/events/${id}`);
  const refresh = ["/events", "/dashboard"];
  const reserve = useAction(() => send("POST", `/events/${id}/register`), { refresh, success: "Your seat is reserved. Your ticket is below." });
  const cancel = useAction(() => send("DELETE", `/events/${id}/register`), { refresh, success: "Your reservation was cancelled" });

  if (isError) return error?.status === 404 ? <EmptyState title="That event was not found" body="It may have been cancelled." action={<Link href="/events" className="btn btn-primary btn-sm">Browse events</Link>} /> : <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data) return <div className="skeleton h-[30rem] w-full rounded-3xl" />;

  const { event: e, isRegistered, ticketNo, attendees } = data;
  const state = eventState(e);
  const left = Math.max(0, e.capacity - e.registered);
  const busy = reserve.isPending || cancel.isPending;
  const sameDay = fmtLong(e.startAt) === fmtLong(e.endAt);

  return (
    <div className="grid gap-8">
      <PageHeader back={{ href: "/events", label: "All events" }} title={e.title} sub={e.summary} />

      <section className="surface overflow-hidden">
        <div className="grid lg:grid-cols-[1.3fr_1fr]">
          <Photo src={e.image} alt={e.title} ratio="aspect-[16/10] lg:aspect-auto lg:min-h-[24rem]" priority>
            <span className="absolute top-4 left-4 flex gap-2">
              <Pill tone={catTone(e.category)} glass>
                {e.category}
              </Pill>
              {state === "live" ? <Pill tone="error">Happening now</Pill> : state === "past" ? <Pill tone="info" glass>Ended</Pill> : <Pill tone="secondary">{dayDistance(e.startAt)}</Pill>}
            </span>
          </Photo>
          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <ul className="grid gap-4">
              <li className="flex gap-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-bold">{fmtLong(e.startAt)}</span>
                  <span className="text-base-content/65">
                    {fmtTime(e.startAt)} to {sameDay ? fmtTime(e.endAt) : `${fmtLong(e.endAt)}, ${fmtTime(e.endAt)}`}
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="font-bold">{e.venue}</span>
              </li>
              <li className="flex gap-3">
                <Users className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="w-full">
                  <span className="block font-bold">
                    {e.registered} of {e.capacity} seats taken
                  </span>
                  <Meter value={e.registered} max={e.capacity} tone={left === 0 ? "error" : "primary"} className="mt-2" />
                </span>
              </li>
              {e.club && (
                <li className="flex gap-3 text-base-content/75">
                  <span className="size-5 shrink-0" />
                  <span>
                    Hosted by{" "}
                    <Link href={`/clubs/${e.club.id}`} className="font-semibold text-primary hover:underline">
                      {e.club.name}
                    </Link>
                  </span>
                </li>
              )}
            </ul>

            <div className="mt-auto">
              {isRegistered && ticketNo ? (
                <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 rounded-xl bg-white p-2">
                      <QRCodeSVG value={`${ticketNo}|${e.id}`} size={84} level="M" />
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <Ticket className="size-4" /> Your ticket
                      </p>
                      <p className="mt-0.5 text-2xl font-extrabold tracking-wider">{ticketNo}</p>
                      <p className="text-sm text-base-content/60">Show this at the entrance</p>
                    </div>
                  </div>
                  {state !== "past" && (
                    <button type="button" className="btn btn-outline btn-error btn-sm mt-4 w-full" disabled={busy} onClick={() => cancel.mutate()}>
                      {cancel.isPending && <span className="loading loading-spinner loading-sm" />} Cancel my reservation
                    </button>
                  )}
                </div>
              ) : state === "past" ? (
                <p className="rounded-xl bg-base-200 px-4 py-3 text-center font-semibold text-base-content/70">This event has finished</p>
              ) : left === 0 ? (
                <p className="rounded-xl bg-error/10 px-4 py-3 text-center font-semibold text-error">This event is fully booked</p>
              ) : (
                <button type="button" className="btn btn-primary btn-lg w-full" disabled={busy} onClick={() => reserve.mutate()}>
                  {reserve.isPending ? <span className="loading loading-spinner loading-sm" /> : <Ticket className="size-5" />} Reserve my seat
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-6">
          <Reveal>
            <section className="surface p-6 sm:p-8">
              <h2 className="h-section text-xl">About this event</h2>
              <div className="mt-4 grid gap-4 text-lg leading-relaxed text-base-content/85">
                {e.description.split(/\n{1,}/).filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {e.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {e.tags.map((t) => (
                    <li key={t} className="rounded-full border border-base-content/15 px-3 py-1 text-sm">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>

          {e.agenda.length > 0 && (
            <Reveal>
              <section className="surface p-6 sm:p-8">
                <h2 className="h-section text-xl">Agenda</h2>
                <ol className="relative mt-6 grid gap-6 border-l-2 border-primary/20 pl-7">
                  {e.agenda.map((a) => (
                    <li key={a.id} className="relative">
                      <span className="absolute top-1.5 -left-[2.2rem] size-3.5 rounded-full border-[3px] border-base-100 bg-primary ring-2 ring-primary/30" />
                      <p className="text-sm font-bold text-primary">{a.time}</p>
                      <p className="text-lg font-semibold">{a.title}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="grid gap-6">
          {e.speakers.length > 0 && (
            <Reveal>
              <section className="surface p-6">
                <h2 className="h-section flex items-center gap-2 text-xl">
                  <Mic2 className="size-5 text-primary" /> Speakers
                </h2>
                <ul className="mt-4 grid gap-4">
                  {e.speakers.map((s) => (
                    <li key={s.id} className="flex items-center gap-3">
                      <Avatar name={s.name} size={46} />
                      <span>
                        <span className="block font-bold">{s.name}</span>
                        <span className="text-sm text-base-content/60">{s.title}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}
          <Reveal>
            <section className="surface p-6">
              <h2 className="h-section text-xl">Who is going</h2>
              {attendees.length === 0 ? (
                <p className="mt-3 text-base-content/65">Nobody yet. Be the first.</p>
              ) : (
                <>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {attendees.slice(0, 18).map((a) => (
                      <li key={a.id} title={a.name}>
                        <Link href={`/students/${a.id}`} aria-label={a.name}>
                          <Avatar name={a.name} src={a.image} size={40} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-base-content/60">{plural(e.registered, "student")} registered</p>
                </>
              )}
            </section>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
