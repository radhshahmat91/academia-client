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
