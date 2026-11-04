import { Frame } from "@/components/shell/frame";
import { getSessionUser } from "@/lib/session";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return <Frame user={user}>{children}</Frame>;
}
