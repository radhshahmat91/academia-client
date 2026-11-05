"use client";

import type { Column } from "@/components/admin/table";
import { ListView } from "@/components/admin/table";
import { PageHeader, Pill, type Tone } from "@/components/ui/kit";
import { busLabel, fmtDate, pretty } from "@/lib/utils";

type Pass = {
  id: string;
  passNo?: string;
  status: "pending" | "active" | "cancelled" | "expired";
  stop?: string;
  validFrom?: string;
  validTo?: string;
  studentName: string;
  studentCode: string;
  route?: { name: string; busNo?: string } | null;
  semester?: { name: string } | null;
  invoice?: { number: string; status: string; total: number; paid: number } | null;
};

const TONE: Record<Pass["status"], Tone> = { active: "success", pending: "warning", cancelled: "error", expired: "info" };

const columns: Column<Pass>[] = [
  {
    header: "Student",
    cell: (r) => (
      <div>
        <p className="font-bold">{r.studentName}</p>
        <p className="text-sm text-base-content/60">{r.studentCode}</p>
      </div>
    ),
  },
  {
    header: "Route",
    cell: (r) => (
      <div>
        <p className="font-semibold">{r.route?.name ?? "Removed route"}</p>
        <p className="text-sm text-base-content/60">{r.route?.busNo ? busLabel(r.route.busNo) : ""}</p>
      </div>
    ),
  },
  { header: "Stop", hide: "md", cell: (r) => <span className="text-sm">{r.stop}</span> },
  { header: "Semester", hide: "lg", cell: (r) => <span className="text-sm whitespace-nowrap">{r.semester?.name}</span> },
  { header: "Pass no.", hide: "sm", cell: (r) => <span className="text-sm">{r.passNo ?? "Issued after payment"}</span> },
  { header: "Valid until", hide: "xl", cell: (r) => <span className="text-sm whitespace-nowrap">{fmtDate(r.validTo)}</span> },
  { header: "Fee", hide: "md", cell: (r) => (r.invoice ? <Pill tone={r.invoice.status === "paid" ? "success" : "warning"}>{pretty(r.invoice.status)}</Pill> : null) },
  { header: "Status", cell: (r) => <Pill tone={TONE[r.status]}>{pretty(r.status)}</Pill> },
];

export default function AdminPasses() {
  return (
    <>
      <PageHeader title="Bus passes" sub="Every pass students have asked for. A pass becomes active as soon as its fee is paid in full." />
      <ListView<Pass>
        path="/admin/passes"
        noun="passes"
        columns={columns}
        filters={[{ key: "status", label: "Status", all: "Any status", options: ["pending", "active", "cancelled", "expired"].map((v) => ({ value: v, label: pretty(v) })) }]}
      />
    </>
  );
}
