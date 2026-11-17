CREATE TABLE "GuideProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" VARCHAR(240) NOT NULL,
    "biography" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "regionsCovered" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "pricingInformation" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GuideProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuideImage" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuideImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuideProfile_userId_key" ON "GuideProfile"("userId");
CREATE UNIQUE INDEX "GuideProfile_applicationId_key" ON "GuideProfile"("applicationId");
CREATE UNIQUE INDEX "GuideProfile_slug_key" ON "GuideProfile"("slug");
CREATE INDEX "GuideProfile_name_idx" ON "GuideProfile"("name");
CREATE INDEX "GuideImage_guideId_sortOrder_idx" ON "GuideImage"("guideId", "sortOrder");

ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "GuideApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuideImage" ADD CONSTRAINT "GuideImage_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuideProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuideImage" ENABLE ROW LEVEL SECURITY;
