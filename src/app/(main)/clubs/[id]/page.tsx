"use client";

import { Award, Clock, Mail, MessagesSquare, ShieldCheck, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FaFacebook, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { catTone } from "@/components/cards";
import { Avatar, EmptyState, ErrorState, PageHeader, Pill } from "@/components/ui/kit";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { Photo } from "@/components/ui/photo";
import { send, useAction, useGet } from "@/hooks/use-api";
import type { ClubDetail } from "@/lib/types";
import { dayNum, fmtDate, fmtTime, monthOf, plural } from "@/lib/utils";

const roleTone = (r: string) => (/president|chair|lead/i.test(r) ? "secondary" : /vice|secretary|treasurer|coordinator/i.test(r) ? "info" : "primary");

export default function ClubPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGet<ClubDetail>(`/clubs/${id}`);
  const refresh = [`/clubs`, "/dashboard", "/chat/conversations"];
  const join = useAction(() => send("POST", `/clubs/${id}/join`), { refresh, success: "You joined the club. Say hello in the group chat." });
  const leave = useAction(() => send("DELETE", `/clubs/${id}/join`), { refresh, success: "You left the club" });

  if (isError) return error?.status === 404 ? <EmptyState title="That club was not found" body="It may have been closed." action={<Link href="/clubs" className="btn btn-primary btn-sm">Browse clubs</Link>} /> : <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data) return <div className="skeleton h-[30rem] w-full rounded-3xl" />;

  const { club, members, events, isMember, memberCount, chatId } = data;
  const busy = join.isPending || leave.isPending;
  const social = [
    { href: club.social?.facebook, label: "Facebook", Icon: FaFacebook },
    { href: club.social?.instagram, label: "Instagram", Icon: FaInstagram },
    { href: club.social?.x, label: "X", Icon: FaXTwitter },
  ].filter((s) => s.href);

  return (
    <div className="grid gap-8">
      <PageHeader back={{ href: "/clubs", label: "All clubs" }} title={club.name} sub={club.tagline} />

      <section className="surface overflow-hidden">
        <Photo src={club.image} alt={club.name} ratio="aspect-[21/9] min-h-56 w-full" priority>
          <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <span className="absolute bottom-4 left-5 flex flex-wrap gap-2">
            <Pill tone={catTone(club.category)} glass>
              {club.category}
            </Pill>
            <Pill tone="secondary">Since {club.founded}</Pill>
          </span>
        </Photo>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:px-8">
          <p className="inline-flex items-center gap-2 text-lg font-semibold">
            <Users className="size-5 text-primary" /> {plural(memberCount, "member")}
          </p>
          <div className="flex flex-wrap gap-3">
            {isMember && chatId && (
              <Link href={`/messages?c=${chatId}`} className="btn btn-outline">
                <MessagesSquare className="size-4" /> Club chat
              </Link>
            )}
            {isMember ? (
              <button type="button" className="btn btn-outline btn-error" disabled={busy} onClick={() => leave.mutate()}>
                {leave.isPending && <span className="loading loading-spinner loading-sm" />} Leave club
              </button>
            ) : (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => join.mutate()}>
                {join.isPending && <span className="loading loading-spinner loading-sm" />} Join this club
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-6">
          <Reveal>
            <section className="surface p-6 sm:p-8">
              <h2 className="h-section text-xl">About the club</h2>
              <div className="mt-4 grid gap-4 text-lg leading-relaxed text-base-content/85">
                {club.description.split(/\n{1,}/).filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {club.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {club.tags.map((t) => (
                    <li key={t} className="rounded-full border border-base-content/15 px-3 py-1 text-sm">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>

          {club.achievements.length > 0 && (
            <Reveal>
              <section className="surface p-6 sm:p-8">
                <h2 className="h-section flex items-center gap-2 text-xl">
                  <Award className="size-5 text-secondary" /> Highlights
                </h2>
                <ul className="mt-4 grid gap-3">
                  {club.achievements.map((a) => (
                    <li key={a} className="flex gap-3">
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-secondary" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          <Reveal>
            <section className="surface p-6 sm:p-8">
              <h2 className="h-section text-xl">Upcoming events</h2>
              {events.length === 0 ? (
                <p className="mt-4 text-base-content/65">No events are planned yet. Join the club to hear first.</p>
              ) : (
                <ul className="mt-5 grid gap-4">
                  {events.map((e) => (
                    <li key={e.id}>
                      <Link href={`/events/${e.id}`} className="group flex items-center gap-4">
                        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-secondary/25 text-center leading-none">
                          <span>
                            <span className="block text-xl font-extrabold">{dayNum(e.startAt)}</span>
                            <span className="block text-xs font-semibold">{monthOf(e.startAt)}</span>
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold transition-colors group-hover:text-primary">{e.title}</span>
                          <span className="text-sm text-base-content/60">
                            {fmtDate(e.startAt)}, {fmtTime(e.startAt)} · {e.venue}
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
            <section className="surface p-6">
              <h2 className="h-section text-xl">Club details</h2>
              <ul className="mt-4 grid gap-4 text-[0.95rem]">
                <li className="flex gap-3">
                  <UserRound className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm text-base-content/55">President</span>
                    {club.president}
                  </span>
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm text-base-content/55">Faculty advisor</span>
                    {club.advisor}
                  </span>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm text-base-content/55">Meets</span>
                    {club.meets}
                  </span>
                </li>
                <li className="flex gap-3">
                  <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block text-sm text-base-content/55">Contact</span>
                    <a href={`mailto:${club.email}`} className="break-all font-semibold text-primary hover:underline">
                      {club.email}
                    </a>
                  </span>
                </li>
              </ul>
              {social.length > 0 && (
                <div className="mt-5 flex gap-2 border-t border-base-content/10 pt-5">
                  {social.map(({ href, label, Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${club.name} on ${label}`} className="btn btn-circle btn-outline btn-sm">
                      <Icon className="size-4" />
                    </a>
                  ))}
                </div>
              )}
            </section>
          </Reveal>

          <Reveal>
            <section className="surface p-6">
              <h2 className="h-section flex items-center gap-2 text-xl">
                <Users className="size-5 text-primary" /> Members
              </h2>
              {members.length === 0 ? (
                <p className="mt-4 text-base-content/65">Be the first to join.</p>
              ) : (
                <Stagger className="mt-4 grid gap-3" gap={0.04}>
                  {members.slice(0, 12).map((m) => (
                    <StaggerItem key={m.id}>
                      <Link href={`/students/${m.id}`} className="group flex items-center gap-3">
                        <Avatar name={m.name} src={m.image} size={40} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold transition-colors group-hover:text-primary">{m.name}</span>
                          <span className="block truncate text-sm text-base-content/55">{m.department}</span>
                        </span>
                        <Pill tone={roleTone(m.role)}>{m.role}</Pill>
                      </Link>
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
              {memberCount > 12 && <p className="mt-4 text-sm text-base-content/60">and {memberCount - 12} more members</p>}
            </section>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
