-- Phase 10: indexed full-text search and coordinate-radius search.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS "Place_search_vector_idx" ON "Place" USING GIN (
  to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("description", '') || ' ' || coalesce("location", '') || ' ' || coalesce("cuisine", ''))
);
CREATE INDEX IF NOT EXISTS "Activity_search_vector_idx" ON "Activity" USING GIN (
  to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("description", '') || ' ' || coalesce("location", ''))
);
CREATE INDEX IF NOT EXISTS "Hotel_search_vector_idx" ON "Hotel" USING GIN (
  to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("description", '') || ' ' || coalesce("location", ''))
);
CREATE INDEX IF NOT EXISTS "GuideProfile_search_vector_idx" ON "GuideProfile" USING GIN (
  to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("biography", ''))
);

CREATE INDEX IF NOT EXISTS "Place_coordinates_geography_idx" ON "Place" USING GIST (
  CAST(extensions.ST_SetSRID(extensions.ST_MakePoint("longitude", "latitude"), 4326) AS extensions.geography)
) WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Activity_coordinates_geography_idx" ON "Activity" USING GIST (
  CAST(extensions.ST_SetSRID(extensions.ST_MakePoint("longitude", "latitude"), 4326) AS extensions.geography)
) WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Hotel_coordinates_geography_idx" ON "Hotel" USING GIST (
  CAST(extensions.ST_SetSRID(extensions.ST_MakePoint("longitude", "latitude"), 4326) AS extensions.geography)
) WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;
