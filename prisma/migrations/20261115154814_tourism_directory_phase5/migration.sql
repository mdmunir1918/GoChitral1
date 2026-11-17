CREATE TYPE "DirectoryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "PlaceCategory" AS ENUM ('DESTINATION', 'NATURAL_ATTRACTION', 'HISTORICAL_PLACE', 'CULTURAL_PLACE', 'VIEWPOINT', 'RESTAURANT', 'FOOD_SPOT', 'OTHER');
CREATE TYPE "ActivityCategory" AS ENUM ('HIKING', 'CULTURAL_EXPERIENCE', 'WILDLIFE', 'ADVENTURE', 'WELLNESS', 'OTHER');
CREATE TYPE "DirectorySource" AS ENUM ('ADMIN', 'PROVIDER', 'TOURIST_SUGGESTION');

CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PlaceCategory" NOT NULL,
    "summary" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "cuisine" TEXT,
    "specialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "menuInformation" TEXT,
    "priceRange" TEXT,
    "openingHours" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "contactUrl" TEXT,
    "status" "DirectoryStatus" NOT NULL DEFAULT 'PENDING',
    "source" "DirectorySource" NOT NULL DEFAULT 'ADMIN',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Place_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Place_coordinates_check" CHECK (
      ("latitude" IS NULL AND "longitude" IS NULL) OR
      ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
    )
);

CREATE TABLE "PlaceImage" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaceImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "summary" VARCHAR(240) NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "priceRange" TEXT,
    "status" "DirectoryStatus" NOT NULL DEFAULT 'PENDING',
    "source" "DirectorySource" NOT NULL DEFAULT 'PROVIDER',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Activity_coordinates_check" CHECK (
      ("latitude" IS NULL AND "longitude" IS NULL) OR
      ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
    )
);

CREATE TABLE "ActivityImage" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaceSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PlaceCategory" NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DirectoryStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlaceSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");
CREATE INDEX "Place_status_category_createdAt_idx" ON "Place"("status", "category", "createdAt");
CREATE INDEX "Place_location_status_idx" ON "Place"("location", "status");
CREATE INDEX "Place_name_idx" ON "Place"("name");
CREATE INDEX "PlaceImage_placeId_sortOrder_idx" ON "PlaceImage"("placeId", "sortOrder");
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");
CREATE INDEX "Activity_status_category_createdAt_idx" ON "Activity"("status", "category", "createdAt");
CREATE INDEX "Activity_location_status_idx" ON "Activity"("location", "status");
CREATE INDEX "Activity_name_idx" ON "Activity"("name");
CREATE INDEX "ActivityImage_activityId_sortOrder_idx" ON "ActivityImage"("activityId", "sortOrder");
CREATE INDEX "PlaceSuggestion_status_createdAt_idx" ON "PlaceSuggestion"("status", "createdAt");
CREATE INDEX "PlaceSuggestion_userId_createdAt_idx" ON "PlaceSuggestion"("userId", "createdAt");

ALTER TABLE "Place" ADD CONSTRAINT "Place_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlaceImage" ADD CONSTRAINT "PlaceImage_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityImage" ADD CONSTRAINT "ActivityImage_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaceSuggestion" ADD CONSTRAINT "PlaceSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Directory reads and writes go through server-side Prisma authorization, not Supabase's browser Data API.
ALTER TABLE "Place" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlaceImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlaceSuggestion" ENABLE ROW LEVEL SECURITY;
