CREATE TYPE "ItineraryItemType" AS ENUM ('PLACE', 'ACTIVITY', 'HOTEL', 'GUIDE', 'CUSTOM');

CREATE TABLE "Trip" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Trip_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Trip_date_range_check" CHECK ("endDate" >= "startDate")
);

CREATE TABLE "TripDay" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "dayNumber" INTEGER NOT NULL,
  "date" DATE NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TripDay_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TripDay_day_number_check" CHECK ("dayNumber" BETWEEN 1 AND 30)
);

CREATE TABLE "ItineraryItem" (
  "id" TEXT NOT NULL,
  "dayId" TEXT NOT NULL,
  "type" "ItineraryItemType" NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "location" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "startTime" VARCHAR(5),
  "notes" TEXT,
  "priceInformation" VARCHAR(240),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "placeId" TEXT,
  "activityId" TEXT,
  "hotelId" TEXT,
  "guideProfileId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItineraryItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ItineraryItem_target_check" CHECK (
    ("type" = 'CUSTOM' AND "placeId" IS NULL AND "activityId" IS NULL AND "hotelId" IS NULL AND "guideProfileId" IS NULL) OR
    ("type" = 'PLACE' AND "placeId" IS NOT NULL AND "activityId" IS NULL AND "hotelId" IS NULL AND "guideProfileId" IS NULL) OR
    ("type" = 'ACTIVITY' AND "activityId" IS NOT NULL AND "placeId" IS NULL AND "hotelId" IS NULL AND "guideProfileId" IS NULL) OR
    ("type" = 'HOTEL' AND "hotelId" IS NOT NULL AND "placeId" IS NULL AND "activityId" IS NULL AND "guideProfileId" IS NULL) OR
    ("type" = 'GUIDE' AND "guideProfileId" IS NOT NULL AND "placeId" IS NULL AND "activityId" IS NULL AND "hotelId" IS NULL)
  ),
  CONSTRAINT "ItineraryItem_start_time_check" CHECK ("startTime" IS NULL OR "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

CREATE TABLE "TripAccommodation" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "hotelId" TEXT,
  "roomTypeId" TEXT,
  "hotelName" VARCHAR(180) NOT NULL,
  "location" TEXT NOT NULL,
  "checkIn" DATE NOT NULL,
  "checkOut" DATE NOT NULL,
  "roomTypeName" VARCHAR(120),
  "guests" INTEGER,
  "notes" TEXT,
  "indicativePricePerNight" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TripAccommodation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TripAccommodation_date_range_check" CHECK ("checkOut" > "checkIn"),
  CONSTRAINT "TripAccommodation_guests_check" CHECK ("guests" IS NULL OR "guests" BETWEEN 1 AND 20)
);

CREATE INDEX "Trip_userId_archivedAt_updatedAt_idx" ON "Trip"("userId", "archivedAt", "updatedAt");
CREATE UNIQUE INDEX "TripDay_tripId_dayNumber_key" ON "TripDay"("tripId", "dayNumber");
CREATE UNIQUE INDEX "TripDay_tripId_date_key" ON "TripDay"("tripId", "date");
CREATE INDEX "TripDay_tripId_dayNumber_idx" ON "TripDay"("tripId", "dayNumber");
CREATE INDEX "ItineraryItem_dayId_sortOrder_idx" ON "ItineraryItem"("dayId", "sortOrder");
CREATE INDEX "TripAccommodation_tripId_checkIn_idx" ON "TripAccommodation"("tripId", "checkIn");

ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripDay" ADD CONSTRAINT "TripDay_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItineraryItem" ADD CONSTRAINT "ItineraryItem_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "TripDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItineraryItem" ADD CONSTRAINT "ItineraryItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItineraryItem" ADD CONSTRAINT "ItineraryItem_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItineraryItem" ADD CONSTRAINT "ItineraryItem_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItineraryItem" ADD CONSTRAINT "ItineraryItem_guideProfileId_fkey" FOREIGN KEY ("guideProfileId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripAccommodation" ADD CONSTRAINT "TripAccommodation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripAccommodation" ADD CONSTRAINT "TripAccommodation_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripAccommodation" ADD CONSTRAINT "TripAccommodation_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "HotelRoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Trip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TripDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItineraryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TripAccommodation" ENABLE ROW LEVEL SECURITY;
