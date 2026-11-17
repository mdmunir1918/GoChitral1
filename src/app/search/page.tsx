import Link from "next/link";
import { ArrowRight, Compass, Search as SearchIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/page-states";
import { PageContainer } from "@/components/ui/page-container";
import { discoveryPlaces, searchDiscovery } from "@/features/homepage/data";
import { prisma } from "@/lib/prisma";
import { ActivityCard, PlaceCard } from "@/features/directory/components/listing-cards";

export const instant = false;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 120);
  const [places, activities, popularPlaces] = await Promise.all([
    query ? prisma.place.findMany({ where: { status: "APPROVED", OR: [
      { name: { contains: query, mode: "insensitive" } }, { summary: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } }, { location: { contains: query, mode: "insensitive" } },
      { cuisine: { contains: query, mode: "insensitive" } },
    ] }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, take: 24 }) : Promise.resolve([]),
    query ? prisma.activity.findMany({ where: { status: "APPROVED", OR: [
      { name: { contains: query, mode: "insensitive" } }, { summary: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } }, { location: { contains: query, mode: "insensitive" } },
    ] }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, take: 24 }) : Promise.resolve([]),
    !query ? prisma.place.findMany({ where: { status: "APPROVED" }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: { createdAt: "desc" }, take: 2 }) : Promise.resolve([]),
  ]);
  const results = searchDiscovery(query);
  const total = places.length + activities.length + results.length;

  return (
    <main className="py-12 sm:py-16">
      <PageContainer>
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Discover Chitral</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Find a place to begin</h1>
          <form action="/search" method="get" className="mt-6 flex flex-col gap-2 rounded-2xl border border-border bg-white p-2 shadow-sm sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 px-3 text-muted"><SearchIcon size={18} aria-hidden="true" /><span className="sr-only">Search places</span><input name="q" defaultValue={q} placeholder="Search valleys, towns, or experiences" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted" /></label>
            <button className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90" type="submit">Search</button>
          </form>
        </div>

        <div className="mt-10">
          {query ? (
            <>
              <p className="mb-5 text-sm text-muted">{total} {total === 1 ? "result" : "results"} for <span className="font-semibold text-foreground">“{query}”</span></p>
              {total ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {places.map((place) => <PlaceCard key={`place-${place.id}`} place={place} />)}
                {activities.map((activity) => <ActivityCard key={`activity-${activity.id}`} activity={activity} />)}
                {results.map((place) => {
                  const Icon = place.icon;
                  return <Link key={place.slug} href={`/places/${place.slug}`} className="group rounded-2xl border border-border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon size={18} aria-hidden="true" /></span>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary">{place.type}</p>
                    <h2 className="mt-2 text-lg font-semibold">{place.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">{place.summary}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Explore <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                  </Link>;
                })}
              </div> : <EmptyState title="No places found" description="Try a broader search such as “valley”, “town”, or “culture”." />}
            </>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {popularPlaces.map((place) => <PlaceCard key={place.id} place={place} />)}
              {discoveryPlaces.slice(0, 2).map((place) => <Link key={place.slug} href={`/places/${place.slug}`} className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 transition hover:shadow-md"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Compass size={18} aria-hidden="true" /></span><span><span className="font-semibold">{place.name}</span><span className="mt-1 block text-sm leading-6 text-muted">{place.summary}</span></span></Link>)}
            </div>
          )}
        </div>
      </PageContainer>
    </main>
  );
}
