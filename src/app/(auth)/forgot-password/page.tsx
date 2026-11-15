"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { IconInput, SubmitButton } from "@/components/auth/parts";
import { Field } from "@/components/ui/kit";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, NETWORK_MESSAGE, toastMs } from "@/lib/utils";
import { check, emailSchema } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = check(emailSchema, email);
    setError(found);
    if (found) return;
    setBusy(true);
    const attempt = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" }).catch(() => null);
    setBusy(false);
    if (!attempt || attempt.error) {
      const message = attempt?.error ? authErrorMessage(attempt.error, "We could not send the reset link. Please try again.") : NETWORK_MESSAGE;
      toast.error(message, { duration: toastMs(message) });
      return;
    }
    setSent(true);
  }

  return (
    <div className="surface p-7 shadow-xl shadow-primary/5 sm:p-9">
      {sent ? (
        <div className="grid justify-items-center gap-4 py-4 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-success/12 text-success">
            <MailCheck className="size-8" />
          </span>
          <h1 className="h-section text-2xl">Check your email</h1>
          <p className="text-base-content/70">
            If <strong>{email.trim()}</strong> has an account, a link to choose a new password is on its way. It works for one hour.
          </p>
          <Link href="/login" className="btn btn-primary mt-2 w-full">
            Back to log in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="h-section matra text-3xl">Forgot your password?</h1>
          <p className="mt-3 text-base-content/65">Enter your email and we will send you a link to choose a new one.</p>
          <form onSubmit={submit} noValidate className="mt-7 grid gap-5">
            <Field label="Email" htmlFor="email" error={error}>
              <IconInput id="email" icon="mail" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} />
            </Field>
            <SubmitButton busy={busy}>Send reset link</SubmitButton>
          </form>
          <p className="mt-7 text-center text-base-content/70">
            Remembered it?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
