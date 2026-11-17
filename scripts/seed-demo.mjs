import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
if (process.env.NODE_ENV === "production") throw new Error("Demo data is disabled in production.");
if (!databaseUrl) throw new Error("DATABASE_URL is missing.");
const databaseHost = new URL(databaseUrl).hostname.toLowerCase();
if (!["localhost", "127.0.0.1", "::1"].includes(databaseHost)) {
  throw new Error(`Refusing to seed demo records into non-local database host: ${databaseHost}. Use a local PostgreSQL database.`);
}

const prisma = new PrismaClient();
const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD;
if (!demoPassword || demoPassword.length < 12) throw new Error("Set DEMO_ACCOUNT_PASSWORD to a 12+ character local-only test password.");
const passwordHash = await bcrypt.hash(demoPassword, 12);

try {
  const touristEmail = "demo.tourist@gochitral.test";
  const tourist = await prisma.user.upsert({
    where: { email: touristEmail },
    create: { email: touristEmail, name: "Demo Tourist", passwordHash, accountType: "TOURIST", emailVerified: new Date() },
    update: { name: "Demo Tourist", passwordHash, accountType: "TOURIST" },
  });
  await prisma.touristProfile.upsert({ where: { userId: tourist.id }, create: { userId: tourist.id, homeLocation: "Demo City", travelInterests: ["Nature", "Culture"] }, update: { homeLocation: "Demo City", travelInterests: ["Nature", "Culture"] } });
  const secondTourist = await prisma.user.upsert({
    where: { email: "demo.tourist2@gochitral.test" },
    create: { email: "demo.tourist2@gochitral.test", name: "Demo Tourist 2", passwordHash, accountType: "TOURIST", emailVerified: new Date() },
    update: { name: "Demo Tourist 2", passwordHash, accountType: "TOURIST" },
  });
  await prisma.touristProfile.upsert({ where: { userId: secondTourist.id }, create: { userId: secondTourist.id, homeLocation: "Demo Region", travelInterests: ["Food", "Culture"] }, update: { homeLocation: "Demo Region", travelInterests: ["Food", "Culture"] } });

  const ownerEmail = "demo.hotel-owner@gochitral.test";
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    create: { email: ownerEmail, name: "Demo Hotel Owner", passwordHash, accountType: "HOTEL_OWNER", emailVerified: new Date() },
    update: { name: "Demo Hotel Owner", passwordHash, accountType: "HOTEL_OWNER" },
  });
  const application = await prisma.hotelApplication.upsert({
    where: { userId: owner.id },
    create: { userId: owner.id, phone: "+920000000000", whatsapp: "+920000000000", hotelName: "[DEMO] Chitral Valley Inn", hotelLocation: "Chitral Town", hotelDescription: "Test listing for local development only.", businessDetails: "Local demo record.", verificationDetails: "Not a real business.", status: "APPROVED" },
    update: { status: "APPROVED" },
  });
  await prisma.hotel.upsert({
    where: { slug: "demo-chitral-valley-inn" },
    create: { userId: owner.id, applicationId: application.id, slug: "demo-chitral-valley-inn", name: "[DEMO] Chitral Valley Inn", summary: "Local test hotel listing", description: "This is fictional sample content for local testing. Do not use it for travel bookings.", location: "Chitral Town", amenities: ["Wi-Fi", "Demo listing"] },
    update: { applicationId: application.id, name: "[DEMO] Chitral Valley Inn", summary: "Local test hotel listing" },
  });

  const demoPlaces = [
    { slug: "demo-chitral-river-cafe", name: "[DEMO] Chitral River Cafe", category: "RESTAURANT", location: "Chitral Town", summary: "Local test restaurant listing" },
    { slug: "demo-hindukush-viewpoint", name: "[DEMO] Hindukush Viewpoint", category: "VIEWPOINT", location: "Chitral Town", summary: "Local test attraction listing" },
  ];
  for (const place of demoPlaces) await prisma.place.upsert({
    where: { slug: place.slug },
    create: { ...place, description: "Fictional sample content for local development only. Not a real business or verified destination.", status: "APPROVED", source: "ADMIN", priceRange: "Demo only" },
    update: { ...place, status: "APPROVED" },
  });

  await prisma.activity.upsert({
    where: { slug: "demo-chitral-town-walk" },
    create: { slug: "demo-chitral-town-walk", name: "[DEMO] Chitral Town Walk", category: "CULTURAL_EXPERIENCE", summary: "Local test activity", description: "Fictional activity for local development only.", location: "Chitral Town", priceRange: "Demo only", status: "APPROVED", source: "ADMIN" },
    update: { name: "[DEMO] Chitral Town Walk", status: "APPROVED" },
  });

  console.log("Local demo records are ready.");
  console.log("Tourist: demo.tourist@gochitral.test");
  console.log("Second tourist: demo.tourist2@gochitral.test");
  console.log("Hotel owner: demo.hotel-owner@gochitral.test");
  console.log("Use the DEMO_ACCOUNT_PASSWORD you set locally; no passwords are printed.");
} finally {
  await prisma.$disconnect();
}
