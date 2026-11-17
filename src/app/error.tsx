"use client";

import { ErrorState } from "@/components/ui/page-states";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[55vh] w-full max-w-3xl content-center gap-5 px-5 py-12 sm:px-8">
      <ErrorState title="We couldn’t load this page" description="Please try again. If the problem continues, return to the home page and try again later." />
      <button type="button" onClick={() => reset()} className="w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90">Try again</button>
    </main>
  );
}
