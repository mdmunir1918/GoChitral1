import Link from "next/link";
import type { ReactNode } from "react";
import { Mountain } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-[65vh] items-center px-5 py-10 text-foreground sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 text-sm font-semibold">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-white">
            <Mountain size={18} aria-hidden="true" />
          </span>
          GoChitral
        </Link>
        <Card className="rounded-3xl p-6 sm:p-9">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          <div className="mt-7">{children}</div>
        </Card>
        <p className="mt-6 text-center text-xs leading-5 text-muted">
          GoChitral helps visitors discover local places and connect directly with providers.
        </p>
      </div>
    </main>
  );
}
