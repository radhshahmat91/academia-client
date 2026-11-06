"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { GoogleButton, IconInput, OrDivider, PasswordChecklist, PasswordInput, SubmitButton } from "@/components/auth/parts";
import { Avatar, Field } from "@/components/ui/kit";
import { authClient } from "@/lib/auth-client";
import { check, emailSchema, nameSchema, passwordError, photoSchema, type FieldErrors } from "@/lib/validation";
import { safeNext } from "@/lib/utils";

type Key = "name" | "email" | "photo" | "password";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next");
  const next = safeNext(rawNext);
  const [form, setForm] = useState({ name: "", email: "", photo: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<Key>>({});
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [busy, setBusy] = useState(false);

  const validators: Record<Key, (v: string) => string | undefined> = {
    name: (v) => check(nameSchema, v),
    email: (v) => check(emailSchema, v),
    photo: (v) => check(photoSchema, v),
    password: (v) => passwordError(v) ?? undefined,
  };
  const set = (k: Key) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    // The password rule is shown live; the other fields wait until the person leaves them
    if (touched[k] || k === "password") setErrors((er) => ({ ...er, [k]: validators[k](value) }));
  };
  const blur = (k: Key) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors((er) => ({ ...er, [k]: validators[k](form[k]) }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = Object.fromEntries((Object.keys(validators) as Key[]).map((k) => [k, validators[k](form[k])])) as FieldErrors<Key>;
    setErrors(found);
    setTouched({ name: true, email: true, photo: true, password: true });
    if (Object.values(found).some(Boolean)) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setBusy(true);
    const { error } = await authClient.signUp.email({ name: form.name.trim(), email: form.email.trim(), password: form.password, ...(form.photo.trim() ? { image: form.photo.trim() } : {}) });
    if (error) {
      setBusy(false);
      if (/already exists/i.test(error.message ?? "")) setErrors((er) => ({ ...er, email: "This email already has an account. Log in instead." }));
      toast.error(error.message || "We could not create your account");
      return;
    }
    toast.success("Account created. Please log in to continue.");
    router.replace(`/login${rawNext ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

  return (
    <div className="surface p-7 shadow-xl shadow-primary/5 sm:p-9">
      <h1 className="h-section matra text-3xl">Create your account</h1>
      <p className="mt-3 text-base-content/65">One account for courses, clubs, events and fees.</p>

      <form onSubmit={submit} noValidate className="mt-7 grid gap-5">
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <IconInput id="name" icon="user" autoComplete="name" placeholder="Tanvir Ahmed" value={form.name} onChange={set("name")} onBlur={blur("name")} invalid={!!errors.name} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <IconInput id="email" icon="mail" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} onBlur={blur("email")} invalid={!!errors.email} />
        </Field>
        <Field label="Photo URL" htmlFor="photo" optional error={errors.photo}>
          <div className="flex items-center gap-3">
            <Avatar name={form.name || "You"} src={!errors.photo ? form.photo : null} size={44} />
            <div className="min-w-0 flex-1">
              <IconInput id="photo" icon="image" type="url" autoComplete="off" placeholder="https://example.com/me.jpg" value={form.photo} onChange={set("photo")} onBlur={blur("photo")} invalid={!!errors.photo} />
            </div>
          </div>
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="new-password" placeholder="Create a password" value={form.password} onChange={set("password")} onBlur={blur("password")} invalid={!!errors.password} describedBy="pw-rules" />
          <div id="pw-rules">
            <PasswordChecklist value={form.password} />
          </div>
        </Field>
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>

      <div className="my-6">
        <OrDivider />
      </div>
      <GoogleButton next={next} label="Sign up with Google" />

      <p className="mt-7 text-center text-base-content/70">
        Already have an account?{" "}
        <Link href={`/login${rawNext ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="surface skeleton h-[40rem]" />}>
      <RegisterForm />
    </Suspense>
  );
}
