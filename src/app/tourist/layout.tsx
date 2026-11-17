import type { ReactNode } from "react";
import Link from "next/link";
import { requireAccountType } from "@/lib/authz";
import { PageContainer } from "@/components/ui/page-container";
import { TouristWorkspaceNav } from "@/features/tourist/components/tourist-workspace";

export const instant = false;

export default async function TouristLayout({ children }: { children: ReactNode }) {
  await requireAccountType(["TOURIST"]);
  return (
    <main className="min-h-[70vh] bg-[#f7f8f5] py-8 sm:py-12">
      <PageContainer>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your Chitral journey</p><h1 className="mt-2 text-3xl font-medium tracking-tight">Tourist dashboard</h1></div>
          <Link href="/places" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90">Explore Chitral</Link>
        </div>
        <TouristWorkspaceNav />
        <div className="mt-7">{children}</div>
      </PageContainer>
    </main>
  );
}
