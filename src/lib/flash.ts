const KEY = "ac-flash";

/**
 * A message for the next page.
 *
 * Logging in and signing out load the next page in full, so nothing from the old page (cached pages, pre-loaded links) can be
 * reused. A full load also wipes an ordinary toast, so the message waits here and the next page shows it.
 */
export function flash(message: string) {
  try {
    sessionStorage.setItem(KEY, message);
  } catch {
    /* private mode without storage: the message is simply skipped */
  }
}

/** Takes the waiting message (once) or returns null. */
export function takeFlash(): string | null {
  try {
    const message = sessionStorage.getItem(KEY);
    if (message !== null) sessionStorage.removeItem(KEY);
    return message;
  } catch {
    return null;
  }
}
