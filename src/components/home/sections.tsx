"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Bus, CalendarDays, ClipboardList, GraduationCap, MessagesSquare, Megaphone, PlayCircle, Star, Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CardGridSkeleton, SectionTitle } from "@/components/ui/kit";
import { ClubCard, CourseCard, EventCard, NoticeRow } from "@/components/cards";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { Photo, ShaplaPattern } from "@/components/ui/photo";
import { useGet } from "@/hooks/use-api";
import type { ClubCard as Club, CourseCard as Course, EventCard as EventT, Notice, Paged } from "@/lib/types";
import { photo } from "@/lib/media";
import { cn } from "@/lib/utils";

const wrap = "wrap py-16 sm:py-20";

/* ------------------------------------------------------------------ what you get */
const FEATURES = [
  { icon: PlayCircle, title: "Courses with video lectures", text: "Watch lectures, read notes and tick off what you have finished, all inside the course page.", href: "/courses" },
  { icon: ClipboardList, title: "Semester registration", text: "Pick sections with seat counts, clashes and prerequisites checked before you confirm.", href: "/registration" },
  { icon: Wallet, title: "Fees in installments", text: "Pay tuition in three parts, see what is due, and keep a receipt for every payment.", href: "/fees" },
  { icon: Bus, title: "Transport pass", text: "Choose a route and stop, pay once, and show a QR pass at the bus door.", href: "/transport" },
  { icon: MessagesSquare, title: "Real-time messaging", text: "Chat one to one or in course and club groups, with typing and read status.", href: "/messages" },
  { icon: CalendarDays, title: "Clubs and events", text: "Join clubs, reserve a seat at events and get a ticket number in a tap.", href: "/events" },
  { icon: Megaphone, title: "Notices that find you", text: "University-wide notices with priorities, and a bell that rings the moment one lands.", href: "/notices" },
  { icon: GraduationCap, title: "Evaluation and results", text: "Evaluate courses anonymously, then see grades and CGPA semester by semester.", href: "/my-courses" },
];

