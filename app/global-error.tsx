"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 font-sans">
        <h2 className="text-xl font-semibold">Application error</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>Try again</Button>
      </body>
    </html>
  );
}
