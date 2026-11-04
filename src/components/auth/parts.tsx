"use client";

import { Check, Eye, EyeOff, Lock, Mail, UserRound, Image as ImageIcon } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { passwordRules } from "@/lib/validation";
import { cn } from "@/lib/utils";

const icons = { mail: Mail, user: UserRound, lock: Lock, image: ImageIcon };

type InputProps = Omit<ComponentProps<"input">, "className"> & { icon?: keyof typeof icons; invalid?: boolean; describedBy?: string };

/** Input with a leading icon. Used by every auth form so the fields always look the same. */
export function IconInput({ icon, invalid, describedBy, ...props }: InputProps) {
  const Icon = icon ? icons[icon] : null;
  return (
    <label className={cn("input w-full", invalid && "input-error")}>
      {Icon && <Icon className="size-4 opacity-55" />}
      <input {...props} aria-invalid={invalid || undefined} aria-describedby={describedBy} />
    </label>
  );
}

export function PasswordInput({ invalid, describedBy, ...props }: Omit<ComponentProps<"input">, "className" | "type"> & { invalid?: boolean; describedBy?: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className={cn("input w-full", invalid && "input-error")}>
      <Lock className="size-4 opacity-55" />
      <input {...props} type={show ? "text" : "password"} aria-invalid={invalid || undefined} aria-describedby={describedBy} />
      <button type="button" onClick={() => setShow((s) => !s)} className="-mr-1.5 grid size-8 place-items-center rounded-lg opacity-60 transition-opacity hover:opacity-100" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </label>
  );
}

/** Live checklist under the password field */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password requirements">
      {passwordRules.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.id} className={cn("inline-flex items-center gap-1.5 text-sm transition-colors", ok ? "text-success" : "text-base-content/55")}>
            <span className={cn("grid size-4 place-items-center rounded-full", ok ? "bg-success text-success-content" : "bg-base-300")}>{ok && <Check className="size-3" strokeWidth={3} />}</span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

export function GoogleButton({ next, label = "Continue with Google" }: { next: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: "/login" });
    if (error) {
      setBusy(false);
      toast.error(error.message || "Google sign in is not available right now. Use your email and password instead.");
    }
  }
  return (
    <button type="button" onClick={go} disabled={busy} className="btn btn-outline w-full border-base-content/20 bg-base-100">
      {busy ? <span className="loading loading-spinner loading-sm" /> : <FcGoogle className="size-5" />}
      {label}
    </button>
  );
}

export function OrDivider({ children = "or" }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 text-sm text-base-content/50" role="separator">
      <span className="h-px flex-1 bg-base-content/12" />
      {children}
      <span className="h-px flex-1 bg-base-content/12" />
    </div>
  );
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="btn btn-primary w-full">
      {busy && <span className="loading loading-spinner loading-sm" />}
      {children}
    </button>
  );
}
