"use client";

import { KeyRound, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaFacebook, FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, ErrorState, Field, PageHeader, Pill } from "@/components/ui/kit";
import { send, useAction, useGet, useRefresh } from "@/hooks/use-api";
import { authClient } from "@/lib/auth-client";
import type { Me } from "@/lib/types";
import { check, nameSchema, passwordError, photoSchema } from "@/lib/validation";
import { cn, fmtDate } from "@/lib/utils";

const linkSchema = photoSchema;
const bioSchema = z.string().max(400, "Keep your bio under 400 characters");

type Form = { name: string; image: string; bio: string; phone: string; department: string; batch: string; facebook: string; linkedin: string; github: string; x: string };

function ProfileForm({ me }: { me: Me }) {
  const router = useRouter();
  const refresh = useRefresh();
  const initial: Form = { name: me.name, image: me.image ?? "", bio: me.bio ?? "", phone: me.phone ?? "", department: me.department ?? "", batch: me.batch ?? "", facebook: me.social?.facebook ?? "", linkedin: me.social?.linkedin ?? "", github: me.social?.github ?? "", x: me.social?.x ?? "" };
  const [f, setF] = useState<Form>(initial);
  const [interests, setInterests] = useState<string[]>(me.interests ?? []);
  const [tag, setTag] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof Form | "tag", string>>>({});
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF((v) => ({ ...v, [k]: e.target.value }));
    setErrors((v) => ({ ...v, [k]: undefined }));
  };
  const dirty = JSON.stringify(f) !== JSON.stringify(initial) || interests.join("|") !== (me.interests ?? []).join("|");

  const save = useAction(
    async () => {
      const body = {
        name: f.name.trim(),
        image: f.image.trim(),
        bio: f.bio.trim(),
        phone: f.phone.trim(),
        department: f.department.trim(),
        batch: f.batch.trim(),
        interests,
        social: { facebook: f.facebook.trim(), linkedin: f.linkedin.trim(), github: f.github.trim(), x: f.x.trim() },
      };
      // BetterAuth owns the name and photo in the session, so update it first, then save the rest of the profile
      const res = await authClient.updateUser({ name: body.name, image: body.image || null });
      if (res?.error) throw new Error(res.error.message ?? "Could not update your account");
      return send<Me>("PATCH", "/me", body);
    },
    {
      success: "Your profile was saved",
      onSuccess: () => {
        void refresh("/me", "/dashboard", "/students", "/chat");
        router.refresh();
      },
    },
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = {
      name: check(nameSchema, f.name),
      image: check(photoSchema, f.image),
      bio: check(bioSchema, f.bio),
      phone: f.phone.length > 24 ? "Phone number is too long" : undefined,
      department: f.department.length > 60 ? "Keep this under 60 characters" : undefined,
      batch: f.batch.length > 20 ? "Keep this under 20 characters" : undefined,
      facebook: check(linkSchema, f.facebook),
      linkedin: check(linkSchema, f.linkedin),
      github: check(linkSchema, f.github),
      x: check(linkSchema, f.x),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    save.mutate();
  }

  function addTag() {
    const t = tag.trim();
    if (!t) return;
    if (t.length > 30) return setErrors((v) => ({ ...v, tag: "Keep each interest under 30 characters" }));
    if (interests.length >= 8) return setErrors((v) => ({ ...v, tag: "You can add up to 8 interests" }));
    if (!interests.some((i) => i.toLowerCase() === t.toLowerCase())) setInterests([...interests, t]);
    setTag("");
    setErrors((v) => ({ ...v, tag: undefined }));
  }

  const input = (k: keyof Form) => cn("input w-full", errors[k] && "input-error");
  const socials = [
    { k: "facebook" as const, label: "Facebook", Icon: FaFacebook, ph: "https://facebook.com/your.name" },
    { k: "linkedin" as const, label: "LinkedIn", Icon: FaLinkedin, ph: "https://linkedin.com/in/your-name" },
    { k: "github" as const, label: "GitHub", Icon: FaGithub, ph: "https://github.com/your-name" },
    { k: "x" as const, label: "X", Icon: FaXTwitter, ph: "https://x.com/your_name" },
  ];

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      <section className="surface grid gap-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={f.name} src={f.image} size={88} />
          <div className="min-w-0">
            <h2 className="h-section text-xl">{f.name || "Your name"}</h2>
            <p className="text-sm text-base-content/60">{me.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {me.studentId && <Pill tone="primary">ID {me.studentId}</Pill>}
              {!!me.waiverPercent && <Pill tone="success">{me.waiverPercent}% tuition waiver</Pill>}
              {me.createdAt && <span className="text-sm text-base-content/50">Joined {fmtDate(me.createdAt)}</span>}
            </div>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="p-name" error={errors.name}>
            <input id="p-name" className={input("name")} value={f.name} onChange={set("name")} autoComplete="name" />
          </Field>
          <Field label="Photo link" htmlFor="p-image" error={errors.image} hint="A full link to an image, starting with https://" optional>
            <input id="p-image" className={input("image")} value={f.image} onChange={set("image")} placeholder="https://" inputMode="url" />
          </Field>
          <Field label="Department" htmlFor="p-dept" error={errors.department} optional>
            <input id="p-dept" className={input("department")} value={f.department} onChange={set("department")} />
          </Field>
          <Field label="Batch" htmlFor="p-batch" error={errors.batch} optional>
            <input id="p-batch" className={input("batch")} value={f.batch} onChange={set("batch")} placeholder="Spring 2025" />
          </Field>
          <Field label="Phone" htmlFor="p-phone" error={errors.phone} hint="Only you and the administration can see this." optional>
            <input id="p-phone" className={input("phone")} value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" />
          </Field>
        </div>
        <Field label="About you" htmlFor="p-bio" error={errors.bio} hint={`${f.bio.length} / 400`} optional>
          <textarea id="p-bio" rows={4} className={cn("textarea w-full", errors.bio && "textarea-error")} value={f.bio} onChange={set("bio")} placeholder="What are you studying, building or curious about?" />
        </Field>
      </section>

      <section className="surface grid gap-4 p-6 sm:p-8">
        <h2 className="h-section text-xl">Interests</h2>
        <ul className="flex min-h-9 flex-wrap gap-2" aria-label="Your interests">
          {interests.map((i) => (
            <li key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pr-1.5 pl-3.5 text-sm font-semibold text-primary">
              {i}
              <button type="button" onClick={() => setInterests(interests.filter((x) => x !== i))} aria-label={`Remove ${i}`} className="grid size-5 place-items-center rounded-full hover:bg-primary/15">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
          {interests.length === 0 && <li className="text-sm text-base-content/55">Add a few topics so classmates can find you.</li>}
        </ul>
        <Field error={errors.tag} hint="Press Enter to add. Up to 8.">
          <div className="flex gap-2">
            <input
              aria-label="Add an interest"
              className="input w-full"
              value={tag}
              maxLength={40}
              placeholder="e.g. robotics, photography, debate"
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button type="button" className="btn btn-outline" onClick={addTag}>
              <Plus className="size-4" /> Add
            </button>
          </div>
        </Field>
      </section>

      <section className="surface grid gap-5 p-6 sm:p-8">
        <h2 className="h-section text-xl">Social links</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {socials.map(({ k, label, Icon, ph }) => (
            <Field key={k} label={<span className="inline-flex items-center gap-2"><Icon className="size-4" /> {label}</span>} htmlFor={`p-${k}`} error={errors[k]} optional>
              <input id={`p-${k}`} className={input(k)} value={f[k]} onChange={set(k)} placeholder={ph} inputMode="url" />
            </Field>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-base-content/10 bg-base-100/90 p-3 shadow-lg backdrop-blur">
        <p className="mr-auto pl-2 text-sm text-base-content/60">{dirty ? "You have unsaved changes." : "Everything is saved."}</p>
        <button type="button" className="btn btn-ghost" disabled={!dirty || save.isPending} onClick={() => { setF(initial); setInterests(me.interests ?? []); setErrors({}); }}>
          Reset
        </button>
        <button type="submit" className="btn btn-primary" disabled={!dirty || save.isPending}>
          {save.isPending && <span className="loading loading-spinner loading-sm" />} Save profile
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [errs, setErrs] = useState<{ cur?: string; next?: string; again?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = {
      cur: cur ? undefined : "Enter your current password",
      next: passwordError(next) ?? (next === cur ? "Your new password must be different from the current one" : undefined),
      again: again === next ? undefined : "The two passwords do not match",
    };
    setErrs(v);
    if (v.cur || v.next || v.again) return;
    setBusy(true);
    try {
      const { error } = await authClient.changePassword({ currentPassword: cur, newPassword: next, revokeOtherSessions: true });
      if (error) {
        const msg = error.message ?? "";
        if (/credential|not found/i.test(msg)) toast.error("This account signs in with Google, so it has no password to change.");
        else if (/invalid|incorrect|wrong/i.test(msg)) {
          setErrs({ cur: "That is not your current password" });
          toast.error("That is not your current password");
        } else toast.error(msg || "Could not change your password");
        return;
      }
      toast.success("Password changed. Your other devices were signed out.");
      setCur("");
      setNext("");
      setAgain("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="surface grid gap-5 p-6 sm:p-8">
      <h2 className="h-section flex items-center gap-2 text-xl">
        <KeyRound className="size-5 text-primary" /> Change password
      </h2>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Current password" htmlFor="pw-cur" error={errs.cur}>
          <input id="pw-cur" type="password" className={cn("input w-full", errs.cur && "input-error")} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New password" htmlFor="pw-new" error={errs.next} hint="6+ characters with an uppercase and a lowercase letter">
          <input id="pw-new" type="password" className={cn("input w-full", errs.next && "input-error")} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Repeat new password" htmlFor="pw-again" error={errs.again}>
          <input id="pw-again" type="password" className={cn("input w-full", errs.again && "input-error")} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
        </Field>
      </div>
      <div>
        <button type="submit" className="btn btn-outline" disabled={busy || !cur || !next}>
          {busy && <span className="loading loading-spinner loading-sm" />} Update password
        </button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const { data, isLoading, isError, error, refetch } = useGet<Me>("/me");
  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PageHeader
        title="My profile"
        sub="This is what classmates see when they open your profile."
        actions={
          data && (
            <Link href={`/students/${data.id}`} className="btn btn-outline btn-sm">
              See how it looks
            </Link>
          )
        }
      />
      {isLoading || !data ? <div className="skeleton h-96 rounded-3xl" /> : <ProfileForm key={`${data.id}-${data.name}-${data.image}`} me={data} />}
      <PasswordForm />
    </div>
  );
}
