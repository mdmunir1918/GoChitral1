"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAccountType } from "@/lib/authz";
import { uploadListingImages } from "@/features/directory/r2-images";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(24).refine((value) => !value || /^[+0-9 ()-]{7,24}$/.test(value)),
  homeLocation: z.string().trim().max(120),
});

const preferenceSchema = z.object({
  travelInterests: z.string().trim().max(500),
  travelStyle: z.enum(["", "CULTURE", "NATURE", "ADVENTURE", "SLOW_TRAVEL", "FAMILY"]),
  preferredPace: z.enum(["", "RELAXED", "BALANCED", "ACTIVE"]),
});

function text(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateTouristProfile(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const parsed = profileSchema.safeParse({
    name: text(formData, "name"),
    phone: text(formData, "phone"),
    homeLocation: text(formData, "homeLocation"),
  });
  if (!parsed.success) redirect("/tourist/profile?status=invalid");

  let profileImage: string | undefined;
  try {
    const profileFiles = formData.getAll("profileImage").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (profileFiles.length > 1) throw new Error("Choose one profile photo.");
    profileImage = (await uploadListingImages(profileFiles, "tourists"))[0];
  } catch (error) {
    redirect(`/tourist/profile?status=error&message=${encodeURIComponent(error instanceof Error ? error.message : "Photo upload failed.")}`);
  }

  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name, ...(profileImage ? { image: profileImage } : {}) } }),
      prisma.touristProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, phone: parsed.data.phone || null, homeLocation: parsed.data.homeLocation || null },
        update: { phone: parsed.data.phone || null, homeLocation: parsed.data.homeLocation || null },
      }),
    ]);
  } catch {
    redirect("/tourist/profile?status=error");
  }
  redirect("/tourist/profile?status=saved");
}

export async function updateTouristPreferences(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const parsed = preferenceSchema.safeParse({
    travelInterests: text(formData, "travelInterests"),
    travelStyle: text(formData, "travelStyle"),
    preferredPace: text(formData, "preferredPace"),
  });
  if (!parsed.success) redirect("/tourist/preferences?status=invalid");

  const interests = [...new Set(parsed.data.travelInterests.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 10);
  if (interests.some((item) => item.length > 40)) redirect("/tourist/preferences?status=invalid");
  try {
    await prisma.touristProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        travelInterests: interests,
        travelStyle: parsed.data.travelStyle || null,
        preferredPace: parsed.data.preferredPace || null,
      },
      update: {
        travelInterests: interests,
        travelStyle: parsed.data.travelStyle || null,
        preferredPace: parsed.data.preferredPace || null,
      },
    });
  } catch {
    redirect("/tourist/preferences?status=error");
  }
  redirect("/tourist/preferences?status=saved");
}

const listingTypes = ["PLACE", "ACTIVITY", "HOTEL", "GUIDE"] as const;

export async function saveListing(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const typeValue = text(formData, "type");
  const listingId = text(formData, "listingId");
  if (!listingId || !listingTypes.includes(typeValue as (typeof listingTypes)[number])) {
    redirect("/tourist/saved?status=invalid");
  }
  const type = typeValue as (typeof listingTypes)[number];
  const data = { userId: user.id, type, placeId: null as string | null, activityId: null as string | null, hotelId: null as string | null, guideProfileId: null as string | null };

  if (type === "PLACE") {
    if (!(await prisma.place.findFirst({ where: { id: listingId, status: "APPROVED" }, select: { id: true } }))) redirect("/tourist/saved?status=unavailable");
    data.placeId = listingId;
  } else if (type === "ACTIVITY") {
    if (!(await prisma.activity.findFirst({ where: { id: listingId, status: "APPROVED" }, select: { id: true } }))) redirect("/tourist/saved?status=unavailable");
    data.activityId = listingId;
  } else if (type === "HOTEL") {
    if (!(await prisma.hotel.findFirst({ where: { id: listingId, application: { status: "APPROVED" } }, select: { id: true } }))) redirect("/tourist/saved?status=unavailable");
    data.hotelId = listingId;
  } else {
    if (!(await prisma.guideProfile.findFirst({ where: { id: listingId, application: { status: "APPROVED" } }, select: { id: true } }))) redirect("/tourist/saved?status=unavailable");
    data.guideProfileId = listingId;
  }

  try {
    await prisma.savedListing.create({ data });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      redirect("/tourist/saved?status=error");
    }
  }
  redirect("/tourist/saved?status=saved");
}

export async function removeSavedListing(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const id = text(formData, "savedListingId");
  if (!id) redirect("/tourist/saved?status=invalid");
  try {
    await prisma.savedListing.deleteMany({ where: { id, userId: user.id } });
  } catch {
    redirect("/tourist/saved?status=error");
  }
  redirect("/tourist/saved?status=removed");
}
