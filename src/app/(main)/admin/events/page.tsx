"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { CrudPage, type Column } from "@/components/admin/crud";
import type { FieldDef } from "@/components/admin/form";
import { Pill } from "@/components/ui/kit";
import { useGet } from "@/hooks/use-api";
import type { Paged } from "@/lib/types";
import { fmtDateTime } from "@/lib/utils";

type Row = { id: string; title: string; category?: string; venue?: string; startAt: string; endAt: string; capacity?: number; registered?: number; club?: { id: string; name: string } | null };

const CATEGORIES = ["Career", "Competition", "Cultural", "Orientation", "Seminar", "Service", "Sports", "Workshop"].map((c) => ({ value: c, label: c }));

const columns: Column<Row>[] = [
  {
    header: "Event",
    cell: (r) => (
      <div className="min-w-0">
        <p className="max-w-[22rem] truncate font-bold">{r.title}</p>
        <p className="text-sm text-base-content/65">{r.venue}</p>
      </div>
    ),
  },
  { header: "Starts", cell: (r) => <span className="text-sm whitespace-nowrap">{fmtDateTime(r.startAt)}</span> },
  { header: "Type", hide: "md", cell: (r) => (r.category ? <Pill tone="info">{r.category}</Pill> : null) },
  { header: "Club", hide: "lg", cell: (r) => <span className="text-sm">{r.club?.name ?? "University"}</span> },
  {
    header: "Seats",
    hide: "sm",
    cell: (r) => (
      <span className="text-sm whitespace-nowrap">
        {r.registered ?? 0} / {r.capacity ?? "–"}
      </span>
    ),
  },
];

export default function AdminEvents() {
  const clubs = useGet<Paged<{ id: string; name: string }>>("/admin/clubs?limit=100", { staleTime: 60_000 });
  const fields: FieldDef[] = [
    { type: "text", key: "title", label: "Event title", required: true, span: 2 },
    { type: "select", key: "category", label: "Type", required: true, options: CATEGORIES },
    { type: "select", key: "club", label: "Organised by", empty: "The university", options: (clubs.data?.items ?? []).map((c) => ({ value: c.id, label: c.name })) },
    { type: "textarea", key: "summary", label: "Short summary", rows: 2, required: true, hint: "Shown on the event card" },
    { type: "textarea", key: "description", label: "Full description", rows: 5 },
    { type: "url", key: "image", label: "Cover image link", span: 2 },
    { type: "text", key: "venue", label: "Venue", required: true },
    { type: "number", key: "capacity", label: "Seats", required: true, min: 1, step: 1 },
    { type: "datetime", key: "startAt", label: "Starts", required: true },
    { type: "datetime", key: "endAt", label: "Ends", required: true },
    { type: "tags", key: "tags", label: "Tags" },
    { type: "heading", label: "Agenda" },
    {
      type: "list",
      key: "agenda",
      label: "Agenda",
      itemLabel: "Slot",
      addLabel: "Add an agenda slot",
      cols: "grid-cols-[9rem_1fr]",
      item: [
        { type: "text", key: "time", label: "Time", required: true, placeholder: "3:00 pm" },
        { type: "text", key: "title", label: "What happens", required: true },
      ],
    },
    { type: "heading", label: "Speakers" },
    {
      type: "list",
      key: "speakers",
      label: "Speakers",
      itemLabel: "Speaker",
      addLabel: "Add a speaker",
      item: [
        { type: "text", key: "name", label: "Name", required: true },
        { type: "text", key: "title", label: "Role or organisation" },
      ],
    },
  ];

  return (
    <CrudPage<Row>
      title="Events"
      sub="Plan seminars, workshops and competitions and see how many seats are taken."
      path="events"
      noun="event"
      label={(r) => r.title}
      columns={columns}
      fields={fields}
      searchPlaceholder="Search by title, type or venue"
      refresh={["/events", "/dashboard", "/home", "/clubs"]}
      size="xl"
      defaults={{ capacity: 100, category: "Seminar" }}
      validate={(b): Record<string, string> => (b.startAt && b.endAt && new Date(b.endAt) <= new Date(b.startAt) ? { endAt: "The event must end after it starts" } : {})}
      rowExtra={(r) => (
        <Link href={`/events/${r.id}`} className="btn btn-ghost btn-sm btn-square" aria-label={`Open ${r.title} on the site`} title="View on the site">
          <ExternalLink className="size-4" />
        </Link>
      )}
    />
  );
}
