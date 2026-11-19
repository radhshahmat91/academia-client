"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, MessagesSquare, PlayCircle } from "lucide-react";
import Link from "next/link";
import { CountUp } from "@/components/ui/motion";
import { Photo, ShaplaPattern } from "@/components/ui/photo";
import { useGet } from "@/hooks/use-api";
import { photo } from "@/lib/media";

type Stats = { students: number; courses: number; lectures: number; clubs: number; upcomingEvents: number; notices: number };
const ease = [0.2, 0.7, 0.2, 1] as const;
const HEADLINE = ["Your", "whole", "university", "in", "one", "place."];

function Chip({ icon: Icon, children, className, delay, tone }: { icon: typeof PlayCircle; children: React.ReactNode; className: string; delay: number; tone: string }) {
  return (
    <motion.div className={`absolute z-20 ${className}`} initial={{ opacity: 0, scale: 0.6, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay, type: "spring", stiffness: 260, damping: 16 }}>
      <div className="animate-float flex items-center gap-2.5 rounded-2xl border border-base-content/10 bg-base-100/95 px-4 py-2.5 text-sm font-bold shadow-xl backdrop-blur" style={{ animationDelay: `${delay}s` }}>
        <span className={`grid size-8 place-items-center rounded-xl ${tone}`}>
          <Icon className="size-4.5" />
        </span>
        {children}
      </div>
    </motion.div>
  );
}

function Collage() {
  return (
    <div className="relative mx-auto aspect-[5/4.4] w-full max-w-[34rem] lg:mx-0 lg:ml-auto">
      <motion.div className="absolute -top-4 right-2 size-40 rounded-full bg-secondary/90 sm:size-52" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 120, damping: 14 }} />
      <div className="absolute -bottom-6 -left-6 size-56 overflow-hidden rounded-full text-primary/30">
        <ShaplaPattern size={70} />
      </div>
      <motion.div className="absolute inset-y-[6%] right-0 w-[70%]" initial={{ opacity: 0, x: 60, rotate: 3 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ delay: 0.35, duration: 0.9, ease }}>
        <Photo src={photo("hero-students-campus", 900)} alt="Students walking across the campus lawn" ratio="h-full w-full" className="rounded-[2rem] shadow-2xl ring-4 ring-base-100" priority />
      </motion.div>
      <motion.div className="absolute top-[14%] left-0 w-[42%]" initial={{ opacity: 0, y: 50, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ delay: 0.55, duration: 0.9, ease }}>
        <Photo src={photo("hero-study-group", 600)} alt="A study group around a table" ratio="aspect-[4/5]" className="rounded-3xl shadow-xl ring-4 ring-base-100" priority />
      </motion.div>
      <motion.div className="absolute bottom-0 left-[16%] w-[38%]" initial={{ opacity: 0, y: 60, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 2 }} transition={{ delay: 0.75, duration: 0.9, ease }}>
        <Photo src={photo("campus-library", 600)} alt="The university library reading hall" ratio="aspect-[5/4]" className="rounded-3xl shadow-xl ring-4 ring-base-100" priority />
      </motion.div>
      <Chip icon={PlayCircle} delay={1.1} className="top-[2%] left-[22%]" tone="bg-primary/12 text-primary">
        Video lectures
      </Chip>
      <Chip icon={MessagesSquare} delay={1.3} className="top-[46%] -right-1 sm:-right-4" tone="bg-success/15 text-success">
        Live chat
      </Chip>
      <Chip icon={CalendarCheck} delay={1.5} className="right-[8%] bottom-[2%]" tone="bg-secondary/30 text-secondary-content dark:text-secondary">
        Registration open
      </Chip>
    </div>
  );
}

export function Hero({ signedIn }: { signedIn: boolean }) {
  const reduce = useReducedMotion();
  const { data } = useGet<Stats>("/public/stats", { auth: false, staleTime: 5 * 60_000 });
  const fade = (delay: number) => ({ initial: reduce ? false : { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.7, ease } });

  return (
    <section className="hero-glow relative isolate overflow-hidden">
      <ShaplaPattern className="text-primary/[0.045]" size={130} />
      <div className="wrap grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div>
          <motion.span className="mb-5 block h-[3px] w-full max-w-md origin-left rounded-full bg-gradient-to-r from-secondary from-[56px] to-base-content/15 to-[56px]" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease }} />
          <motion.p className="bangla text-3xl font-bold text-primary sm:text-4xl dark:text-secondary" initial={reduce ? false : { clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ delay: 0.15, duration: 0.9, ease }}>
          </motion.p>
          <h1 className="display mt-4 text-[2.9rem] sm:text-6xl xl:text-[4.6rem]" aria-label={HEADLINE.join(" ")}>
            {HEADLINE.map((w, i) => (
              <span key={i} className="mr-[0.22em] inline-block overflow-hidden pb-[0.07em] align-top leading-[1.02]" aria-hidden="true">
                <motion.span className={`inline-block ${w === "place." ? "text-primary" : ""}`} initial={reduce ? false : { y: "110%" }} animate={{ y: 0 }} transition={{ delay: 0.3 + i * 0.07, duration: 0.7, ease }}>
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p className="mt-6 max-w-xl text-lg text-base-content/75 sm:text-xl" {...fade(0.85)}>
            Courses with video lectures and notes, clubs, events, notices, real-time chat, semester registration and fee payment. Everything a student needs, without the queue.
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" {...fade(1)}>
            {signedIn ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Open my dashboard
              </Link>
            ) : (
              <Link href="/register" className="btn btn-primary btn-lg">
                Create your account
              </Link>
            )}
            <Link href="/courses" className="btn btn-outline btn-lg border-base-content/25">
              Browse courses
            </Link>
          </motion.div>
          <motion.dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-base-content/10 pt-6" {...fade(1.15)}>
            {[
              ["Students", data?.students],
              ["Courses", data?.courses],
              ["Video lectures", data?.lectures],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dd className="text-3xl font-extrabold tracking-tight">{typeof value === "number" ? <CountUp value={value} /> : <span className="skeleton inline-block h-8 w-14" />}</dd>
                <dt className="text-sm text-base-content/60">{label as string}</dt>
              </div>
            ))}
          </motion.dl>
        </div>
        <Collage />
      </div>
    </section>
  );
}
