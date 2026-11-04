"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Keeps filter state in the address bar, so a filtered list survives reloads and can be shared.
 * Changing any key other than `page` sends the list back to page 1.
 */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const state = Object.fromEntries(Object.keys(defaults).map((k) => [k, sp.get(k) ?? defaults[k]])) as T;

  const set = useCallback(
    (patch: Partial<T>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (!v || v === defaults[k]) next.delete(k);
        else next.set(k, v as string);
      }
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sp, pathname, router],
  );
  return [state, set] as const;
}

export const qs = (o: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};
