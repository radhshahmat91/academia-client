"use client";

import { ArrowUpRight, BookOpen, CalendarDays, MapPin, PlayCircle, Users } from "lucide-react";
import Link from "next/link";
import { Meter, Pill, type Tone } from "@/components/ui/kit";
import { Photo } from "@/components/ui/photo";
import type { ClubCard as Club, CourseCard as Course, EventCard as EventT, Notice } from "@/lib/types";
import { cn, dayDistance, dayNum, fmtDate, fmtTime, hash, monthOf, plural } from "@/lib/utils";

const TONES: Tone[] = ["primary", "info", "warning", "error", "success"];
/** The same category always gets the same colour */
export const catTone = (c: string): Tone => TONES[hash(c) % TONES.length]!;

const cardBase = "surface card-lift group flex h-full flex-col overflow-hidden";

export function CourseCard({ c }: { c: Course }) {
  return (
    <Link href={`/courses/${c.id}`} className={cardBase}>
      <Photo src={c.image} alt={c.title} zoom ratio="aspect-[16/10]">
        <span className="absolute top-3 left-3 rounded-full bg-base-100/92 px-3 py-1 text-xs font-bold backdrop-blur">{c.code}</span>
        <span className="absolute top-3 right-3 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-content">{plural(c.credits, "credit")}</span>
      </Photo>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-2 text-lg leading-snug font-bold transition-colors group-hover:text-primary">{c.title}</h3>
          <p className="mt-1 text-sm text-base-content/55">{c.department}</p>
        </div>
        <p className="line-clamp-2 text-[0.95rem] text-base-content/70">{c.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-base-content/8 pt-3 text-sm text-base-content/65">
          <span className="inline-flex items-center gap-1.5">
            <PlayCircle className="size-4 text-primary" /> {plural(c.lectureCount, "lecture")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-4 text-primary" /> {plural(c.noteCount, "note")}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ClubCard({ c }: { c: Club }) {
  return (
    <Link href={`/clubs/${c.id}`} className={cardBase}>
      <Photo src={c.image} alt={c.name} zoom ratio="aspect-[16/10]">
        <span className="absolute top-3 left-3">
          <Pill tone={catTone(c.category)} glass>
            {c.category}
          </Pill>
        </span>
      </Photo>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-primary">{c.name}</h3>
        <p className="line-clamp-2 text-[0.95rem] text-base-content/70">{c.tagline}</p>
        <div className="mt-auto flex items-center justify-between border-t border-base-content/8 pt-3 text-sm text-base-content/65">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4 text-primary" /> {plural(c.members, "member")}
          </span>
          <span>Since {c.founded}</span>
        </div>
      </div>
    </Link>
  );
}

export function eventState(e: Pick<EventT, "startAt" | "endAt">): "upcoming" | "live" | "past" {
  const now = Date.now();
  if (+new Date(e.endAt) < now) return "past";
  if (+new Date(e.startAt) <= now) return "live";
  return "upcoming";
}

export function EventCard({ e }: { e: EventT }) {
  const state = eventState(e);
  const left = Math.max(0, e.capacity - e.registered);
  return (
    <Link href={`/events/${e.id}`} className={cardBase}>
      <Photo src={e.image} alt={e.title} zoom ratio="aspect-[16/10]">
        <span className="absolute top-3 left-3 grid min-w-14 place-items-center rounded-2xl bg-base-100/95 px-3 py-1.5 text-center shadow-md backdrop-blur">
          <span className="text-xl leading-none font-extrabold">{dayNum(e.startAt)}</span>
          <span className="text-xs font-semibold text-primary">{monthOf(e.startAt)}</span>
        </span>
        <span className="absolute top-3 right-3">
          {state === "live" ? <Pill tone="error">Happening now</Pill> : state === "past" ? <Pill tone="info" glass>Ended</Pill> : <Pill tone="secondary">{dayDistance(e.startAt)}</Pill>}
        </span>
      </Photo>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-sm font-semibold text-primary">{e.category}</p>
          <h3 className="mt-0.5 line-clamp-2 text-lg leading-snug font-bold transition-colors group-hover:text-primary">{e.title}</h3>
        </div>
        <ul className="grid gap-1.5 text-sm text-base-content/70">
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-primary" /> {fmtDate(e.startAt)}, {fmtTime(e.startAt)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-primary" /> <span className="line-clamp-1">{e.venue}</span>
          </li>
        </ul>
        <div className="mt-auto grid gap-1.5 border-t border-base-content/8 pt-3">
          <Meter value={e.registered} max={e.capacity} tone={left === 0 ? "error" : "primary"} />
          <p className="text-sm text-base-content/60">{state === "past" ? `${e.registered} attended` : left === 0 ? "Fully booked" : `${plural(left, "seat")} left`}</p>
        </div>
      </div>
    </Link>
  );
}

const priorityTone: Record<Notice["priority"], Tone> = { urgent: "error", important: "warning", normal: "primary" };

export function NoticeRow({ n, className }: { n: Notice; className?: string }) {
  return (
    <Link href={`/notices/${n.id}`} className={cn("surface card-lift group flex items-start gap-4 p-5", className)}>
      <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", n.priority === "urgent" ? "bg-error" : n.priority === "important" ? "bg-warning" : "bg-primary/60")} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={catTone(n.category)}>{n.category}</Pill>
          {n.priority !== "normal" && <Pill tone={priorityTone[n.priority]}>{n.priority === "urgent" ? "Urgent" : "Important"}</Pill>}
          {n.pinned && <Pill tone="secondary">Pinned</Pill>}
          <span className="text-sm text-base-content/50">{fmtDate(n.publishedAt)}</span>
        </div>
        <h3 className="mt-2 text-lg leading-snug font-bold transition-colors group-hover:text-primary">{n.title}</h3>
        {n.excerpt && <p className="mt-1 line-clamp-2 text-[0.95rem] text-base-content/65">{n.excerpt}</p>}
      </div>
      <ArrowUpRight className="mt-1 size-5 shrink-0 text-base-content/30 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
    </Link>
  );
}
