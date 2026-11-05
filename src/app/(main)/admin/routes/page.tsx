"use client";

import { CrudPage, type Column } from "@/components/admin/crud";
import type { FieldDef } from "@/components/admin/form";
import { Meter, Pill } from "@/components/ui/kit";
import { busLabel, money } from "@/lib/utils";

type Row = { id: string; name: string; code?: string; busNo?: string; fee: number; capacity: number; enrolled: number; active: boolean; stops?: { name: string; time?: string }[] };

const fields: FieldDef[] = [
  { type: "text", key: "name", label: "Route name", required: true, placeholder: "Uttara to Campus", span: 2 },
  { type: "text", key: "code", label: "Route code", placeholder: "R-03" },
  { type: "text", key: "busNo", label: "Bus number", placeholder: "05" },
  { type: "number", key: "fee", label: "Fee per semester (taka)", required: true, min: 0, step: 1 },
  { type: "number", key: "capacity", label: "Seats", required: true, min: 1, step: 1 },
  { type: "url", key: "image", label: "Photo link", span: 2 },
  { type: "checkbox", key: "active", label: "Route is running", hint: "Paused routes can't be chosen by students" },
  { type: "heading", label: "Stops in order", hint: "From the first pick-up to the campus gate." },
  {
    type: "list",
    key: "stops",
    label: "Stops",
    itemLabel: "Stop",
    addLabel: "Add a stop",
    cols: "grid-cols-[1fr_9rem]",
    item: [
      { type: "text", key: "name", label: "Stop", required: true },
      { type: "text", key: "time", label: "Pick-up time", placeholder: "7:10 am" },
    ],
  },
];

const columns: Column<Row>[] = [
  {
    header: "Route",
    cell: (r) => (
      <div className="min-w-0">
        <p className="font-bold">{r.name}</p>
        <p className="text-sm text-base-content/65">{r.code}</p>
      </div>
    ),
  },
  { header: "Bus", hide: "sm", cell: (r) => (r.busNo ? busLabel(r.busNo) : "") },
  { header: "Stops", hide: "md", cell: (r) => r.stops?.length ?? 0 },
  { header: "Fee", hide: "sm", cell: (r) => <span className="whitespace-nowrap">{money(r.fee)}</span> },
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
  { header: "Status", hide: "md", cell: (r) => (r.active ? <Pill tone="success">Running</Pill> : <Pill tone="warning">Paused</Pill>) },
];

export default function AdminRoutes() {
  return (
    <CrudPage<Row>
      title="Bus routes"
      sub="Set up routes, stops, fares and seats. Students pick from these when they ask for a bus pass."
      path="routes"
      noun="route"
      label={(r) => r.name}
      columns={columns}
      fields={fields}
      searchPlaceholder="Search by name, code or bus number"
      refresh={["/transport"]}
      defaults={{ active: true, capacity: 40, fee: 8500 }}
    />
  );
}
