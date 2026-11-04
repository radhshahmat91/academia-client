import { ChatShowcase, ClubsMarquee, CtaBand, Faq, FeaturedCourses, Features, Flow, LatestNotices, UpcomingEvents } from "@/components/home/sections";
import { Hero } from "@/components/home/hero";
import { getSessionUser } from "@/lib/session";

export default async function HomePage() {
  const signedIn = !!(await getSessionUser());
  return (
    <>
      <Hero signedIn={signedIn} />
      <Features />
      <Flow />
      <FeaturedCourses />
      <ChatShowcase />
      <UpcomingEvents />
      <LatestNotices />
      <ClubsMarquee />
      <Faq />
      <CtaBand signedIn={signedIn} />
    </>
  );
}
