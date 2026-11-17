import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type IdRank = { id: string; rank: number };

export async function fullTextListingIds(query: string, category: string) {
  const q = query.trim().slice(0, 120);
  if (!q) return { placeIds: [] as string[], activityIds: [] as string[], hotelIds: [] as string[], guideIds: [] as string[] };
  const [places, activities, hotels, guides] = await Promise.all([
    category === "all" || category === "places" || category === "restaurants" ? prisma.$queryRaw<IdRank[]>(Prisma.sql`
      SELECT p."id", ts_rank(to_tsvector('simple', coalesce(p."name", '') || ' ' || coalesce(p."summary", '') || ' ' || coalesce(p."description", '') || ' ' || coalesce(p."location", '') || ' ' || coalesce(p."cuisine", '')), websearch_to_tsquery('simple', ${q})) AS rank
      FROM "Place" p WHERE p."status"::text = 'APPROVED'
      AND (to_tsvector('simple', coalesce(p."name", '') || ' ' || coalesce(p."summary", '') || ' ' || coalesce(p."description", '') || ' ' || coalesce(p."location", '') || ' ' || coalesce(p."cuisine", '')) @@ websearch_to_tsquery('simple', ${q}) OR p."specialties" @> ARRAY[${q}]::text[])
      ORDER BY rank DESC LIMIT 60`) : Promise.resolve([]),
    category === "all" || category === "activities" ? prisma.$queryRaw<IdRank[]>(Prisma.sql`
      SELECT a."id", ts_rank(to_tsvector('simple', coalesce(a."name", '') || ' ' || coalesce(a."summary", '') || ' ' || coalesce(a."description", '') || ' ' || coalesce(a."location", '')), websearch_to_tsquery('simple', ${q})) AS rank
      FROM "Activity" a WHERE a."status"::text = 'APPROVED'
      AND to_tsvector('simple', coalesce(a."name", '') || ' ' || coalesce(a."summary", '') || ' ' || coalesce(a."description", '') || ' ' || coalesce(a."location", '')) @@ websearch_to_tsquery('simple', ${q})
      ORDER BY rank DESC LIMIT 60`) : Promise.resolve([]),
    category === "all" || category === "hotels" ? prisma.$queryRaw<IdRank[]>(Prisma.sql`
      SELECT h."id", ts_rank(to_tsvector('simple', coalesce(h."name", '') || ' ' || coalesce(h."summary", '') || ' ' || coalesce(h."description", '') || ' ' || coalesce(h."location", '')), websearch_to_tsquery('simple', ${q})) AS rank
      FROM "Hotel" h JOIN "HotelApplication" app ON app."id" = h."applicationId" WHERE app."status"::text = 'APPROVED'
      AND (to_tsvector('simple', coalesce(h."name", '') || ' ' || coalesce(h."summary", '') || ' ' || coalesce(h."description", '') || ' ' || coalesce(h."location", '')) @@ websearch_to_tsquery('simple', ${q}) OR h."amenities" @> ARRAY[${q}]::text[])
      ORDER BY rank DESC LIMIT 60`) : Promise.resolve([]),
    category === "all" || category === "guides" ? prisma.$queryRaw<IdRank[]>(Prisma.sql`
      SELECT g."id", ts_rank(to_tsvector('simple', coalesce(g."name", '') || ' ' || coalesce(g."summary", '') || ' ' || coalesce(g."biography", '')), websearch_to_tsquery('simple', ${q})) AS rank
      FROM "GuideProfile" g JOIN "GuideApplication" app ON app."id" = g."applicationId" WHERE app."status"::text = 'APPROVED'
      AND (to_tsvector('simple', coalesce(g."name", '') || ' ' || coalesce(g."summary", '') || ' ' || coalesce(g."biography", '')) @@ websearch_to_tsquery('simple', ${q}) OR g."regionsCovered" @> ARRAY[${q}]::text[] OR g."specialties" @> ARRAY[${q}]::text[] OR g."services" @> ARRAY[${q}]::text[] OR g."languages" @> ARRAY[${q}]::text[])
      ORDER BY rank DESC LIMIT 60`) : Promise.resolve([]),
  ]);
  return { placeIds: places.map(({ id }) => id), activityIds: activities.map(({ id }) => id), hotelIds: hotels.map(({ id }) => id), guideIds: guides.map(({ id }) => id) };
}

export async function nearbyListingIds(latitude: number, longitude: number, radiusKm: number, category: string) {
  const radiusMeters = Math.round(radiusKm * 1000);
  const [places, activities, hotels] = await Promise.all([
    category === "all" || category === "places" || category === "restaurants" ? prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT p."id" FROM "Place" p WHERE p."status"::text = 'APPROVED' AND p."latitude" IS NOT NULL AND p."longitude" IS NOT NULL
      AND extensions.ST_DWithin(CAST(extensions.ST_SetSRID(extensions.ST_MakePoint(p."longitude", p."latitude"), 4326) AS extensions.geography), CAST(extensions.ST_SetSRID(extensions.ST_MakePoint(${longitude}, ${latitude}), 4326) AS extensions.geography), ${radiusMeters})`) : Promise.resolve([]),
    category === "all" || category === "activities" ? prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT a."id" FROM "Activity" a WHERE a."status"::text = 'APPROVED' AND a."latitude" IS NOT NULL AND a."longitude" IS NOT NULL
      AND extensions.ST_DWithin(CAST(extensions.ST_SetSRID(extensions.ST_MakePoint(a."longitude", a."latitude"), 4326) AS extensions.geography), CAST(extensions.ST_SetSRID(extensions.ST_MakePoint(${longitude}, ${latitude}), 4326) AS extensions.geography), ${radiusMeters})`) : Promise.resolve([]),
    category === "all" || category === "hotels" ? prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT h."id" FROM "Hotel" h JOIN "HotelApplication" app ON app."id" = h."applicationId" WHERE app."status"::text = 'APPROVED' AND h."latitude" IS NOT NULL AND h."longitude" IS NOT NULL
      AND extensions.ST_DWithin(CAST(extensions.ST_SetSRID(extensions.ST_MakePoint(h."longitude", h."latitude"), 4326) AS extensions.geography), CAST(extensions.ST_SetSRID(extensions.ST_MakePoint(${longitude}, ${latitude}), 4326) AS extensions.geography), ${radiusMeters})`) : Promise.resolve([]),
  ]);
  return { placeIds: places.map(({ id }) => id), activityIds: activities.map(({ id }) => id), hotelIds: hotels.map(({ id }) => id), guideIds: [] as string[] };
}
