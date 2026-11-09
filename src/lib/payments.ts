import { pretty } from "./utils";

/**
 * How each payment method is written on receipts, in payment history and in the admin panel.
 * "wallet" is what payments were called before bKash, Nagad and Rocket were listed one by one, so older receipts still read well.
 */
export const METHOD_LABEL: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  card: "Bank card",
  bank: "Bank transfer",
  wallet: "Mobile wallet",
};

export const methodLabel = (method?: string | null) => (method ? (METHOD_LABEL[method] ?? pretty(method)) : "");

/** One colour per method, shared by the checkout tiles and the admin pages so a wallet looks the same everywhere. No logos, only colour. */
const METHOD_COLOR: Record<string, string> = {
  bkash: "#e2136e",
  nagad: "#f7941d",
  rocket: "#8c3494",
  card: "var(--color-primary)",
  bank: "var(--color-info)",
  wallet: "var(--color-secondary)",
};
export const methodColor = (method?: string | null) => (method && METHOD_COLOR[method]) || "var(--color-primary)";

/** A soft see-through version of a colour, for backgrounds that sit behind normal text */
export const tint = (color: string, percent: number) => `color-mix(in oklab, ${color} ${percent}%, transparent)`;
