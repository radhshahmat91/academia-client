"use client";

import { BookOpen, IdCard, MessageCircle, Pencil, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FaFacebook, FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { useSocket } from "@/components/socket-provider";
import { Avatar, EmptyState, ErrorState, PageHeader, Pill } from "@/components/ui/kit";
import { Reveal } from "@/components/ui/motion";
import { Photo } from "@/components/ui/photo";
import { send, useAction, useGet } from "@/hooks/use-api";
import type { Conversation, Me } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

type Res = {
  user: Omit<Me, "email" | "phone" | "waiverPercent">;
  clubs: { id: string; name: string; image: string; category: string; role: string }[];
  courses: { id: string; code: string; title: string }[];
};

export default function StudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { online } = useSocket();
  const me = useGet<Me>("/me", { staleTime: 300_000 });
  const { data, isLoading, isError, error, refetch } = useGet<Res>(`/students/${id}`);
  const dm = useAction(() => send<Conversation>("POST", "/chat/direct", { userId: id }), { refresh: ["/chat/conversations"], onSuccess: (c) => router.push(`/messages?c=${c.id}`) });

  if (isError) return error?.status === 404 ? <EmptyState title="That student was not found" body="The profile may have been removed." action={<Link href="/students" className="btn btn-primary btn-sm">Back to students</Link>} /> : <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data) return <div className="skeleton h-80 w-full rounded-3xl" />;

  const { user: u, clubs, courses } = data;
  const mine = me.data?.id === u.id;
  const social = [
    { href: u.social?.facebook, label: "Facebook", Icon: FaFacebook },
    { href: u.social?.linkedin, label: "LinkedIn", Icon: FaLinkedin },
    { href: u.social?.github, label: "GitHub", Icon: FaGithub },
    { href: u.social?.x, label: "X", Icon: FaXTwitter },
  ].filter((s) => s.href);

  return (
    <div className="grid gap-7">
      <PageHeader back={{ href: "/students", label: "All students" }} title={u.name} sub={[u.department, u.batch ? `Batch ${u.batch}` : null].filter(Boolean).join(" · ")} />

      <Reveal>
        <section className="surface overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-primary to-primary/60 sm:h-36" />
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4 px-6 pb-6 sm:px-9">
            <div className="rounded-full border-4 border-base-100 bg-base-100">
              <Avatar name={u.name} src={u.image} size={112} online={mine ? undefined : online.has(u.id)} />
            </div>
            <div className="flex flex-wrap gap-3">
              {mine ? (
                <Link href="/profile" className="btn btn-primary">
                  <Pencil className="size-4" /> Edit my profile
                </Link>
              ) : (
                <button type="button" className="btn btn-primary" disabled={dm.isPending} onClick={() => dm.mutate()}>
                  <MessageCircle className="size-4" /> Send a message
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-5 px-6 pb-8 sm:px-9">
            <div className="flex flex-wrap items-center gap-2">
              {u.studentId && (
                <Pill tone="primary">
                  <IdCard className="size-3.5" /> ID {u.studentId}
                </Pill>
              )}
              {!mine && <Pill tone={online.has(u.id) ? "success" : "info"}>{online.has(u.id) ? "Online now" : "Offline"}</Pill>}
              {u.createdAt && <span className="text-sm text-base-content/55">Joined {fmtDate(u.createdAt)}</span>}
            </div>
            <p className="max-w-3xl text-lg leading-relaxed text-base-content/85">{u.bio || "This student has not written a bio yet."}</p>
            {(u.interests?.length ?? 0) > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Interests">
                {u.interests!.map((i) => (
                  <li key={i} className="rounded-full border border-base-content/15 px-3 py-1 text-sm">
                    {i}
                  </li>
                ))}
              </ul>
            )}
            {social.length > 0 && (
              <div className="flex gap-2">
                {social.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${u.name} on ${label}`} className="btn btn-circle btn-outline btn-sm">
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </Reveal>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Reveal>
          <section className="surface p-6">
            <h2 className="h-section flex items-center gap-2 text-xl">
              <Users className="size-5 text-primary" /> Clubs
            </h2>
            {clubs.length === 0 ? (
              <p className="mt-4 text-base-content/65">Not a member of any club yet.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {clubs.map((c) => (
                  <li key={c.id}>
                    <Link href={`/clubs/${c.id}`} className="group flex items-center gap-3">
                      <Photo src={c.image} alt={c.name} ratio="size-12" className="shrink-0 rounded-xl" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold transition-colors group-hover:text-primary">{c.name}</span>
                        <span className="text-sm text-base-content/60">{c.category}</span>
                      </span>
                      <Pill tone={/president|chair/i.test(c.role) ? "secondary" : "primary"}>{c.role}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Reveal>
        <Reveal>
          <section className="surface p-6">
            <h2 className="h-section flex items-center gap-2 text-xl">
              <BookOpen className="size-5 text-primary" /> Courses this semester
            </h2>
            {courses.length === 0 ? (
              <p className="mt-4 text-base-content/65">No courses this semester.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {courses.map((c) => (
                  <li key={c.id}>
                    <Link href={`/courses/${c.id}`} className="group flex items-center gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-extrabold text-primary">{c.code.split(" ")[0]}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold transition-colors group-hover:text-primary">{c.title}</span>
                        <span className="text-sm text-base-content/60">{c.code}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Reveal>
      </div>
    </div>
  );
}