export function Features() {
  return (
    <section className={wrap}>
      <Reveal>
        <SectionTitle title="Everything a semester asks of you" sub="One account covers learning, money, travel and campus life." />
      </Reveal>
      <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <StaggerItem key={f.title} className="h-full">
            <Link href={f.href} className="surface card-lift group flex h-full flex-col gap-4 p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:rotate-[-6deg] group-hover:bg-primary group-hover:text-primary-content">
                <f.icon className="size-6" />
              </span>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="text-[0.95rem] text-base-content/70">{f.text}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary">
                Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ------------------------------------------------------------------ the semester loop */
const STEPS = [
  { icon: ClipboardList, title: "Register", text: "Choose your sections when registration opens and get your fee invoice instantly." },
  { icon: PlayCircle, title: "Learn", text: "Lectures, notes and course groups are ready the moment you are enrolled." },
  { icon: Star, title: "Evaluate", text: "Rate each course anonymously when the semester closes. It takes about five minutes." },
  { icon: BadgeCheck, title: "See results", text: "Grades unlock after your evaluations, with GPA and CGPA worked out for you." },
];

export function Flow() {
  return (
    <section className="relative overflow-hidden bg-base-100">
      <ShaplaPattern className="text-primary/[0.04]" size={120} />
      <div className={cn(wrap, "relative")}>
        <Reveal>
          <SectionTitle title="How a semester flows" sub="Four steps, and the site walks you through each one." />
        </Reveal>
        <div className="relative mt-14">
          <motion.div className="absolute top-7 right-[12%] left-[12%] hidden h-[3px] origin-left rounded-full bg-gradient-to-r from-secondary to-primary lg:block" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: "-20%" }} transition={{ duration: 1.4, ease: "easeInOut" }} />
          <Stagger className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4" gap={0.18}>
            {STEPS.map((s, i) => (
              <StaggerItem key={s.title} className="text-center">
                <span className="relative mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-content shadow-lg shadow-primary/25 ring-8 ring-base-100">
                  <s.icon className="size-6" />
                  <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-secondary text-xs font-extrabold text-secondary-content">{i + 1}</span>
                </span>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[16rem] text-base-content/70">{s.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ live data sections */
export function FeaturedCourses() {
  const { data, isLoading } = useGet<Paged<Course>>("/courses?sort=featured&limit=6", { auth: false });
  return (
    <section className={wrap}>
      <Reveal>
        <SectionTitle
          title="Courses to start with"
          sub="Every course has video lectures, notes and a group chat for the class."
          action={
            <Link href="/courses" className="btn btn-outline btn-sm">
              All courses <ArrowRight className="size-4" />
            </Link>
          }
        />
      </Reveal>
      <div className="mt-10">
        {isLoading || !data ? (
          <CardGridSkeleton n={6} />
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((c) => (
              <StaggerItem key={c.id} className="h-full">
                <CourseCard c={c} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}

const CHAT = [
  { me: false, who: "Nusrat", text: "Anyone free tonight to go over search algorithms before the quiz?" },
  { me: true, text: "Yes! I can do 9 pm. Should we use the course group call?" },
  { me: false, who: "Arif", text: "Count me in. I found a great video in the Lectures tab." },
  { me: true, text: "Perfect, see you both at 9." },
];

export function ChatShowcase() {
  return (
    <section className="overflow-x-clip bg-neutral text-neutral-content">
      <div className="wrap grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-2">
        <Reveal x={-30} y={0}>
          <h2 className="h-section matra text-3xl text-white sm:text-4xl">Study groups that already exist</h2>
          <p className="mt-4 max-w-lg text-lg text-neutral-content/80">Every course and every club gets its own group chat the moment you join. Message classmates directly, see who is online, and know when your message has been read.</p>
          <ul className="mt-7 grid gap-3 text-neutral-content/90">
            {["Direct messages and group chats in one inbox", "Typing indicators, read status and online dots", "Instant notifications when something new arrives"].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 size-5 shrink-0 text-secondary" /> {t}
              </li>
            ))}
          </ul>
          <Link href="/messages" className="btn btn-secondary mt-8">
            Open messages
          </Link>
        </Reveal>
        <Reveal x={30} y={0}>
          <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-base-100 p-5 text-base-content shadow-2xl">
            <div className="flex items-center gap-3 border-b border-base-content/10 pb-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-content">AI</span>
              <div>
                <p className="font-bold">CSE 3201 Artificial Intelligence</p>
                <p className="flex items-center gap-1.5 text-sm text-success">
                  <span className="size-2 rounded-full bg-success" /> 3 online
                </p>
              </div>
            </div>
            <div className="grid gap-3 py-5">
              {CHAT.map((m, i) => (
                <motion.div key={i} className={cn("max-w-[85%]", m.me ? "justify-self-end" : "justify-self-start")} initial={{ opacity: 0, y: 14, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.7, type: "spring", stiffness: 300, damping: 22 }}>
                  {!m.me && <p className="mb-0.5 ml-3 text-xs font-semibold text-base-content/55">{m.who}</p>}
                  <p className={cn("rounded-2xl px-4 py-2.5 text-[0.95rem]", m.me ? "rounded-br-md bg-primary text-primary-content" : "rounded-bl-md bg-base-200")}>{m.text}</p>
                </motion.div>
              ))}
              <motion.div className="flex w-16 justify-center gap-1 rounded-2xl rounded-bl-md bg-base-200 py-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 3.4 }} aria-hidden="true">
                {[0, 1, 2].map((d) => (
                  <motion.span key={d} className="size-2 rounded-full bg-base-content/40" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: d * 0.15 }} />
                ))}
              </motion.div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function UpcomingEvents() {
  const { data, isLoading } = useGet<Paged<EventT>>("/events?limit=3", { auth: false });
  return (
    <section className={wrap}>
      <Reveal>
        <SectionTitle
          title="Coming up on campus"
          sub="Lectures, workshops, competitions and festivals you can reserve a seat for."
          action={
            <Link href="/events" className="btn btn-outline btn-sm">
              All events <ArrowRight className="size-4" />
            </Link>
          }
        />
      </Reveal>
      <div className="mt-10">
        {isLoading || !data ? (
          <CardGridSkeleton n={3} />
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((e) => (
              <StaggerItem key={e.id} className="h-full">
                <EventCard e={e} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}

export function LatestNotices() {
  const { data, isLoading } = useGet<Paged<Notice>>("/notices?limit=4", { auth: false });
  return (
    <section className="bg-base-100">
      <div className={cn(wrap, "grid gap-12 lg:grid-cols-[1fr_1.5fr]")}>
        <Reveal>
          <SectionTitle title="University notices" sub="Deadlines, exam schedules and announcements from the offices that matter, in one feed." />
          <Link href="/notices" className="btn btn-primary mt-8">
            Read all notices
          </Link>
        </Reveal>
        <div className="grid content-start gap-4">
          {isLoading || !data ? (
            Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
          ) : (
            <Stagger className="grid gap-4" gap={0.09}>
              {data.items.map((n) => (
                <StaggerItem key={n.id}>
                  <NoticeRow n={n} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </section>
  );
}

export function ClubsMarquee() {
  const { data } = useGet<{ items: Club[] }>("/clubs", { auth: false });
  const items = data?.items ?? [];
  const row = [...items, ...items];
  return (
    <section className="overflow-hidden py-16 sm:py-20">
      <div className="wrap">
        <Reveal>
          <SectionTitle
            title="Find your people"
            sub="From robotics to debate to football, there is a club for most evenings."
            action={
              <Link href="/clubs" className="btn btn-outline btn-sm">
                All clubs <ArrowRight className="size-4" />
              </Link>
            }
          />
        </Reveal>
      </div>
      <div className="mt-10 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        {items.length === 0 ? (
          <div className="wrap">
            <div className="skeleton h-24 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="animate-drift flex w-max gap-4 hover:[animation-play-state:paused]">
            {row.map((c, i) => (
              <Link key={`${c.id}-${i}`} href={`/clubs/${c.id}`} className="surface card-lift flex w-72 shrink-0 items-center gap-4 p-3 pr-5" aria-hidden={i >= items.length || undefined} tabIndex={i >= items.length ? -1 : undefined}>
                <Photo src={c.image} alt={c.name} ratio="size-16" className="shrink-0 rounded-2xl" />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{c.name}</span>
                  <span className="block truncate text-sm text-base-content/60">
                    {c.category} · {c.members} members
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ questions and final call */
const FAQ = [
  ["Who can use AcademiaConnect?", "Any student can create an account with an email address or a Google account. Administrator access is given by the registrar's office."],
  ["How does semester registration work?", "When registration opens, pick sections within the credit limits. Time clashes, full sections and missing prerequisites are flagged before you confirm, and your fee invoice is created straight away."],
  ["How are fees paid?", "Each invoice is split into three installments. You can pay the next installment or the whole balance with bKash, Nagad, Rocket, a bank card or a bank transfer. This demo runs on a sandbox gateway, so no real money moves, and every payment produces a printable receipt."],
  ["Why are my results hidden?", "When a semester ends, results unlock once you have evaluated every course you took in it. Evaluations are anonymous, so instructors never see who wrote what."],
  ["Who can read my messages?", "Direct messages are visible only to the two people in them. Course and club groups are visible to their members."],
];

export function Faq() {
  return (
    <section className={cn(wrap, "grid gap-12 lg:grid-cols-[1fr_1.4fr]")}>
      <Reveal>
        <SectionTitle title="Questions students ask" sub="Short answers about the parts people ask about most." />
      </Reveal>
      <Reveal delay={0.1}>
        <div className="grid gap-3">
          {FAQ.map(([q, a], i) => (
            <div key={q} className="collapse collapse-plus surface">
              <input type="radio" name="faq" defaultChecked={i === 0} aria-label={q} />
              <div className="collapse-title pr-12 text-lg font-bold">{q}</div>
              <div className="collapse-content text-base-content/75">
                <p className="pb-2">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export function CtaBand({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="wrap pb-4">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-content sm:px-12 sm:py-20">
          <Photo src={photo("hero-graduation", 1400)} alt="Graduates celebrating" ratio="absolute inset-0" className="-z-20 opacity-25 mix-blend-luminosity" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary/90 to-[#06382a]" />
          <ShaplaPattern className="-z-10 text-white/[0.07]" size={110} />
          <p className="bangla text-2xl font-bold text-secondary sm:text-3xl">সবকিছু এক জায়গায়</p>
          <h2 className="display mx-auto mt-3 max-w-2xl text-4xl text-white sm:text-5xl">{signedIn ? "Pick up where you left off." : "Ready to join your university online?"}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-content/85">{signedIn ? "Your courses, messages and fees are waiting on the dashboard." : "Create a free account in under a minute and register for your next semester."}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={signedIn ? "/dashboard" : "/register"} className="btn btn-secondary btn-lg">
              {signedIn ? "Go to dashboard" : "Create your account"}
            </Link>
            <Link href="/courses" className="btn btn-lg border-white/30 bg-transparent text-white hover:bg-white/10">
              Browse courses
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
