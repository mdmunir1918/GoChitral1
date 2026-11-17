import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/page-states";
import { PlaceCard } from "@/features/directory/components/listing-cards";
import { placeCategoryLabels } from "@/features/directory/data";
import { PlaceCategory } from "@prisma/client";

export const instant = false;
const pageSize = 12;
type Search = Promise<{ q?: string; category?: string; location?: string; page?: string }>;

export default async function PlacesDirectoryPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const location = params.location?.trim().slice(0, 120) ?? "";
  const category = params.category === "FOOD" ? "FOOD" : Object.values(PlaceCategory).includes(params.category as PlaceCategory) ? params.category as PlaceCategory : undefined;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const where = {
    status: "APPROVED" as const,
    ...(category === "FOOD" ? { category: { in: [PlaceCategory.RESTAURANT, PlaceCategory.FOOD_SPOT] } } : category ? { category } : {}),
    ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}),
    ...(query ? { OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { summary: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
      { cuisine: { contains: query, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [places, total] = await Promise.all([
    prisma.place.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.place.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const search = new URLSearchParams();
  if (query) search.set("q", query);
  if (location) search.set("location", location);
  if (category) search.set("category", category);

  return <main className="py-12 sm:py-16"><PageContainer>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Discover Chitral</p>
    <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Places and food spots</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Browse approved destinations, attractions, restaurants, and visitor places.</p></div><Link href="/places/suggest" className="text-sm font-semibold text-primary hover:underline">Suggest a place</Link></div>
    <form action="/places" method="get" className="mt-7 grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[1fr_200px_200px_auto]">
      <input name="q" defaultValue={query} placeholder="Search places or food" aria-label="Search places" className="h-11 rounded-xl border border-border px-3 text-sm" />
      <select name="category" defaultValue={category ?? ""} aria-label="Filter by category" className="h-11 rounded-xl border border-border bg-white px-3 text-sm"><option value="">All categories</option><option value="FOOD">Food & dining</option>{Object.entries(placeCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <input name="location" defaultValue={location} placeholder="Location" aria-label="Filter by location" className="h-11 rounded-xl border border-border px-3 text-sm" />
      <button className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">Filter</button>
    </form>
    <p className="mt-6 text-sm text-muted">{total} approved {total === 1 ? "place" : "places"}</p>
    {places.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{places.map((place) => <PlaceCard key={place.id} place={place} />)}</div> : <EmptyState className="mt-4" title="No approved places match yet" description="Try another search or category. New directory entries appear here after review." />}
    {pageCount > 1 && <nav aria-label="Directory pages" className="mt-8 flex justify-center gap-3 text-sm">{page > 1 && <Link className="rounded-full border border-border px-4 py-2" href={`/places?${search}&page=${page - 1}`}>Previous</Link>}<span className="px-3 py-2 text-muted">Page {page} of {pageCount}</span>{page < pageCount && <Link className="rounded-full border border-border px-4 py-2" href={`/places?${search}&page=${page + 1}`}>Next</Link>}</nav>}
  </PageContainer></main>;
}
