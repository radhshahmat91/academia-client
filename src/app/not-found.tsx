import Link from "next/link";
import { Logo } from "@/components/shell/brand";
import { ShaplaPattern } from "@/components/ui/photo";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6 text-center">
      <ShaplaPattern className="text-primary/[0.05]" size={130} />
      <div className="relative grid justify-items-center gap-5">
        <Logo />
        <p className="bangla text-6xl font-extrabold text-secondary sm:text-8xl">৪০৪</p>
        <h1 className="h-section text-3xl sm:text-4xl">We could not find that page</h1>
        <p className="max-w-md text-lg text-base-content/70">The link may be old, or the page may have moved. Head back home and try again.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Go to the home page
          </Link>
          <Link href="/dashboard" className="btn btn-outline">
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
