"use client";

import { CrudPage, type Column } from "@/components/admin/crud";
import type { FieldDef } from "@/components/admin/form";
import { Avatar, Pill } from "@/components/ui/kit";

type Row = { id: string; name: string; email: string; image?: string | null; role: "student" | "admin"; studentId?: string; department?: string; batch?: string; waiverPercent?: number };

const fields: FieldDef[] = [
  { type: "text", key: "name", label: "Full name", required: true, span: 2 },
  {
    type: "select",
    key: "role",
    label: "Role",
    required: true,
    options: [
      { value: "student", label: "Student" },
      { value: "admin", label: "Administrator" },
    ],
    hint: "Administrators can open this panel",
  },
  { type: "text", key: "studentId", label: "Student ID", placeholder: "251001" },
  { type: "text", key: "department", label: "Department", span: 2 },
  { type: "text", key: "batch", label: "Batch", placeholder: "2025" },
  { type: "number", key: "waiverPercent", label: "Tuition waiver %", required: true, min: 0, max: 100, step: 1, hint: "Taken off tuition only, not other fees" },
];

const columns: Column<Row>[] = [
  {
    header: "Person",
    cell: (r) => (
      <div className="flex items-center gap-3">
        <Avatar name={r.name} src={r.image} size={40} />
        <div className="min-w-0">
          <p className="truncate font-bold">{r.name}</p>
          <p className="truncate text-sm text-base-content/65">{r.email}</p>
        </div>
      </div>
    ),
  },
  { header: "Role", cell: (r) => <Pill tone={r.role === "admin" ? "secondary" : "primary"}>{r.role === "admin" ? "Administrator" : "Student"}</Pill> },
  { header: "ID", hide: "sm", cell: (r) => r.studentId },
  { header: "Department", hide: "lg", cell: (r) => <span className="text-sm">{r.department}</span> },
  { header: "Batch", hide: "md", cell: (r) => r.batch },
  { header: "Waiver", hide: "md", cell: (r) => (r.waiverPercent ? `${r.waiverPercent}%` : "–") },
];

export default function AdminUsers() {
  return (
    <CrudPage<Row>
      title="Users"
      sub="Find any account, make someone an administrator or set a tuition waiver."
      path="users"
      noun="user"
      label={(r) => r.name}
      columns={columns}
      fields={fields}
      create={false}
      remove={false}
      size="md"
      limit={15}
      searchPlaceholder="Search by name, email or student ID"
      refresh={["/students", "/me"]}
      filters={[
        {
          key: "role",
          label: "Role",
          all: "Everyone",
          options: [
            { value: "student", label: "Students" },
            { value: "admin", label: "Administrators" },
          ],
        },
      ]}
    />
  );
}
