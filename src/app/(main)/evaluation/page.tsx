"use client";

import { CheckCircle2, ClipboardCheck, EyeOff, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, PageHeader, Pill, ProgressRing, Stars } from "@/components/ui/kit";
import { Modal } from "@/components/ui/modal";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { Photo } from "@/components/ui/photo";
import { send, useAction, useGet } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type Item = {
  enrollmentId: string;
  semester: { id: string; name: string; status: string };
  course: { id: string; code: string; title: string; category: string; image: string };
  section: { id: string; name: string; instructor: { name: string; title?: string } };
  done: boolean;
};
type Res = { questions: { key: string; text: string }[]; items: Item[] };

const WORDS = ["", "Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

function Form({ item, questions, onClose, onDone }: { item: Item; questions: Res["questions"]; onClose: () => void; onDone: (remaining: number) => void }) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const answered = questions.filter((q) => ratings[q.key]).length;
  const ready = answered === questions.length;
  const submit = useAction(() => send<{ ok: boolean; remaining: number }>("POST", "/evaluations", { sectionId: item.section.id, ratings, comment: comment.trim() || undefined }), {
    refresh: ["/evaluations", "/academics", "/dashboard", "/notifications"],
    onSuccess: (r) => onDone(r.remaining),
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${item.course.code} ${item.course.title}`}
      footer={
        <>
          <span className="mr-auto text-sm text-base-content/60">
            {answered} of {questions.length} answered
          </span>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Not now
          </button>
          <button type="button" className="btn btn-primary" disabled={!ready || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending && <span className="loading loading-spinner loading-sm" />} Submit evaluation
          </button>
        </>
      }
    >
      <p className="mb-5 flex items-start gap-2 rounded-xl bg-base-200/80 p-3 text-sm text-base-content/75">
        <EyeOff className="mt-0.5 size-4 shrink-0 text-primary" />
        Your answers are anonymous. Instructors see only the combined results for their section.
      </p>
      <ol className="grid gap-5">
        {questions.map((q, i) => (
          <li key={q.key} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
            <div>
              <p className="font-semibold">
                <span className="mr-2 text-base-content/45">{i + 1}.</span>
                {q.text}
              </p>
              <p className="mt-0.5 h-5 text-sm text-primary">{ratings[q.key] ? WORDS[ratings[q.key]!] : ""}</p>
            </div>
            <Stars label={q.text} value={ratings[q.key] ?? 0} onChange={(n) => setRatings((r) => ({ ...r, [q.key]: n }))} />
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <label htmlFor="eval-comment" className="mb-1.5 block font-semibold">
          Anything else you would like to say? <span className="font-normal text-base-content/55">(optional)</span>
        </label>
        <textarea id="eval-comment" rows={4} maxLength={1000} className="textarea w-full" placeholder="What worked well, and what could be better?" value={comment} onChange={(e) => setComment(e.target.value)} />
        <p className="mt-1 text-right text-xs text-base-content/50">{comment.length} / 1000</p>
      </div>
    </Modal>
  );
}

export default function EvaluationPage() {
  const { data, isLoading, isError, error, refetch } = useGet<Res>("/evaluations");
  const [active, setActive] = useState<Item | null>(null);

  if (isError) return <ErrorState message={error?.message} retry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <div className="grid gap-5">
        <div className="skeleton h-20 w-full max-w-lg rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );

  const total = data.items.length;
  const done = data.items.filter((i) => i.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="grid gap-7">
      <PageHeader title="Course evaluation" sub="Tell us how each course went. It takes about two minutes per course, and your answers stay anonymous." />

      {total === 0 ? (
        <EmptyState icon={<ClipboardCheck className="size-7" />} title="No evaluations are open" body="When a semester ends, its courses appear here. Your results unlock once every evaluation is submitted." action={<Link href="/my-courses" className="btn btn-primary btn-sm">See my courses</Link>} />
      ) : (
        <>
          <section className="surface flex flex-wrap items-center gap-6 p-6">
            <ProgressRing value={pct} size={88} stroke={9}>
              <span className="text-lg font-extrabold">{pct}%</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold">{done === total ? "All done. Thank you!" : `${total - done} of ${total} evaluations to go`}</p>
              <p className="mt-1 text-base-content/65">{done === total ? "Your results are unlocked on the semester courses page." : "Marks and grades for these courses stay locked until every evaluation is in."}</p>
            </div>
            {done === total && (
              <Link href="/my-courses" className="btn btn-primary">
                View my results
              </Link>
            )}
          </section>

          <Stagger className="grid gap-4 md:grid-cols-2" gap={0.06}>
            {data.items.map((it) => (
              <StaggerItem key={it.section.id} className="h-full">
                <article className={cn("surface flex h-full flex-col gap-4 p-5 sm:flex-row sm:items-center", it.done && "bg-base-200/40")}>
                  <Photo src={it.course.image} alt={it.course.title} ratio="size-20" className="shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="primary">{it.course.code}</Pill>
                      <span className="text-xs text-base-content/55">{it.semester.name}</span>
                    </div>
                    <h2 className="mt-1 text-lg leading-snug font-bold">{it.course.title}</h2>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-base-content/65">
                      <UserRound className="size-4" /> {it.section.instructor.name}
                    </p>
                  </div>
                  {it.done ? (
                    <Pill tone="success" className="self-start sm:self-center">
                      <CheckCircle2 className="size-3.5" /> Submitted
                    </Pill>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm self-start sm:self-center" onClick={() => setActive(it)}>
                      Evaluate
                    </button>
                  )}
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}

      {active && (
        <Form
          key={active.section.id}
          item={active}
          questions={data.questions}
          onClose={() => setActive(null)}
          onDone={(remaining) => {
            setActive(null);
            toast.success(remaining === 0 ? "That was the last one. Your results are now unlocked." : `Thank you for your feedback. ${remaining} to go.`);
          }}
        />
      )}
    </div>
  );
}
