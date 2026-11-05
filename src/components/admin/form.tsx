"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Field } from "@/components/ui/kit";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- types */
export type Opt = { value: string; label: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Values = Record<string, any>;

type Base = { key: string; label: string; hint?: ReactNode; required?: boolean; span?: 1 | 2; placeholder?: string };
export type FieldDef =
  | { type: "heading"; label: string; hint?: ReactNode }
  | (Base & { type: "text" | "url" | "email" | "time" | "date" | "datetime"; pattern?: string; patternMessage?: string; transform?: (s: string) => string })
  | (Base & { type: "number"; min?: number; max?: number; step?: number })
  | (Base & { type: "textarea"; rows?: number })
  | (Base & { type: "select"; options: Opt[]; empty?: string })
  | (Base & { type: "checkbox" })
  | (Base & { type: "tags" })
  | (Base & { type: "lines" })
  | (Base & { type: "list"; item: FieldDef[]; addLabel: string; itemLabel?: string; cols?: string; maxItems?: number });

/* -------------------------------------------------------------------------- helpers */
const getPath = (o: unknown, p: string): unknown => p.split(".").reduce<unknown>((a, k) => (a == null ? undefined : (a as Values)[k]), o);
const setPath = (o: Values, p: string, v: unknown): Values => {
  const [head, ...rest] = p.split(".");
  return { ...o, [head!]: rest.length ? setPath((o?.[head!] as Values) ?? {}, rest.join("."), v) : v };
};

let counter = 0;
const rowKey = () => `r${++counter}`;

// Dhaka has no daylight saving, so a fixed +06:00 offset is exact.
const DHAKA = 6 * 3_600_000;
const toLocal = (iso: unknown, len: 10 | 16) => {
  const t = iso ? new Date(iso as string).getTime() : NaN;
  return Number.isNaN(t) ? "" : new Date(t + DHAKA).toISOString().slice(0, len);
};
const fromLocal = (s: string) => new Date(s.length === 10 ? `${s}T00:00:00+06:00` : `${s.slice(0, 16)}:00+06:00`).toISOString();

/** Turns a document from the API into the string-based values the inputs edit. */
export function toForm(defs: FieldDef[], doc: unknown): Values {
  let out: Values = {};
  for (const d of defs) {
    if (d.type === "heading") continue;
    const raw = getPath(doc, d.key);
    let v: unknown;
    switch (d.type) {
      case "number":
        v = raw == null ? "" : String(raw);
        break;
      case "date":
        v = toLocal(raw, 10);
        break;
      case "datetime":
        v = toLocal(raw, 16);
        break;
      case "checkbox":
        v = !!raw;
        break;
      case "tags":
        v = Array.isArray(raw) ? raw.map(String) : [];
        break;
      case "lines":
        v = Array.isArray(raw) ? raw.join("\n") : "";
        break;
      case "select":
        v = raw && typeof raw === "object" ? String((raw as Values).id ?? "") : raw == null ? "" : String(raw);
        if (v === "" && d.required && !d.empty && d.options.length) v = d.options[0]!.value;
        break;
      case "list":
        v = (Array.isArray(raw) ? (raw as Values[]) : []).map((r) => ({ ...toForm(d.item, r), _k: rowKey(), ...(r?.id ? { _id: r.id } : {}) }));
        break;
      default:
        v = raw == null ? "" : String(raw);
    }
    out = setPath(out, d.key, v);
  }
  return out;
}

const blankRow = (defs: FieldDef[], row: Values) =>
  defs.every((d) => {
    if (d.type === "heading") return true;
    const v = getPath(row, d.key);
    if (d.type === "checkbox" || d.type === "select") return true; // these always carry a default
    return Array.isArray(v) ? v.length === 0 : String(v ?? "").trim() === "";
  });

/** Validates the form and converts it to the JSON the API expects. */
export function toPayload(defs: FieldDef[], values: Values, base = ""): { body: Values; errors: Record<string, string> } {
  let body: Values = {};
  const errors: Record<string, string> = {};
  for (const d of defs) {
    if (d.type === "heading") continue;
    const path = base + d.key;
    const raw = getPath(values, d.key);
    const fail = (m: string) => {
      errors[path] = m;
    };
    let v: unknown;
    switch (d.type) {
      case "number": {
        const s = String(raw ?? "").trim();
        if (!s) {
          if (d.required) fail(`${d.label} is required`);
          v = null;
          break;
        }
        const n = Number(s);
        if (!Number.isFinite(n)) fail("Enter a number");
        else if (d.min !== undefined && n < d.min) fail(`${d.label} must be at least ${d.min}`);
        else if (d.max !== undefined && n > d.max) fail(`${d.label} can't be above ${d.max}`);
        v = n;
        break;
      }
      case "date":
      case "datetime": {
        const s = String(raw ?? "").trim();
        if (!s && d.required) fail(`${d.label} is required`);
        v = s ? fromLocal(s) : null;
        break;
      }
      case "checkbox":
        v = !!raw;
        break;
      case "tags":
        v = Array.isArray(raw) ? raw : [];
        if (d.required && !(v as unknown[]).length) fail(`Add at least one ${d.label.toLowerCase()}`);
        break;
      case "lines":
        v = String(raw ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        if (d.required && !(v as unknown[]).length) fail(`${d.label} is required`);
        break;
      case "list": {
        const rows: Values[] = [];
        ((raw as Values[]) ?? []).forEach((row, i) => {
          if (blankRow(d.item, row)) return;
          const r = toPayload(d.item, row, `${path}.${i}.`);
          Object.assign(errors, r.errors);
          rows.push(row._id ? { ...r.body, _id: row._id } : r.body);
        });
        v = rows;
        break;
      }
      case "select": {
        const s = String(raw ?? "").trim();
        if (!s && d.required) fail(`Choose ${d.label.toLowerCase()}`);
        v = s || null;
        break;
      }
      default: {
        let s = String(raw ?? "").trim();
        if (s && "transform" in d && d.transform) s = d.transform(s);
        if (!s && d.required) fail(`${d.label} is required`);
        else if (s && "pattern" in d && d.pattern && !new RegExp(d.pattern).test(s)) fail(d.patternMessage ?? "Check the format");
        else if (s && d.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) fail("Enter a valid email address");
        else if (s && d.type === "url" && !/^https?:\/\/\S+$/i.test(s)) fail("Enter a full link starting with https://");
        v = s;
      }
    }
    body = setPath(body, d.key, v);
  }
  return { body, errors };
}

/* -------------------------------------------------------------------------- inputs */
function TagInput({ id, value, onChange, placeholder, invalid }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; invalid?: boolean }) {
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !value.includes(s));
    if (parts.length) onChange([...value, ...parts]);
    setText("");
  };
  return (
    <div className={cn("flex min-h-12 flex-wrap items-center gap-2 rounded-field border bg-base-100 px-3 py-2 focus-within:border-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary/40", invalid ? "border-error" : "border-base-content/20")}>
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pr-1 pl-3 text-sm font-semibold text-primary">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="grid size-5 place-items-center rounded-full hover:bg-primary/15">
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => add(text)}
        placeholder={value.length ? "" : (placeholder ?? "Type and press Enter")}
        className="min-w-32 flex-1 bg-transparent py-1 outline-none"
      />
    </div>
  );
}

