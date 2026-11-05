"use client";

import { ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import { CrudPage, type Column } from "@/components/admin/crud";
import type { FieldDef } from "@/components/admin/form";
import { Pill } from "@/components/ui/kit";
import { pretty } from "@/lib/utils";

type Row = { id: string; code: string; title: string; department?: string; credits: number; category?: string; featured?: boolean; lectures?: unknown[]; notes?: unknown[] };

const ytId = (s: string) => s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1] ?? s;

const fields: FieldDef[] = [
  { type: "heading", label: "Basics" },
  { type: "text", key: "code", label: "Course code", required: true, placeholder: "CSE 201" },
  { type: "text", key: "title", label: "Title", required: true, placeholder: "Data Structures" },
  { type: "text", key: "department", label: "Department", required: true, placeholder: "Computer Science & Engineering" },
  { type: "select", key: "level", label: "Level", required: true, options: [100, 200, 300, 400].map((n) => ({ value: String(n), label: `${n} level` })) },
  { type: "number", key: "credits", label: "Credits", required: true, min: 0.5, max: 6, step: 0.5 },
  { type: "text", key: "category", label: "Subject area", hint: "One lowercase word for the subject filter, such as programming or data-ai" },
  { type: "url", key: "image", label: "Cover image link", hint: "A wide photo works best", span: 2 },
  { type: "textarea", key: "summary", label: "Short summary", rows: 2, hint: "Shown on the course card" },
  { type: "textarea", key: "description", label: "About this course", rows: 5 },
  { type: "tags", key: "prerequisites", label: "Prerequisites", hint: "Course codes, for example CSE 101" },
  { type: "tags", key: "tags", label: "Tags" },
  { type: "lines", key: "topics", label: "Topics covered", placeholder: "One topic per line" },
  { type: "lines", key: "outcomes", label: "What students will be able to do", placeholder: "One outcome per line" },
  { type: "checkbox", key: "featured", label: "Feature on the home page", hint: "Featured courses appear in the home page showcase" },
  { type: "heading", label: "Assessment", hint: "How the final mark is made up. The weights should add up to 100." },
  {
    type: "list",
    key: "assessment",
    label: "Assessment",
    itemLabel: "Item",
    addLabel: "Add an assessment item",
    cols: "grid-cols-[1fr_7rem]",
    item: [
      { type: "text", key: "label", label: "Name", required: true, placeholder: "Midterm exam" },
      { type: "number", key: "weight", label: "Weight %", required: true, min: 0, max: 100 },
    ],
  },
  { type: "heading", label: "Video lectures", hint: "Paste the YouTube link or just the video ID." },
  {
    type: "list",
    key: "lectures",
    label: "Lectures",
    itemLabel: "Lecture",
    addLabel: "Add a lecture",
    item: [
      { type: "text", key: "title", label: "Lecture title", required: true, span: 2 },
      { type: "text", key: "youtubeId", label: "YouTube link or ID", required: true, transform: ytId, pattern: "^[\\w-]{11}$", patternMessage: "That does not look like a YouTube video link" },
      { type: "number", key: "minutes", label: "Length in minutes", min: 1 },
      { type: "text", key: "channel", label: "Channel", span: 2 },
    ],
  },
  { type: "heading", label: "Notes and resources" },
  {
    type: "list",
    key: "notes",
    label: "Notes",
    itemLabel: "Resource",
    addLabel: "Add a note or resource",
    item: [
      { type: "text", key: "title", label: "Title", required: true },
      {
        type: "select",
        key: "kind",
        label: "Type",
        required: true,
        options: [
          { value: "note", label: "Written note" },
          { value: "pdf", label: "PDF" },
          { value: "slides", label: "Slides" },
          { value: "link", label: "Web link" },
        ],
      },
      { type: "url", key: "url", label: "Link", span: 2, hint: "For PDFs, slides and web links" },
      { type: "textarea", key: "description", label: "Short description", rows: 2 },
      { type: "textarea", key: "body", label: "Note text", rows: 6, hint: "For written notes" },
    ],
  },
];

const columns: Column<Row>[] = [
  {
    header: "Course",
    cell: (r) => (
      <div className="min-w-0">
        <p className="font-bold">{r.code}</p>
        <p className="max-w-[20rem] truncate text-sm text-base-content/65">{r.title}</p>
      </div>
    ),
  },
  { header: "Department", hide: "md", cell: (r) => <span className="text-sm">{r.department}</span> },
  { header: "Credits", hide: "sm", cell: (r) => r.credits },
  { header: "Subject", hide: "lg", cell: (r) => (r.category ? <Pill tone="info">{pretty(r.category)}</Pill> : null) },
  {
    header: "Content",
    hide: "md",
    cell: (r) => (
      <span className="text-sm whitespace-nowrap text-base-content/70">
        {r.lectures?.length ?? 0} video{r.lectures?.length === 1 ? "" : "s"} · {r.notes?.length ?? 0} note{r.notes?.length === 1 ? "" : "s"}
      </span>
    ),
  },
  { header: "Featured", hide: "xl", cell: (r) => (r.featured ? <Star className="size-4 fill-secondary text-secondary" aria-label="Featured" /> : null) },
];

export default function AdminCourses() {
  return (
    <CrudPage<Row>
      title="Courses"
      sub="Add courses, upload video lectures and notes, and set how each course is assessed."
      path="courses"
      noun="course"
      label={(r) => `${r.code} ${r.title}`}
      columns={columns}
      fields={fields}
      searchPlaceholder="Search by code, title or department"
      refresh={["/courses", "/dashboard", "/home"]}
      size="xl"
      defaults={{ credits: 3, level: 100 }}
      rowExtra={(r) => (
        <Link href={`/courses/${r.id}`} className="btn btn-ghost btn-sm btn-square" aria-label={`Open ${r.code} on the site`} title="View on the site">
          <ExternalLink className="size-4" />
        </Link>
      )}
    />
  );
}
