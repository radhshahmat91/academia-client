"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const widths = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" };

export function Modal({ open, onClose, title, children, footer, size = "md", dismissible = true }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: keyof typeof widths; dismissible?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissible && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, dismissible]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="absolute inset-0 bg-neutral/60 backdrop-blur-sm" onClick={dismissible ? onClose : undefined} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            className={cn("relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-base-content/10 bg-base-100 shadow-2xl sm:rounded-3xl", widths[size])}
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-base-content/10 px-6 py-4">
              <h2 className="h-section text-xl">{title}</h2>
              {dismissible && (
                <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-circle -mr-2" aria-label="Close">
                  <X className="size-5" />
                </button>
              )}
            </div>
            <div className="scroll-thin overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-base-content/10 bg-base-200/50 px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type ConfirmOpts = { title: string; body?: ReactNode; confirmText?: string; cancelText?: string; tone?: "danger" | "primary" };
type Ask = (o: ConfirmOpts) => Promise<boolean>;
const ConfirmCtx = createContext<Ask>(async () => false);

/** Replaces window.confirm everywhere: `if (await confirm({ title: "Delete this?" })) ...` */
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOpts; resolve: (v: boolean) => void } | null>(null);
  const ask = useCallback<Ask>((opts) => new Promise<boolean>((resolve) => setState({ opts, resolve })), []);
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  const o = state?.opts;
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(false)}
        title={o?.title ?? ""}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => close(false)}>
              {o?.cancelText ?? "Cancel"}
            </button>
            <button type="button" className={cn("btn", o?.tone === "danger" ? "btn-error" : "btn-primary")} onClick={() => close(true)} autoFocus>
              {o?.confirmText ?? "Confirm"}
            </button>
          </>
        }
      >
        <div className="text-base-content/75">{o?.body}</div>
      </Modal>
    </ConfirmCtx.Provider>
  );
}
