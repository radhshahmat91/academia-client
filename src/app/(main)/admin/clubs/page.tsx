"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { CrudPage, type Column } from "@/components/admin/crud";
import type { FieldDef } from "@/components/admin/form";
import { Pill } from "@/components/ui/kit";

type Row = { id: string; name: string; category?: string; tagline?: string; president?: string; founded?: number; meets?: string };

const fields: FieldDef[] = [
  { type: "text", key: "name", label: "Club name", required: true, span: 2 },
  { type: "text", key: "category", label: "Category", required: true, hint: "For example Technology, Sports or Culture" },
  { type: "text", key: "tagline", label: "One line tagline" },
  { type: "textarea", key: "description", label: "About the club", rows: 5 },
  { type: "url", key: "image", label: "Cover image link", span: 2 },
  { type: "text", key: "advisor", label: "Faculty advisor" },
  { type: "text", key: "president", label: "President" },
  { type: "number", key: "founded", label: "Year founded", min: 1950, max: new Date().getFullYear(), step: 1 },
  { type: "text", key: "meets", label: "When and where it meets", placeholder: "Thursdays, 4:00 pm, Lab 204" },
  { type: "email", key: "email", label: "Contact email" },
  { type: "tags", key: "tags", label: "Tags" },
  { type: "lines", key: "achievements", label: "Achievements", placeholder: "One achievement per line" },
  { type: "heading", label: "Social links" },
  { type: "url", key: "social.facebook", label: "Facebook" },
  { type: "url", key: "social.instagram", label: "Instagram" },
  { type: "url", key: "social.x", label: "X" },
];

const columns: Column<Row>[] = [
  {
    header: "Club",
    cell: (r) => (
      <div className="min-w-0">
        <p className="font-bold">{r.name}</p>
        <p className="max-w-[22rem] truncate text-sm text-base-content/65">{r.tagline}</p>
      </div>
    ),
  },
  { header: "Category", hide: "sm", cell: (r) => (r.category ? <Pill tone="secondary">{r.category}</Pill> : null) },
  { header: "President", hide: "md", cell: (r) => <span className="text-sm">{r.president}</span> },
  { header: "Founded", hide: "lg", cell: (r) => r.founded },
  { header: "Meets", hide: "xl", cell: (r) => <span className="text-sm text-base-content/70">{r.meets}</span> },
];

export default function AdminClubs() {
  return (
    <CrudPage<Row>
      title="Clubs"
      sub="Create clubs and keep their details, leaders and social links up to date."
      path="clubs"
      noun="club"
      label={(r) => r.name}
      columns={columns}
      fields={fields}
      searchPlaceholder="Search by name or category"
      refresh={["/clubs", "/dashboard", "/home"]}
      rowExtra={(r) => (
        <Link href={`/clubs/${r.id}`} className="btn btn-ghost btn-sm btn-square max-sm:hidden" aria-label={`Open ${r.name} on the site`} title="View on the site">
          <ExternalLink className="size-4" />
        </Link>
      )}
    />
  );
}
