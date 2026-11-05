"use client";

import { CrudPage, type Column } from "@/components/admin/crud";
import type { FieldDef } from "@/components/admin/form";
import { Pill, type Tone } from "@/components/ui/kit";
import { fmtDate, money } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  season: string;
  year: number;
  startDate: string;
  endDate: string;
  status: "completed" | "ongoing" | "registration" | "upcoming";
  registrationOpen?: boolean;
  registrationDeadline?: string;
  evaluationOpen?: boolean;
  minCredits: number;
  maxCredits: number;
  fees: { perCredit: number };
};

const STATUS: Record<Row["status"], { tone: Tone; label: string }> = {
  completed: { tone: "info", label: "Completed" },
  ongoing: { tone: "success", label: "Ongoing" },
  registration: { tone: "secondary", label: "Registration" },
  upcoming: { tone: "primary", label: "Upcoming" },
};

const fields: FieldDef[] = [
  { type: "text", key: "name", label: "Semester name", required: true, placeholder: "Spring 2027" },
  { type: "select", key: "season", label: "Season", required: true, options: ["Spring", "Summer", "Fall"].map((s) => ({ value: s, label: s })) },
  { type: "number", key: "year", label: "Year", required: true, min: 2000, max: 2100, step: 1 },
  {
    type: "select",
    key: "status",
    label: "Status",
    required: true,
    options: [
      { value: "upcoming", label: "Upcoming" },
      { value: "registration", label: "Registration open for the next term" },
      { value: "ongoing", label: "Ongoing" },
      { value: "completed", label: "Completed" },
    ],
  },
  { type: "date", key: "startDate", label: "First day", required: true },
  { type: "date", key: "endDate", label: "Last day", required: true },
  { type: "heading", label: "Registration and evaluation" },
  { type: "checkbox", key: "registrationOpen", label: "Course registration is open", hint: "Students can pick sections for this semester" },
  { type: "datetime", key: "registrationDeadline", label: "Registration deadline" },
  { type: "number", key: "minCredits", label: "Minimum credits", required: true, min: 0, step: 1 },
  { type: "number", key: "maxCredits", label: "Maximum credits", required: true, min: 1, step: 1 },
  { type: "checkbox", key: "evaluationOpen", label: "Course evaluation is open", hint: "Students must finish evaluations before they can see their results" },
  { type: "heading", label: "Fees in taka", hint: "Used to build each student's tuition bill." },
  { type: "number", key: "fees.perCredit", label: "Tuition per credit", required: true, min: 0, step: 1 },
  { type: "number", key: "fees.registration", label: "Registration fee", required: true, min: 0, step: 1 },
  { type: "number", key: "fees.library", label: "Library fee", required: true, min: 0, step: 1 },
  { type: "number", key: "fees.activity", label: "Student activity fee", required: true, min: 0, step: 1 },
];

const columns: Column<Row>[] = [
  {
    header: "Semester",
    cell: (r) => (
      <div>
        <p className="font-bold">{r.name}</p>
        <p className="text-sm whitespace-nowrap text-base-content/65">
          {fmtDate(r.startDate)} to {fmtDate(r.endDate)}
        </p>
      </div>
    ),
  },
  { header: "Status", cell: (r) => <Pill tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Pill> },
  {
    header: "Registration",
    hide: "md",
    cell: (r) =>
      r.registrationOpen ? (
        <div className="text-sm">
          <Pill tone="success">Open</Pill>
          {r.registrationDeadline && <p className="mt-1 whitespace-nowrap text-base-content/60">until {fmtDate(r.registrationDeadline)}</p>}
        </div>
      ) : (
        <Pill tone="info">Closed</Pill>
      ),
  },
  { header: "Evaluation", hide: "lg", cell: (r) => (r.evaluationOpen ? <Pill tone="success">Open</Pill> : <Pill tone="info">Closed</Pill>) },
  { header: "Credits", hide: "lg", cell: (r) => `${r.minCredits}–${r.maxCredits}` },
  { header: "Per credit", hide: "xl", cell: (r) => money(r.fees?.perCredit) },
];

export default function AdminSemesters() {
  return (
    <CrudPage<Row>
      title="Semesters"
      sub="Open and close registration and evaluation, and set the fees that build each student's bill."
      path="semesters"
      noun="semester"
      label={(r) => r.name}
      columns={columns}
      fields={fields}
      searchPlaceholder="Search by semester name"
      refresh={["/registration", "/dashboard", "/my-courses", "/evaluation", "/fees"]}
      size="lg"
      defaults={{ season: "Spring", status: "upcoming", minCredits: 9, maxCredits: 15, fees: { perCredit: 4500, registration: 6000, library: 1200, activity: 1500 } }}
      validate={(b): Record<string, string> => (b.startDate && b.endDate && new Date(b.endDate) <= new Date(b.startDate) ? { endDate: "The last day must come after the first day" } : b.minCredits > b.maxCredits ? { maxCredits: "Maximum credits can't be below the minimum" } : {})}
    />
  );
}
