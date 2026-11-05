"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { FormFields, toForm, toPayload, type FieldDef, type Values } from "@/components/admin/form";
import { ListBody, Toolbar, useListState, type Column, type FilterDef } from "@/components/admin/table";
import { PageHeader, Spinner } from "@/components/ui/kit";
import { Modal, useConfirm } from "@/components/ui/modal";
import { send, useAction, useGet } from "@/hooks/use-api";
import type { Paged } from "@/lib/types";

export type { Column, FilterDef };

type Props<T> = {
  title: string;
  sub: string;
  /** API path under /admin, for example "courses" */
  path: string;
  /** Singular noun used in buttons and toasts, for example "course" */
  noun: string;
  columns: Column<T>[];
  fields: FieldDef[];
  /** Pass false for lists the API can't search */
  searchPlaceholder?: string | false;
  filters?: FilterDef[];
  /** Extra cache prefixes to refresh after a change, such as the public list a page feeds */
  refresh?: string[];
  create?: boolean;
  remove?: boolean;
  size?: "md" | "lg" | "xl";
  rowExtra?: (row: T) => ReactNode;
  /** Names the row in the delete confirmation */
  label: (row: T) => string;
  limit?: number;
  /** Starting values for the add form, in the same shape the API returns */
  defaults?: Record<string, unknown>;
  /** Extra checks on the converted payload; return a message per field key */
  validate?: (body: Values) => Record<string, string>;
};

type Editing<T> = { row: T | null } | null;

export function CrudPage<T extends { id: string }>({ title, sub, path, noun, columns, fields, searchPlaceholder, filters = [], refresh = [], create = true, remove = true, size = "lg", rowExtra, label, limit = 12, defaults, validate }: Props<T>) {
  const confirm = useConfirm();
  const uid = useId();
  const formId = `${uid}-form`;
  const s = useListState(limit, `/admin/${path}`);
  const query = useGet<Paged<T>>(s.url, { keepPrevious: true });
  const [editing, setEditing] = useState<Editing<T>>(null);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refreshKeys = [`/admin/${path}`, ...refresh];

  const save = useAction(({ id, body }: { id?: string; body: Values }) => (id ? send("PATCH", `/admin/${path}/${id}`, body) : send("POST", `/admin/${path}`, body)), {
    refresh: refreshKeys,
    success: (_, v) => (v.id ? `The ${noun} was updated` : `The ${noun} was added`),
    onSuccess: () => setEditing(null),
  });
  const del = useAction((id: string) => send("DELETE", `/admin/${path}/${id}`), { refresh: refreshKeys, success: `The ${noun} was deleted` });

  const open = (row: T | null) => {
    setErrors({});
    setValues(toForm(fields, row ?? defaults ?? null));
    setEditing({ row });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = toPayload(fields, values);
    if (!Object.keys(r.errors).length && validate) Object.assign(r.errors, validate(r.body));
    setErrors(r.errors);
    const first = Object.keys(r.errors)[0];
    if (first) {
      toast.error("Please check the highlighted fields");
      requestAnimationFrame(() => document.getElementById(`${uid}-${first.replace(/\./g, "-")}`)?.focus());
      return;
    }
    save.mutate({ id: editing?.row?.id, body: r.body });
  };

  const ask = async (row: T) => {
    const ok = await confirm({ title: `Delete this ${noun}?`, body: `“${label(row)}” will be removed for good. This can't be undone.`, confirmText: "Delete", tone: "danger" });
    if (ok) del.mutate(row.id);
  };

  const addButton = (
    <button type="button" className="btn btn-primary" onClick={() => open(null)}>
      <Plus className="size-4" /> Add {noun}
    </button>
  );

  return (
    <>
      <PageHeader title={title} sub={sub} actions={create ? addButton : undefined} />
      <Toolbar s={s} placeholder={searchPlaceholder === false ? undefined : (searchPlaceholder ?? `Search ${title.toLowerCase()}`)} filters={filters} />
      <ListBody
        query={query}
        s={s}
        columns={columns}
        limit={limit}
        noun={title.toLowerCase()}
        emptyAction={create ? addButton : undefined}
        actions={(row) => (
          <span className="inline-flex items-center gap-1">
            {rowExtra?.(row)}
            <button type="button" className="btn btn-ghost btn-sm btn-square" aria-label={`Edit ${label(row)}`} title="Edit" onClick={() => open(row)}>
              <Pencil className="size-4" />
            </button>
            {remove && (
              <button type="button" className="btn btn-ghost btn-sm btn-square text-error" aria-label={`Delete ${label(row)}`} title="Delete" disabled={del.isPending} onClick={() => ask(row)}>
                <Trash2 className="size-4" />
              </button>
            )}
          </span>
        )}
      />

      <Modal
        open={!!editing}
        onClose={() => !save.isPending && setEditing(null)}
        title={editing?.row ? `Edit ${noun}` : `Add ${noun}`}
        size={size}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={save.isPending}>
              Cancel
            </button>
            <button type="submit" form={formId} className="btn btn-primary min-w-32" disabled={save.isPending}>
              {save.isPending ? <Spinner className="size-4" /> : editing?.row ? "Save changes" : `Add ${noun}`}
            </button>
          </>
        }
      >
        <form id={formId} onSubmit={submit} noValidate>
          <FormFields defs={fields} values={values} onChange={setValues} errors={errors} uid={uid} />
        </form>
      </Modal>
    </>
  );
}
