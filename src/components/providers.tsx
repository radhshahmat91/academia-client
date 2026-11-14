"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { ConfirmProvider } from "@/components/ui/modal";

export type Theme = "shapla" | "shapla-night";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "shapla", toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

/** The login page loads the next page in full and leaves the name here, so the welcome message appears on the page that opens. */
function WelcomeToast() {
  useEffect(() => {
    try {
      const name = sessionStorage.getItem("ac-welcome");
      if (name === null) return;
      sessionStorage.removeItem("ac-welcome");
      toast.success(name ? `Welcome back, ${name}` : "Welcome back");
    } catch {
      /* no storage: no message */
    }
  }, []);
  return null;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("shapla");
  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "shapla-night" ? "shapla-night" : "shapla");
  }, []);
  const toggle = useCallback(() => {
    setTheme((cur) => {
      const next: Theme = cur === "shapla" ? "shapla-night" : "shapla";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("ac-theme", next);
      } catch {}
      return next;
    });
  }, []);
  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
      <Toaster theme={theme === "shapla-night" ? "dark" : "light"} position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-sans)", borderRadius: "14px" } }} />
      <WelcomeToast />
    </ThemeCtx.Provider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: (n, err) => n < 1 && !(err as { status?: number }).status, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
