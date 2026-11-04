"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

/** GET with caching. Pass `auth: false` for public endpoints so logged-out visitors never ask for a token. */
export function useGet<T>(path: string | null, opts: { auth?: boolean; enabled?: boolean; refetchInterval?: number; staleTime?: number; keepPrevious?: boolean } = {}) {
  const qc = useQueryClient();
  return useQuery<T, ApiError>({
    queryKey: [path ?? "none"] as QueryKey,
    queryFn: ({ signal }) => api<T>(path!, { auth: opts.auth ?? true, signal }),
    enabled: !!path && (opts.enabled ?? true),
    refetchInterval: opts.refetchInterval,
    staleTime: opts.staleTime,
    placeholderData: opts.keepPrevious ? (prev) => prev : undefined,
    meta: { qc },
  });
}

/** Refetch every cached query whose path starts with one of the prefixes. */
export function useRefresh() {
  const qc = useQueryClient();
  return (...prefixes: string[]) => qc.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === "string" && prefixes.some((p) => (q.queryKey[0] as string).startsWith(p)) });
}

type MutateOpts<V, R> = {
  success?: string | ((res: R, vars: V) => string | undefined);
  refresh?: string[];
  onSuccess?: (res: R, vars: V) => void | Promise<void>;
  onError?: (err: ApiError) => void;
  silent?: boolean;
};

/** Mutation that toasts errors (and optionally success) and refreshes related queries. */
export function useAction<V = void, R = unknown>(fn: (vars: V) => Promise<R>, opts: MutateOpts<V, R> = {}) {
  const refresh = useRefresh();
  return useMutation<R, ApiError, V>({
    mutationFn: fn,
    onSuccess: async (res, vars) => {
      if (opts.refresh?.length) void refresh(...opts.refresh);
      const msg = typeof opts.success === "function" ? opts.success(res, vars) : opts.success;
      if (msg) toast.success(msg);
      await opts.onSuccess?.(res, vars);
    },
    onError: (err) => {
      if (!opts.silent) toast.error(err.message || "Something went wrong");
      opts.onError?.(err);
    },
  });
}

export const send = <R = unknown>(method: "POST" | "PATCH" | "PUT" | "DELETE", path: string, body?: unknown) => api<R>(path, { method, body });
