import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/page-states";
import { GuideCard } from "@/features/guides/components/guide-card";

export const instant = false;
type Search = Promise<{ q?: string; region?: string }>;

export default async function GuidesPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const region = params.region?.trim().slice(0, 100) ?? "";
  const where = {
    application: { status: ApplicationStatus.APPROVED },
    ...(region ? { regionsCovered: { has: region } } : {}),
    ...(query ? { OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { biography: { contains: query, mode: "insensitive" as const } },
      { specialties: { hasSome: [query] } },
      { services: { hasSome: [query] } },
      { languages: { hasSome: [query] } },
    ] } : {}),
  };
  const guides = await prisma.guideProfile.findMany({ where, include: { user: { select: { image: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], take: 60 });
  return <main className="py-12 sm:py-16"><PageContainer>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Local knowledge matters</p><h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Find a local guide</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Discover approved guides, their experience, languages, specialties, and services. Contact them directly to plan your visit.</p>
    <form action="/guides" method="get" className="mt-7 grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[1fr_240px_auto]"><input name="q" defaultValue={query} placeholder="Search skills, services, languages" aria-label="Search guides" className="h-11 rounded-xl border border-border px-3 text-sm" /><input name="region" defaultValue={region} placeholder="Exact region name" aria-label="Filter by region" className="h-11 rounded-xl border border-border px-3 text-sm" /><button className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white">Search guides</button></form>
    <p className="mt-6 text-sm text-muted">{guides.length} approved {guides.length === 1 ? "guide" : "guides"}</p>
    {guides.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div> : <EmptyState className="mt-4" title="No approved guide profiles yet" description="Try another search or region. Guide profiles appear after an admin approves the application." />}
  </PageContainer></main>;
}
