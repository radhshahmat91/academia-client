import type { Metadata, Viewport } from "next";
import "@fontsource-variable/anek-latin/wdth.css";
import "@fontsource-variable/anek-bangla/wdth.css";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "AcademiaConnect: your whole university in one place", template: "%s · AcademiaConnect" },
  description: "Courses with video lectures and notes, clubs, events, notices, real-time messaging, semester registration, course evaluation and fee payment for university students.",
  applicationName: "AcademiaConnect",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1411" },
  ],
};

// Runs before first paint so there is no flash of the wrong theme
const themeScript = `(function(){try{var t=localStorage.getItem('ac-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'shapla-night':'shapla'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','shapla')}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Browser extensions (popup blockers, translators, Grammarly and the like) add their own tags and attributes to <html>,
    // <head> and <body> before React starts. suppressHydrationWarning keeps React from reporting those as errors.
    // data-scroll-behavior tells Next that the smooth scrolling in globals.css is intended (it pauses it during route changes).
    <html lang="en" data-theme="shapla" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
