import type { Tone } from "@/components/ui/kit";

/** Same scale the server uses when it turns marks into a grade. */
export const GRADE_SCALE = [
  { min: 80, grade: "A+", point: 4 },
  { min: 75, grade: "A", point: 3.75 },
  { min: 70, grade: "A-", point: 3.5 },
  { min: 65, grade: "B+", point: 3.25 },
  { min: 60, grade: "B", point: 3 },
  { min: 55, grade: "B-", point: 2.75 },
  { min: 50, grade: "C+", point: 2.5 },
  { min: 45, grade: "C", point: 2.25 },
  { min: 40, grade: "D", point: 2 },
  { min: 0, grade: "F", point: 0 },
] as const;

export const gradeFor = (marks: number) => GRADE_SCALE.find((s) => marks >= s.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1]!;

export const gradeTone = (g?: string | null): Tone => (!g ? "info" : g.startsWith("A") ? "success" : g.startsWith("B") ? "primary" : g.startsWith("C") ? "warning" : g === "D" ? "secondary" : "error");
