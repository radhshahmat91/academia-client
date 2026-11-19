import { CalendarCheck, MessagesSquare, Video } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo, ThemeToggle } from "@/components/shell/brand";
import { Photo, ShaplaPattern } from "@/components/ui/photo";
import { photo } from "@/lib/media";
import { getSessionUser } from "@/lib/session";
import { safeNext } from "@/lib/utils";

const points = [
  { icon: Video, text: "Video lectures and notes for every course" },
  { icon: MessagesSquare, text: "Real-time chat with classmates and clubs" },
  { icon: CalendarCheck, text: "Registration, evaluation and fees without queues" },
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // A signed-in student has no business on the login or register pages
  const user = await getSessionUser();
  if (user) {
    const url = new URL((await headers()).get("x-pathname") || "/", "http://local");
    if (url.pathname === "/login" || url.pathname === "/register") redirect(safeNext(url.searchParams.get("next")));
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-content lg:block">
        <Photo src={photo("hero-students-campus", 1400)} alt="Students on the campus lawn" ratio="absolute inset-0" className="opacity-40 mix-blend-luminosity" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/80 to-[#06382a]" />
        <ShaplaPattern className="text-white/[0.07]" size={110} />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo className="[&_span]:text-white [&_span.text-primary]:text-secondary" />
          <div>
            <p className="bangla text-5xl font-bold text-secondary">University Management System</p>
            <h2 className="display mt-4 max-w-md text-4xl text-white">Your whole university, one calm place.</h2>
            <ul className="mt-8 grid gap-4">
              {points.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-lg text-white/90">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/12 backdrop-blur">
                    <Icon className="size-5 text-secondary" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/60">© {new Date().getFullYear()} AcademiaConnect</p>
        </div>
      </aside>
      <div className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Logo className="lg:invisible" />
          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-ghost btn-sm">
              Back to home
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <main className="grid flex-1 place-items-center px-4 pb-12 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
