"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Opt } from "@/components/admin/form";
import { EmptyState, ErrorState, ListSkeleton, Pagination, SearchBox, Select } from "@/components/ui/kit";
import { Reveal } from "@/components/ui/motion";
import { useGet } from "@/hooks/use-api";
import { qs } from "@/hooks/use-url-state";
import type { ApiError } from "@/lib/api";
import type { Paged } from "@/lib/types";
import { cn } from "@/lib/utils";

const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell", "2xl": "hidden 2xl:table-cell" } as const;

export type Column<T> = { header: string; cell: (row: T) => ReactNode; hide?: keyof typeof HIDE; className?: string };
export type FilterDef = { key: string; label: string; all: string; options: Opt[] };

/** Search text (debounced), filters and page for one admin list. */
export function useListState(limit: number, base: string) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilterState] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(text.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [text]);
  const setFilter = (key: string, v: string) => {
    setFilterState((s) => ({ ...s, [key]: v }));
    setPage(1);
  };
  const url = `${base}${qs({ q, page: page === 1 ? "" : page, limit, ...filter })}`;
  return { text, setText, q, filter, setFilter, page, setPage, url, filtered: !!q || Object.values(filter).some(Boolean) };
}
export type ListState = ReturnType<typeof useListState>;

/** The search box is left out when no placeholder is given, for lists the API cannot search. */
export function Toolbar({ s, placeholder, filters = [] }: { s: ListState; placeholder?: string; filters?: FilterDef[] }) {
  if (!placeholder && !filters.length) return null;
  return (
    <div className={cn("mb-5 grid gap-3", placeholder ? ["", "sm:grid-cols-[1fr_14rem]", "sm:grid-cols-[1fr_14rem_14rem]"][filters.length] : "sm:flex sm:flex-wrap")}>
      {placeholder && <SearchBox value={s.text} onChange={s.setText} placeholder={placeholder} />}
      {filters.map((f) => (
        <Select key={f.key} className={placeholder ? undefined : "sm:w-60"} label={f.label} all={f.all} value={s.filter[f.key] ?? ""} onChange={(v) => s.setFilter(f.key, v)} options={f.options} />
      ))}
    </div>
  );
}

/** Loading, error and empty states, the table itself and the pager for a paged admin list. */
export function ListBody<T extends { id: string }>({ query, s, columns, actions, limit, noun, emptyAction }: { query: UseQueryResult<Paged<T>, ApiError>; s: ListState; columns: Column<T>[]; actions?: (row: T) => ReactNode; limit: number; noun: string; emptyAction?: ReactNode }) {
  const { data, isLoading, isError, error, refetch, isFetching } = query;
  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data) return <ListSkeleton n={6} />;
  if (data.items.length === 0)
    return (
      <EmptyState
        icon={<SearchX className="size-7" />}
        title={s.filtered ? `No ${noun} match` : `No ${noun} yet`}
        body={s.filtered ? "Try a different word or clear the filters." : undefined}
        action={s.filtered ? undefined : emptyAction}
      />
    );
  const from = (data.page - 1) * limit + 1;
  return (
    <Reveal y={10}>
      <div className={cn("surface overflow-hidden transition-opacity", isFetching && "opacity-70")}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-xs tracking-wide text-base-content/60 uppercase">
                {columns.map((c) => (
                  <th key={c.header} className={cn(c.hide && HIDE[c.hide], c.className)}>
                    {c.header}
                  </th>
                ))}
                {actions && (
                  <th className="w-px">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id} className="hover:bg-base-200/60">
                  {columns.map((c) => (
                    <td key={c.header} className={cn("align-middle", c.hide && HIDE[c.hide], c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                  {actions && <td className="text-right whitespace-nowrap">{actions(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-base-content/10 px-5 py-3 text-sm text-base-content/60">
          Showing {from}–{from + data.items.length - 1} of {data.total}
        </p>
      </div>
      <Pagination
        page={data.page}
        pages={data.pages}
        onChange={(p) => {
          s.setPage(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </Reveal>
  );
}

/** A read-only paged list: search box, filters, table and pager. */
export function ListView<T extends { id: string }>({ path, columns, actions, filters = [], placeholder, noun, limit = 12 }: { path: string; columns: Column<T>[]; actions?: (row: T) => ReactNode; filters?: FilterDef[]; placeholder?: string; noun: string; limit?: number }) {
  const s = useListState(limit, path);
  const query = useGet<Paged<T>>(s.url, { keepPrevious: true });
  return (
    <>
      <Toolbar s={s} placeholder={placeholder} filters={filters} />
      <ListBody query={query} s={s} columns={columns} actions={actions} limit={limit} noun={noun} />
    </>
  );
}
