CREATE TYPE "SavedListingType" AS ENUM ('PLACE', 'ACTIVITY', 'HOTEL', 'GUIDE');

CREATE TABLE "TouristProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "homeLocation" TEXT,
    "travelInterests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "travelStyle" TEXT,
    "preferredPace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TouristProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedListing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SavedListingType" NOT NULL,
    "placeId" TEXT,
    "activityId" TEXT,
    "hotelId" TEXT,
    "guideProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SavedListing_exactly_one_target_check" CHECK (
      (CASE WHEN "placeId" IS NULL THEN 0 ELSE 1 END +
       CASE WHEN "activityId" IS NULL THEN 0 ELSE 1 END +
       CASE WHEN "hotelId" IS NULL THEN 0 ELSE 1 END +
       CASE WHEN "guideProfileId" IS NULL THEN 0 ELSE 1 END) = 1
    ),
    CONSTRAINT "SavedListing_type_target_check" CHECK (
      ("type" = 'PLACE' AND "placeId" IS NOT NULL) OR
      ("type" = 'ACTIVITY' AND "activityId" IS NOT NULL) OR
      ("type" = 'HOTEL' AND "hotelId" IS NOT NULL) OR
      ("type" = 'GUIDE' AND "guideProfileId" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "TouristProfile_userId_key" ON "TouristProfile"("userId");
CREATE UNIQUE INDEX "SavedListing_userId_placeId_key" ON "SavedListing"("userId", "placeId");
CREATE UNIQUE INDEX "SavedListing_userId_activityId_key" ON "SavedListing"("userId", "activityId");
CREATE UNIQUE INDEX "SavedListing_userId_hotelId_key" ON "SavedListing"("userId", "hotelId");
CREATE UNIQUE INDEX "SavedListing_userId_guideProfileId_key" ON "SavedListing"("userId", "guideProfileId");
CREATE INDEX "SavedListing_userId_createdAt_idx" ON "SavedListing"("userId", "createdAt");

ALTER TABLE "TouristProfile" ADD CONSTRAINT "TouristProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_guideProfileId_fkey" FOREIGN KEY ("guideProfileId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TouristProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedListing" ENABLE ROW LEVEL SECURITY;
