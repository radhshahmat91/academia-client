import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/nav";
import { EmptyState } from "@/components/ui/kit";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Admin panel" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (user?.role !== "admin") {
    return (
      <EmptyState
        icon={<ShieldAlert className="size-7" />}
        title="This area is for administrators"
        body="Your account does not have admin access. If you think it should, ask the university IT office."
        action={
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            Back to my dashboard
          </Link>
        }
      />
    );
  }
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
