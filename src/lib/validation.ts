import { z } from "zod";

export const passwordRules = [
  { id: "len", label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
] as const;

/** The first password rule that fails, as a sentence for the inline error. */
export function passwordError(p: string): string | null {
  if (!p) return "Enter a password";
  if (p.length < 6) return "Password must be at least 6 characters";
  if (!/[A-Z]/.test(p)) return "Password must have at least one uppercase letter";
  if (!/[a-z]/.test(p)) return "Password must have at least one lowercase letter";
  return null;
}

export const emailSchema = z.string().trim().min(1, "Enter your email address").email("Enter a valid email address");
export const nameSchema = z.string().trim().min(2, "Your name needs at least 2 letters").max(80, "That name is too long");
export const photoSchema = z.union([z.literal(""), z.string().trim().url("Enter a full link that starts with https://")]);

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

/** Runs a zod schema over one value and returns its first message. */
export const check = (schema: z.ZodTypeAny, value: unknown): string | undefined => {
  const r = schema.safeParse(value);
  return r.success ? undefined : r.error.issues[0]?.message;
};
