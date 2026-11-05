"use client";

import { ExternalLink, Pin } from "lucide-react";
import Link from "next/link";
import { CrudPage, type Column } from "@/components/admin/crud";
import type { FieldDef } from "@/components/admin/form";
import { Pill, type Tone } from "@/components/ui/kit";
import { fmtDate } from "@/lib/utils";

type Row = { id: string; title: string; category?: string; priority: "normal" | "important" | "urgent"; pinned?: boolean; publishedAt: string };

const CATEGORIES = ["Academic", "Admission", "Exam", "Finance", "General", "Scholarship", "Transport"].map((c) => ({ value: c, label: c }));
const PRIORITY: Record<Row["priority"], Tone> = { normal: "info", important: "warning", urgent: "error" };

const fields: FieldDef[] = [
  { type: "text", key: "title", label: "Headline", required: true, span: 2 },
  { type: "textarea", key: "body", label: "Notice text", required: true, rows: 7 },
  { type: "select", key: "category", label: "Category", required: true, options: CATEGORIES },
  {
    type: "select",
    key: "priority",
    label: "Priority",
    required: true,
    hint: "Urgent notices are highlighted for students",
    options: [
      { value: "normal", label: "Normal" },
      { value: "important", label: "Important" },
      { value: "urgent", label: "Urgent" },
    ],
  },
  { type: "datetime", key: "publishedAt", label: "Published on", required: true },
  { type: "text", key: "author", label: "Issued by", placeholder: "Office of the Registrar" },
  { type: "checkbox", key: "pinned", label: "Pin to the top", hint: "Pinned notices stay first on the notice board" },
  { type: "heading", label: "Attachments", hint: "Links to forms, circulars or schedules." },
  {
    type: "list",
    key: "attachments",
    label: "Attachments",
    itemLabel: "Attachment",
    addLabel: "Add an attachment",
    item: [
      { type: "text", key: "label", label: "Name", required: true, placeholder: "Exam routine (PDF)" },
      { type: "url", key: "url", label: "Link", required: true },
    ],
  },
];

const columns: Column<Row>[] = [
  {
    header: "Notice",
    cell: (r) => (
      <span className="flex max-w-[26rem] items-center gap-2 font-bold">
        {r.pinned && <Pin className="size-4 shrink-0 text-secondary" aria-label="Pinned" />}
        <span className="truncate">{r.title}</span>
      </span>
    ),
  },
  { header: "Category", hide: "sm", cell: (r) => (r.category ? <Pill tone="primary">{r.category}</Pill> : null) },
  { header: "Priority", hide: "md", cell: (r) => <Pill tone={PRIORITY[r.priority]}>{r.priority[0]!.toUpperCase() + r.priority.slice(1)}</Pill> },
  { header: "Published", cell: (r) => <span className="text-sm whitespace-nowrap">{fmtDate(r.publishedAt)}</span> },
];

export default function AdminNotices() {
  return (
    <CrudPage<Row>
      title="Notices"
      sub="Publish university-wide notices. Every student is notified when a new one goes out."
      path="notices"
      noun="notice"
      label={(r) => r.title}
      columns={columns}
      fields={fields}
      searchPlaceholder="Search by headline or category"
      refresh={["/notices", "/dashboard", "/home", "/notifications"]}
      defaults={{ priority: "normal", category: "General", author: "Office of the Registrar", publishedAt: new Date().toISOString() }}
      rowExtra={(r) => (
        <Link href={`/notices/${r.id}`} className="btn btn-ghost btn-sm btn-square max-sm:hidden" aria-label={`Open ${r.title} on the site`} title="View on the site">
          <ExternalLink className="size-4" />
        </Link>
      )}
    />
  );
}
