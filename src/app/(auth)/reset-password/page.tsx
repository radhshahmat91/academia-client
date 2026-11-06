"use client";

import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PasswordChecklist, PasswordInput, SubmitButton } from "@/components/auth/parts";
import { Field } from "@/components/ui/kit";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/utils";
import { passwordError } from "@/lib/validation";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);

  if (!token || params.get("error")) {
    return (
      <div className="surface grid justify-items-center gap-4 p-9 text-center shadow-xl shadow-primary/5">
        <span className="grid size-16 place-items-center rounded-2xl bg-warning/18 text-warning">
          <LinkIcon className="size-8" />
        </span>
        <h1 className="h-section text-2xl">This reset link has expired</h1>
        <p className="text-base-content/70">Reset links work once and only for an hour. Ask for a new one and try again.</p>
        <Link href="/forgot-password" className="btn btn-primary w-full">
          Get a new link
        </Link>
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = { password: passwordError(password) ?? undefined, confirm: confirm === password ? undefined : "The two passwords do not match" };
    setErrors(found);
    if (found.password || found.confirm) return;
    setBusy(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
    if (error) {
      setBusy(false);
      toast.error(authErrorMessage(error, "We could not change your password. The link may have expired."));
      return;
    }
    toast.success("Password changed. Log in with your new password.");
    router.replace("/login");
  }

  return (
    <div className="surface p-7 shadow-xl shadow-primary/5 sm:p-9">
      <h1 className="h-section matra text-3xl">Choose a new password</h1>
      <p className="mt-3 text-base-content/65">Pick something you have not used elsewhere.</p>
      <form onSubmit={submit} noValidate className="mt-7 grid gap-5">
        <Field label="New password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} />
          <PasswordChecklist value={password} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={!!errors.confirm} />
        </Field>
        <SubmitButton busy={busy}>Change password</SubmitButton>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="surface skeleton h-96" />}>
      <ResetForm />
    </Suspense>
  );
}
