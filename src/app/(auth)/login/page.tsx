"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { GoogleButton, IconInput, OrDivider, PasswordInput, SubmitButton } from "@/components/auth/parts";
import { Field } from "@/components/ui/kit";
import { authClient } from "@/lib/auth-client";
import { check, emailSchema, type FieldErrors } from "@/lib/validation";
import { authErrorMessage, safeNext } from "@/lib/utils";

const DEMOS = [
  { label: "Demo student", email: "student@academiaconnect.test", password: "Student@123" },
  { label: "Demo admin", email: "admin@academiaconnect.test", password: "Admin@123" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"email" | "password">>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = { email: check(emailSchema, email), password: password ? undefined : "Enter your password" };
    setErrors(found);
    if (found.email || found.password) return;
    setBusy(true);
    const { data, error } = await authClient.signIn.email({ email: email.trim(), password });
    if (error || !data) {
      setBusy(false);
      toast.error(authErrorMessage(error, "Email or password is not correct"));
      return;
    }
    toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="surface p-7 shadow-xl shadow-primary/5 sm:p-9">
      <h1 className="h-section matra text-3xl">Welcome back</h1>
      <p className="mt-3 text-base-content/65">Log in to see your courses, messages and fees.</p>

      <form onSubmit={submit} noValidate className="mt-7 grid gap-5">
        <Field label="Email" htmlFor="email" error={errors.email}>
          <IconInput id="email" icon="mail" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} />
        </Field>
        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="link link-primary text-sm font-semibold no-underline hover:underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton busy={busy}>Log in</SubmitButton>
      </form>

      <div className="my-6">
        <OrDivider />
      </div>
      <GoogleButton next={next} />

      <p className="mt-7 text-center text-base-content/70">
        New to AcademiaConnect?{" "}
        <Link href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-primary hover:underline">
          Create an account
        </Link>
      </p>

      <details className="mt-6 rounded-xl border border-dashed border-base-content/20 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold">Try a demo account</summary>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMOS.map((d) => (
            <button
              key={d.email}
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => {
                setEmail(d.email);
                setPassword(d.password);
                setErrors({});
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-base-content/55">Fills in the form with sample data.</p>
      </details>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="surface skeleton h-[34rem]" />}>
      <LoginForm />
    </Suspense>
  );
}
