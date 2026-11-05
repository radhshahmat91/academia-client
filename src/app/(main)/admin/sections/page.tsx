"use client";

import { CrudPage, type Column } from "@/components/admin/crud";
import { DAYS, type FieldDef } from "@/components/admin/form";
import { Meter } from "@/components/ui/kit";
import { useGet } from "@/hooks/use-api";
import type { Paged, Slot } from "@/lib/types";

type Row = {
  id: string;
  name: string;
  capacity: number;
  enrolled: number;
  instructor?: { name?: string; title?: string };
  schedule?: Slot[];
  course?: { id: string; code: string; title: string; credits: number } | null;
  semester?: { id: string; name: string } | null;
};

const columns: Column<Row>[] = [
  {
    header: "Course",
    cell: (r) => (
      <div className="min-w-0">
        <p className="font-bold">
          {r.course?.code ?? "Removed course"} <span className="font-normal text-base-content/60">· Section {r.name}</span>
        </p>
        <p className="max-w-[18rem] truncate text-sm text-base-content/65">{r.course?.title}</p>
      </div>
    ),
  },
  { header: "Semester", hide: "sm", cell: (r) => <span className="text-sm whitespace-nowrap">{r.semester?.name}</span> },
  {
    header: "Instructor",
    hide: "md",
    cell: (r) => (
      <div className="text-sm">
        <p className="font-semibold whitespace-nowrap">{r.instructor?.name}</p>
        <p className="text-base-content/60">{r.instructor?.title}</p>
      </div>
    ),
  },
  {
    header: "Schedule",
    hide: "lg",
    cell: (r) => (
      <ul className="text-sm text-base-content/75">
        {(r.schedule ?? []).map((s, i) => (
          <li key={i} className="whitespace-nowrap">
            {s.day} {s.start}–{s.end}
            {s.room ? ` · ${s.room}` : ""}
          </li>
        ))}
      </ul>
    ),
  },
  {
    header: "Seats",
    cell: (r) => (
      <div className="w-24">
        <p className="mb-1 text-sm font-semibold">
          {r.enrolled} / {r.capacity}
        </p>
        <Meter value={r.enrolled} max={r.capacity} tone={r.enrolled >= r.capacity ? "error" : "primary"} />
      </div>
    ),
  },
];

export default function AdminSections() {
  const sems = useGet<Paged<{ id: string; name: string }>>("/admin/semesters?limit=100", { staleTime: 60_000 });
  const courses = useGet<Paged<{ id: string; code: string; title: string }>>("/admin/courses?limit=100", { staleTime: 60_000 });
  const semOpts = (sems.data?.items ?? []).map((s) => ({ value: s.id, label: s.name }));

  const fields: FieldDef[] = [
    { type: "select", key: "semester", label: "Semester", required: true, options: semOpts },
    { type: "select", key: "course", label: "Course", required: true, options: (courses.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` })) },
    { type: "text", key: "name", label: "Section name", required: true, placeholder: "A" },
    { type: "number", key: "capacity", label: "Seats", required: true, min: 1, step: 1 },
    { type: "heading", label: "Instructor" },
    { type: "text", key: "instructor.name", label: "Name", required: true },
    { type: "text", key: "instructor.title", label: "Title", placeholder: "Assistant Professor" },
    { type: "email", key: "instructor.email", label: "Email", span: 2 },
    { type: "heading", label: "Class schedule", hint: "Registration warns students when two sections clash." },
    {
      type: "list",
      key: "schedule",
      label: "Class times",
      itemLabel: "Class",
      addLabel: "Add a class time",
      cols: "sm:grid-cols-4",
      item: [
        { type: "select", key: "day", label: "Day", required: true, options: DAYS },
        { type: "time", key: "start", label: "Starts", required: true },
        { type: "time", key: "end", label: "Ends", required: true },
        { type: "text", key: "room", label: "Room", placeholder: "Room 402" },
      ],
    },
  ];

  return (
    <CrudPage<Row>
      title="Sections"
      sub="Create the sections students register for: who teaches, when it meets and how many seats it has."
      path="sections"
      noun="section"
      label={(r) => `${r.course?.code ?? "section"} ${r.name}`}
      columns={columns}
      fields={fields}
      filters={[{ key: "semester", label: "Semester", all: "All semesters", options: semOpts }]}
      searchPlaceholder={false}
      refresh={["/registration", "/dashboard", "/my-courses"]}
      size="lg"
      defaults={{ name: "A", capacity: 40 }}
      validate={(b): Record<string, string> => {
        const out: Record<string, string> = {};
        (b.schedule as Slot[] | undefined)?.forEach((s, i) => {
          if (s.start && s.end && s.end <= s.start) out[`schedule.${i}.end`] = "Must end after it starts";
        });
        return out;
      }}
    />
  );
}