function ListEditor({ def, rows, onChange, errors, prefix, uid }: { def: Extract<FieldDef, { type: "list" }>; rows: Values[]; onChange: (r: Values[]) => void; errors: Record<string, string>; prefix: string; uid: string }) {
  const label = def.itemLabel ?? def.label;
  const move = (i: number, to: number) => {
    const next = [...rows];
    [next[i], next[to]] = [next[to]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="grid gap-3">
      {rows.length === 0 && <p className="rounded-2xl border border-dashed border-base-content/20 px-4 py-5 text-center text-sm text-base-content/60">Nothing added yet.</p>}
      {rows.map((row, i) => (
        <div key={row._k ?? i} className="rounded-2xl border border-base-content/12 bg-base-200/50 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-base-content/70">
              {label} {i + 1}
            </span>
            <span className="flex items-center gap-1">
              <button type="button" className="btn btn-ghost btn-xs btn-square" aria-label={`Move ${label} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                <ArrowUp className="size-4" />
              </button>
              <button type="button" className="btn btn-ghost btn-xs btn-square" aria-label={`Move ${label} ${i + 1} down`} disabled={i === rows.length - 1} onClick={() => move(i, i + 1)}>
                <ArrowDown className="size-4" />
              </button>
              <button type="button" className="btn btn-ghost btn-xs btn-square text-error" aria-label={`Remove ${label} ${i + 1}`} onClick={() => onChange(rows.filter((_, k) => k !== i))}>
                <Trash2 className="size-4" />
              </button>
            </span>
          </div>
          <FormFields defs={def.item} values={row} onChange={(r) => onChange(rows.map((x, k) => (k === i ? { ...r, _k: x._k, ...(x._id ? { _id: x._id } : {}) } : x)))} errors={errors} prefix={`${prefix}${i}.`} uid={uid} cols={def.cols} />
        </div>
      ))}
      {(!def.maxItems || rows.length < def.maxItems) && (
        <button type="button" className="btn btn-outline btn-sm w-fit border-dashed" onClick={() => onChange([...rows, { ...toForm(def.item, {}), _k: rowKey() }])}>
          <Plus className="size-4" /> {def.addLabel}
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- form */
export function FormFields({ defs, values, onChange, errors, prefix = "", uid, cols = "sm:grid-cols-2" }: { defs: FieldDef[]; values: Values; onChange: (v: Values) => void; errors: Record<string, string>; prefix?: string; uid: string; cols?: string }) {
  return (
    <div className={cn("grid gap-x-4 gap-y-5", cols)}>
      {defs.map((d, i) => {
        if (d.type === "heading")
          return (
            <div key={`h${i}`} className="col-span-full border-b border-base-content/10 pt-3 pb-2 first:pt-0">
              <h3 className="h-section text-lg">{d.label}</h3>
              {d.hint && <p className="mt-0.5 text-sm text-base-content/60">{d.hint}</p>}
            </div>
          );
        const path = prefix + d.key;
        const id = `${uid}-${path.replace(/\./g, "-")}`;
        const value = getPath(values, d.key);
        const set = (v: unknown) => onChange(setPath(values, d.key, v));
        const err = errors[path];
        const wide = d.type === "textarea" || d.type === "tags" || d.type === "lines" || d.type === "list" || d.type === "checkbox" ? d.span !== 1 : d.span === 2;
        const label = d.type === "list" ? (
          <span className="sr-only">{d.label}</span>
        ) : (
          <>
            {d.label}
            {d.required && (
              <span className="ml-0.5 text-error" aria-hidden="true">
                {" "}
                *
              </span>
            )}
          </>
        );
        const common = { id, "aria-invalid": !!err || undefined, "aria-required": d.required || undefined };
        let control: ReactNode;
        switch (d.type) {
          case "textarea":
            control = <textarea {...common} className={cn("textarea w-full leading-relaxed", err && "textarea-error")} rows={d.rows ?? 4} value={String(value ?? "")} onChange={(e) => set(e.target.value)} placeholder={d.placeholder} />;
            break;
          case "lines":
            control = <textarea {...common} className={cn("textarea w-full leading-relaxed", err && "textarea-error")} rows={4} value={String(value ?? "")} onChange={(e) => set(e.target.value)} placeholder={d.placeholder ?? "One item per line"} />;
            break;
          case "select":
            control = (
              <select {...common} className={cn("select w-full", err && "select-error")} value={String(value ?? "")} onChange={(e) => set(e.target.value)}>
                {(!d.required || d.empty) && <option value="">{d.empty ?? "None"}</option>}
                {d.required && !d.empty && !value && <option value="">Choose…</option>}
                {d.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            );
            break;
          case "checkbox":
            return (
              <div key={d.key} className={cn(wide && "sm:col-span-2")}>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-base-content/15 px-4 py-3 transition-colors hover:border-primary/40">
                  <input id={id} type="checkbox" className="toggle toggle-primary" checked={!!value} onChange={(e) => set(e.target.checked)} />
                  <span>
                    <span className="block font-semibold">{d.label}</span>
                    {d.hint && <span className="block text-sm text-base-content/60">{d.hint}</span>}
                  </span>
                </label>
              </div>
            );
          case "tags":
            control = <TagInput id={id} value={(value as string[]) ?? []} onChange={set} placeholder={d.placeholder} invalid={!!err} />;
            break;
          case "list":
            control = <ListEditor def={d} rows={(value as Values[]) ?? []} onChange={set} errors={errors} prefix={`${path}.`} uid={uid} />;
            break;
          case "number":
            control = <input {...common} className={cn("input w-full", err && "input-error")} type="number" inputMode="decimal" min={d.min} max={d.max} step={d.step ?? "any"} value={String(value ?? "")} onChange={(e) => set(e.target.value)} placeholder={d.placeholder} />;
            break;
          default:
            control = (
              <input
                {...common}
                className={cn("input w-full", err && "input-error")}
                type={d.type === "datetime" ? "datetime-local" : d.type}
                value={String(value ?? "")}
                onChange={(e) => set(e.target.value)}
                placeholder={d.placeholder}
                autoComplete="off"
              />
            );
        }
        return (
          <Field key={d.key} label={label} htmlFor={id} error={err} hint={d.hint} className={cn(wide && "sm:col-span-2")}>
            {control}
          </Field>
        );
      })}
    </div>
  );
}

/** Day and time options used by section schedules. */
export const DAYS: Opt[] = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => ({ value: d.slice(0, 3), label: d }));
