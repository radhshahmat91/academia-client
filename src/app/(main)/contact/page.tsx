"use client";

import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Field } from "@/components/ui/kit";
import { Reveal } from "@/components/ui/motion";
import { Photo } from "@/components/ui/photo";
import { useAction } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { photo } from "@/lib/media";
import { check, emailSchema, nameSchema, type FieldErrors } from "@/lib/validation";
import { z } from "zod";

type Key = "name" | "email" | "subject" | "message";
const subjectSchema = z.string().trim().min(3, "Add a short subject").max(120, "Keep the subject under 120 characters");
const messageSchema = z.string().trim().min(10, "Write at least a sentence").max(2000, "Keep the message under 2,000 characters");
const checks: Record<Key, (v: string) => string | undefined> = {
  name: (v) => check(nameSchema, v),
  email: (v) => check(emailSchema, v),
  subject: (v) => check(subjectSchema, v),
  message: (v) => check(messageSchema, v),
};

const INFO = [
  { icon: Mail, title: "Email", text: "help@academiaconnect.test" },
  { icon: Phone, title: "Phone", text: "+880 2 5555 0100" },
  { icon: MapPin, title: "Help desk", text: "Student services building, ground floor, Dhaka" },
  { icon: Clock, title: "Hours", text: "Sunday to Thursday, 9 am to 5 pm" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors<Key>>({});
  const send = useAction((body: typeof form) => api("/contact", { method: "POST", body, auth: false }), {
    success: "Message sent. We will reply to your email soon.",
    onSuccess: () => {
      setForm({ name: "", email: "", subject: "", message: "" });
      setErrors({});
    },
  });

  const set = (k: Key) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: checks[k](e.target.value) }));
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = Object.fromEntries((Object.keys(checks) as Key[]).map((k) => [k, checks[k](form[k])])) as FieldErrors<Key>;
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    send.mutate(form);
  }

  return (
    <div className="wrap py-14 sm:py-20">
      <Reveal>
        <h1 className="h-section matra max-w-2xl text-4xl sm:text-5xl">Contact us</h1>
        <p className="mt-4 max-w-2xl text-lg text-base-content/70">Question about registration, fees or your account? Send a message and the right office will reply by email.</p>
      </Reveal>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        <Reveal delay={0.05}>
          <form onSubmit={submit} noValidate className="surface grid gap-5 p-6 sm:p-9">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your name" htmlFor="c-name" error={errors.name}>
                <input id="c-name" className={`input w-full ${errors.name ? "input-error" : ""}`} autoComplete="name" value={form.name} onChange={set("name")} placeholder="Tanvir Ahmed" />
              </Field>
              <Field label="Email" htmlFor="c-email" error={errors.email}>
                <input id="c-email" type="email" className={`input w-full ${errors.email ? "input-error" : ""}`} autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
              </Field>
            </div>
            <Field label="Subject" htmlFor="c-subject" error={errors.subject}>
              <input id="c-subject" className={`input w-full ${errors.subject ? "input-error" : ""}`} value={form.subject} onChange={set("subject")} placeholder="How can we help?" />
            </Field>
            <Field label="Message" htmlFor="c-message" error={errors.message} hint={`${form.message.length} / 2000`}>
              <textarea id="c-message" rows={6} className={`textarea w-full ${errors.message ? "textarea-error" : ""}`} value={form.message} onChange={set("message")} placeholder="Tell us a little about what you need" />
            </Field>
            <button type="submit" className="btn btn-primary justify-self-start" disabled={send.isPending}>
              {send.isPending ? <span className="loading loading-spinner loading-sm" /> : <Send className="size-4" />}
              Send message
            </button>
          </form>
        </Reveal>
        <Reveal delay={0.15} className="grid content-start gap-5">
          <Photo src={photo("dhaka-city", 1000)} alt="The Dhaka skyline at dusk" ratio="aspect-[16/9]" className="rounded-3xl" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {INFO.map((i) => (
              <li key={i.title} className="surface flex gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <i.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold">{i.title}</p>
                  <p className="text-sm break-words text-base-content/70">{i.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
