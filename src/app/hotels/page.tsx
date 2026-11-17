import Link from "next/link";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/page-states";
import { HotelCard } from "@/features/hotels/components/hotel-card";

export const instant = false;
type Search = Promise<{ q?: string; location?: string }>;

export default async function HotelsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const location = params.location?.trim().slice(0, 120) ?? "";
  const where = {
    application: { status: ApplicationStatus.APPROVED },
    ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}),
    ...(query ? { OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { summary: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
      { amenities: { hasSome: [query] } },
    ] } : {}),
  };
  const hotels = await prisma.hotel.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } }, roomTypes: { select: { pricePerNight: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }] });
  return <main className="py-12 sm:py-16"><PageContainer>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Places to stay</p><h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Hotels in Chitral</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Explore approved locally managed stays and contact the hotel directly to ask about your visit.</p>
    <form action="/hotels" method="get" className="mt-7 grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[1fr_240px_auto]"><input name="q" defaultValue={query} placeholder="Search hotels or amenities" aria-label="Search hotels" className="h-11 rounded-xl border border-border px-3 text-sm" /><input name="location" defaultValue={location} placeholder="Town or area" aria-label="Filter by location" className="h-11 rounded-xl border border-border px-3 text-sm" /><button className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white">Search stays</button></form>
    <p className="mt-6 text-sm text-muted">{hotels.length} approved {hotels.length === 1 ? "hotel" : "hotels"}</p>
    {hotels.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{hotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}</div> : <EmptyState className="mt-4" title="No approved hotels yet" description="Try a different search or location. Hotels appear here after an owner application is approved." />}
    <p className="mt-8 text-sm text-muted">Own a hotel? <Link href="/register/hotel" className="font-semibold text-primary hover:underline">Apply to list it</Link></p>
  </PageContainer></main>;
}
