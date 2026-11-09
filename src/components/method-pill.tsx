import { methodColor, methodLabel, tint } from "@/lib/payments";

/** The name of a payment method on a soft tint of its colour, so the wallets can be told apart at a glance */
export function MethodPill({ method }: { method?: string | null }) {
  if (!method) return null;
  const color = methodColor(method);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: tint(color, 16) }}>
      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {methodLabel(method)}
    </span>
  );
}
