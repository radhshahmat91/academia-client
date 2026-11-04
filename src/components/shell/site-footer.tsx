import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shell/brand";
import { ShaplaPattern } from "@/components/ui/photo";

const cols = [
  {
    title: "Explore",
    links: [
      ["Courses", "/courses"],
      ["Clubs", "/clubs"],
      ["Events", "/events"],
      ["Notices", "/notices"],
    ],
  },
  {
    title: "Student services",
    links: [
      ["Semester registration", "/registration"],
      ["Course evaluation", "/evaluation"],
      ["Fees and payments", "/fees"],
      ["Transport", "/transport"],
      ["Messages", "/messages"],
    ],
  },
  {
    title: "AcademiaConnect",
    links: [
      ["About us", "/about"],
      ["Contact", "/contact"],
      ["Log in", "/login"],
      ["Create account", "/register"],
    ],
  },
];

const socials = [
  { icon: FaXTwitter, label: "X", href: "https://x.com" },
  { icon: FaFacebookF, label: "Facebook", href: "https://facebook.com" },
  { icon: FaLinkedinIn, label: "LinkedIn", href: "https://linkedin.com" },
  { icon: FaInstagram, label: "Instagram", href: "https://instagram.com" },
  { icon: FaYoutube, label: "YouTube", href: "https://youtube.com" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-neutral text-neutral-content">
      <ShaplaPattern className="text-white/[0.06]" size={120} />
      <div className="wrap relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo className="[&_span]:text-neutral-content [&_span.text-primary]:text-secondary" />
          <p className="bangla mt-5 text-xl font-semibold text-secondary">সবকিছু এক জায়গায়</p>
          <p className="mt-2 text-neutral-content/75">Courses, clubs, events, messages, registration and fees for every student, in one calm place.</p>
          <ul className="mt-6 flex gap-2.5">
            {socials.map(({ icon: Icon, label, href }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full border border-white/15 transition-all hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-secondary-content">
                  <Icon className="size-[1.05rem]" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="font-bold text-white">{c.title}</h2>
            <ul className="mt-4 grid gap-2.5">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-neutral-content/75 transition-colors hover:text-secondary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="relative border-t border-white/10">
        <div className="wrap flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-6 text-sm text-neutral-content/70">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li className="inline-flex items-center gap-2">
              <MapPin className="size-4" /> Help desk, Dhaka, Bangladesh
            </li>
            <li className="inline-flex items-center gap-2">
              <Mail className="size-4" /> help@academiaconnect.test
            </li>
            <li className="inline-flex items-center gap-2">
              <Phone className="size-4" /> +880 2 5555 0100
            </li>
          </ul>
          <p>© {new Date().getFullYear()} AcademiaConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
