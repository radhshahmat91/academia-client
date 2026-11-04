import { Eye, HeartHandshake, Layers, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/home/sections";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { Photo, ShaplaPattern } from "@/components/ui/photo";
import { photo } from "@/lib/media";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "About" };

const PRINCIPLES = [
  { icon: Layers, title: "Everything in one place", text: "Learning, money, travel and campus life used to live in five different systems. Here they share one login, one inbox and one dashboard." },
  { icon: Eye, title: "Calm and clear", text: "Plain language, honest error messages and screens that show what matters first. If a step needs your attention, the site says so before you ask." },
  { icon: ShieldCheck, title: "Fair and private", text: "Course evaluations are anonymous. Direct messages are visible only to the two people in them. Results unlock for everyone on the same rule." },
  { icon: HeartHandshake, title: "Built around students", text: "Mobile first, dark mode for late nights, and a Bangla touch where it belongs. The people who use it every day set the priorities." },
];

const TOOLS = ["Next.js", "React", "Express", "MongoDB", "Socket.io", "BetterAuth", "TypeScript", "Framer Motion"];

export default async function AboutPage() {
  const signedIn = !!(await getSessionUser());
  return (
    <>
      <section className="hero-glow relative overflow-hidden">
        <ShaplaPattern className="text-primary/[0.045]" size={130} />
        <div className="wrap grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <Reveal>
            <p className="bangla text-3xl font-bold text-primary sm:text-4xl dark:text-secondary">আমাদের গল্প</p>
            <h1 className="display mt-3 text-5xl sm:text-6xl">A university should feel like one place.</h1>
            <p className="mt-6 max-w-xl text-xl text-base-content/75">AcademiaConnect brings courses, registration, results, fees, transport and campus life into a single, friendly site, so students spend their time learning instead of finding the right counter.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="btn btn-primary btn-lg">
                See the courses
              </Link>
              <Link href="/contact" className="btn btn-outline btn-lg border-base-content/25">
                Talk to us
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.15} x={30} y={0}>
            <Photo src={photo("campus-building", 1100)} alt="The main academic building on campus" ratio="aspect-[4/3]" className="rounded-[2rem] shadow-2xl ring-4 ring-base-100" priority />
          </Reveal>
        </div>
      </section>

      <section className="wrap py-16 sm:py-24">
        <Reveal>
          <h2 className="h-section matra max-w-2xl text-3xl sm:text-4xl">What we believe</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <StaggerItem key={p.title} className="h-full">
              <div className="surface flex h-full gap-5 p-7">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <p.icon className="size-7" />
                </span>
                <div>
                  <h3 className="text-xl font-bold">{p.title}</h3>
                  <p className="mt-2 text-base-content/70">{p.text}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="bg-base-100">
        <div className="wrap grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <h2 className="h-section matra text-3xl sm:text-4xl">What a student can do here</h2>
            <ul className="mt-8 grid gap-4 text-lg">
              {[
                "Study from video lectures and notes, and track which lectures are done",
                "Register for the next semester and pay fees in installments",
                "Evaluate courses anonymously, then see grades and CGPA by semester",
                "Message classmates, course groups and clubs in real time",
                "Join clubs, reserve seats at events and read university notices",
                "Buy a transport pass and show its QR code on the bus",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2.5 size-2 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} x={30} y={0}>
            <div className="grid grid-cols-2 gap-4">
              <Photo src={photo("campus-lab", 700)} alt="A teaching laboratory" ratio="aspect-[4/5]" className="rounded-3xl" />
              <Photo src={photo("campus-lecture-hall", 700)} alt="A full lecture hall" ratio="aspect-[4/5]" className="mt-10 rounded-3xl" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="wrap py-16 text-center sm:py-24">
        <Reveal>
          <h2 className="h-section matra matra-center mx-auto max-w-xl text-3xl sm:text-4xl">Built with tools we trust</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-base-content/70">A Next.js front end, an Express and MongoDB back end, Socket.io for live chat and BetterAuth for sign in.</p>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {TOOLS.map((t) => (
              <li key={t} className="surface px-5 py-2.5 font-semibold">
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
      <CtaBand signedIn={signedIn} />
    </>
  );
}
