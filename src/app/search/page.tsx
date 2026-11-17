import { Search as SearchIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/page-states";
import { PageContainer } from "@/components/ui/page-container";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus, PlaceCategory } from "@prisma/client";
import { ActivityCard, PlaceCard } from "@/features/directory/components/listing-cards";
import { HotelCard } from "@/features/hotels/components/hotel-card";
import { GuideCard } from "@/features/guides/components/guide-card";
import { ListingMap, type MapPoint } from "@/features/maps/components/listing-map";
import { fullTextListingIds, nearbyListingIds } from "@/features/search/database-search";
import { NearbySearchButton } from "@/features/search/components/nearby-search-button";

export const instant = false;
type SearchParams = Promise<{ q?: string; category?: string; location?: string; minPrice?: string; maxPrice?: string; lat?: string; lon?: string; radius?: string }>;
const categories = ["all", "places", "restaurants", "activities", "hotels", "guides"] as const;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const category = categories.includes(params.category as typeof categories[number]) ? params.category! : "all";
  const location = params.location?.trim().slice(0, 120) ?? "";
  const minPrice = parsePrice(params.minPrice);
  const maxPrice = parsePrice(params.maxPrice);
  const latitude = parseCoordinate(params.lat, -90, 90);
  const longitude = parseCoordinate(params.lon, -180, 180);
  const radius = parseRadius(params.radius);
  const [textIds, nearIds] = await Promise.all([
    fullTextListingIds(query, category),
    latitude !== undefined && longitude !== undefined ? nearbyListingIds(latitude, longitude, radius, category) : Promise.resolve(null),
  ]);
  const ids = nearIds ? { placeIds: intersect(textIds.placeIds, nearIds.placeIds, Boolean(query)), activityIds: intersect(textIds.activityIds, nearIds.activityIds, Boolean(query)), hotelIds: intersect(textIds.hotelIds, nearIds.hotelIds, Boolean(query)), guideIds: [] as string[] } : textIds;
  const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined;
  const priceRoom = hasPriceFilter ? { some: { pricePerNight: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } } } : undefined;
  const restaurantWhere = { in: [PlaceCategory.RESTAURANT, PlaceCategory.FOOD_SPOT] };
  const [places, activities, hotels, guides] = await Promise.all([
    (category === "all" || category === "places" || category === "restaurants") ? prisma.place.findMany({ where: { status: "APPROVED", id: query ? { in: ids.placeIds } : undefined, category: category === "restaurants" ? restaurantWhere : undefined, location: location ? { contains: location, mode: "insensitive" } : undefined }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: { name: "asc" }, take: 60 }) : Promise.resolve([]),
    (category === "all" || category === "activities") ? prisma.activity.findMany({ where: { status: "APPROVED", id: query ? { in: ids.activityIds } : undefined, location: location ? { contains: location, mode: "insensitive" } : undefined }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: { name: "asc" }, take: 60 }) : Promise.resolve([]),
    (category === "all" || category === "hotels") ? prisma.hotel.findMany({ where: { application: { status: ApplicationStatus.APPROVED }, id: query ? { in: ids.hotelIds } : undefined, location: location ? { contains: location, mode: "insensitive" } : undefined, ...(priceRoom ? { roomTypes: priceRoom } : {}) }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } }, roomTypes: { select: { pricePerNight: true } } }, orderBy: { name: "asc" }, take: 60 }) : Promise.resolve([]),
    (category === "all" || category === "guides") ? prisma.guideProfile.findMany({ where: { application: { status: ApplicationStatus.APPROVED }, id: query ? { in: ids.guideIds } : undefined, regionsCovered: location ? { has: location } : undefined }, include: { user: { select: { image: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: { name: "asc" }, take: 60 }) : Promise.resolve([]),
  ]);
  const total = places.length + activities.length + hotels.length + guides.length;
  const mapPoints: MapPoint[] = [
    ...places.filter((p) => p.latitude !== null && p.longitude !== null).map((p) => ({ id: `place-${p.id}`, title: p.name, location: p.location, href: `/places/${p.slug}`, latitude: p.latitude!, longitude: p.longitude! })),
    ...activities.filter((p) => p.latitude !== null && p.longitude !== null).map((p) => ({ id: `activity-${p.id}`, title: p.name, location: p.location, href: `/activities/${p.slug}`, latitude: p.latitude!, longitude: p.longitude! })),
    ...hotels.filter((p) => p.latitude !== null && p.longitude !== null).map((p) => ({ id: `hotel-${p.id}`, title: p.name, location: p.location, href: `/hotels/${p.slug}`, latitude: p.latitude!, longitude: p.longitude! })),
  ];
  return <main className="py-12 sm:py-16"><PageContainer>
    <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Discover Chitral</p><h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Search stays, places, food, and guides</h1>
      <form action="/search" method="get" className="mt-6 grid gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_130px_130px_auto]">
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-border px-3"><SearchIcon size={17} aria-hidden="true" className="text-muted"/><span className="sr-only">Search listings</span><input name="q" defaultValue={query} placeholder="What are you looking for?" className="h-11 min-w-0 flex-1 text-sm outline-none" /></label>
        <select name="category" defaultValue={category} aria-label="Category" className="h-11 rounded-xl border border-border bg-white px-3 text-sm">{categories.map((value) => <option key={value} value={value}>{value === "all" ? "All categories" : value[0].toUpperCase() + value.slice(1)}</option>)}</select>
        <input name="location" defaultValue={location} placeholder="Town or area" aria-label="Location" className="h-11 rounded-xl border border-border px-3 text-sm" />
        <input name="minPrice" defaultValue={params.minPrice ?? ""} type="number" min="0" placeholder="Min PKR" aria-label="Minimum hotel price per night" className="h-11 rounded-xl border border-border px-3 text-sm" />
        <input name="maxPrice" defaultValue={params.maxPrice ?? ""} type="number" min="0" placeholder="Max PKR" aria-label="Maximum hotel price per night" className="h-11 rounded-xl border border-border px-3 text-sm" />
        <select name="radius" defaultValue={String(radius)} aria-label="Nearby search radius" className="h-11 rounded-xl border border-border bg-white px-3 text-sm">{[5, 10, 25, 50, 100, 250].map((n) => <option key={n} value={n}>{n} km</option>)}</select>
        <button className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">Search</button>
        <NearbySearchButton radiusKm={radius} />
      </form><p className="mt-2 text-xs text-muted">Price limits apply to hotel room prices per night.</p>
      {latitude !== undefined && longitude !== undefined && <p className="mt-1 text-xs text-muted">Nearby results use your current location for this search only. Coordinates are included in this page URL and are not saved to your profile.</p>}
    </div>
    {mapPoints.length > 0 && <div className="mt-8"><ListingMap points={mapPoints} label="Map of matching listings with saved coordinates" /></div>}
    <p className="mt-8 text-sm text-muted">{total} {total === 1 ? "approved result" : "approved results"}{query ? <> for <span className="font-semibold text-foreground">“{query}”</span></> : ""}</p>
    {total ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{places.map((place) => <PlaceCard key={`place-${place.id}`} place={place} />)}{activities.map((activity) => <ActivityCard key={`activity-${activity.id}`} activity={activity} />)}{hotels.map((hotel) => <HotelCard key={`hotel-${hotel.id}`} hotel={hotel} />)}{guides.map((guide) => <GuideCard key={`guide-${guide.id}`} guide={guide} />)}</div> : <EmptyState className="mt-4" title={query || location ? "No listings match those filters" : "No approved listings yet"} description="Try another search, category, or location. Hotel price filters apply only to stays." />}
  </PageContainer></main>;
}

function parsePrice(value?: string) {
  if (!value || !/^\d{1,9}(?:\.\d{1,2})?$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}
function parseCoordinate(value: string | undefined, min: number, max: number) { if (!value || !/^-?\d{1,3}(?:\.\d{1,8})?$/.test(value)) return undefined; const n = Number(value); return Number.isFinite(n) && n >= min && n <= max ? n : undefined; }
function parseRadius(value?: string) { const n = Number(value); return [5, 10, 25, 50, 100, 250].includes(n) ? n : 25; }
function intersect(textIds: string[], nearIds: string[], hasText: boolean) { return hasText ? textIds.filter((id) => nearIds.includes(id)) : nearIds; }
