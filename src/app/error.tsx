"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/kit";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-lg">
        <ErrorState message="Something unexpected went wrong on our side. Your data is safe. Try again, and if it keeps happening, contact us." retry={reset} />
      </div>
    </main>
  );
}
