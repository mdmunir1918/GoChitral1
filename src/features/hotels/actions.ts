"use server";

import { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccountType } from "@/lib/authz";
import { optionalCoordinate, parseImageUrls, slugify } from "@/features/directory/data";
import { uploadListingImages } from "@/features/directory/r2-images";
import { formDataObject, hotelProfileSchema, readableIssues, roomTypeSchema } from "./schemas";

const PROFILE_KEYS = Object.keys(hotelProfileSchema.shape);
const ROOM_KEYS = Object.keys(roomTypeSchema.shape);

async function uploadedHotelImageUrls(formData: FormData, rawUrls: string) {
  const urls = parseImageUrls(rawUrls);
  return [...urls, ...await uploadListingImages(formData.getAll("images"), "hotels")];
}

export async function updateHotelProfileAction(formData: FormData) {
  const owner = await requireAccountType(["HOTEL_OWNER"]);
  const application = await prisma.hotelApplication.findUnique({ where: { userId: owner.id }, select: { id: true, status: true } });
  if (!application || application.status !== ApplicationStatus.APPROVED) redirect("/hotel-owner?error=Your+application+must+be+approved+before+editing+the+public+profile");
  const parsed = hotelProfileSchema.safeParse(formDataObject(formData, PROFILE_KEYS));
  if (!parsed.success) redirect(`/hotel-owner?error=${encodeURIComponent(readableIssues(parsed.error))}`);
  let imageUrls: string[];
  try { imageUrls = await uploadedHotelImageUrls(formData, parsed.data.imageUrls); }
  catch (error) { redirect(`/hotel-owner?error=${encodeURIComponent(error instanceof Error ? error.message : "Photo upload failed.")}`); }
  const hotel = await prisma.hotel.findUnique({ where: { userId: owner.id }, select: { id: true, slug: true } });
  if (!hotel) redirect("/hotel-owner?error=Hotel+profile+is+not+available");
  const nextSlug = `${slugify(parsed.data.name)}-${owner.id.slice(-6).toLowerCase()}`;
  const data = {
    name: parsed.data.name,
    summary: parsed.data.summary,
    description: parsed.data.description,
    location: parsed.data.location,
    latitude: optionalCoordinate(parsed.data.latitude === "" ? "" : parsed.data.latitude),
    longitude: optionalCoordinate(parsed.data.longitude === "" ? "" : parsed.data.longitude),
    amenities: parsed.data.amenities.split(",").map((item) => item.trim()).filter(Boolean),
    phone: parsed.data.phone || null,
    whatsapp: parsed.data.whatsapp || null,
    slug: nextSlug,
  };
  await prisma.hotel.update({ where: { id: hotel.id }, data: {
    ...data,
    ...(imageUrls.length ? { images: { deleteMany: {}, create: imageUrls.map((url, sortOrder) => ({ url, altText: data.name, sortOrder })) } } : {}),
  } });
  revalidatePath("/hotels"); revalidatePath(`/hotels/${hotel.slug}`); revalidatePath(`/hotels/${nextSlug}`); revalidatePath("/");
  redirect("/hotel-owner?saved=1");
}

export async function createRoomTypeAction(formData: FormData) {
  const owner = await requireAccountType(["HOTEL_OWNER"]);
  const parsed = roomTypeSchema.safeParse(formDataObject(formData, ROOM_KEYS));
  if (!parsed.success) redirect(`/hotel-owner?error=${encodeURIComponent(readableIssues(parsed.error))}`);
  const hotel = await prisma.hotel.findFirst({ where: { userId: owner.id, application: { status: ApplicationStatus.APPROVED } }, select: { id: true, slug: true } });
  if (!hotel) redirect("/hotel-owner?error=Your+approved+hotel+profile+is+required");
  await prisma.hotelRoomType.create({ data: { ...parsed.data, pricePerNight: parsed.data.pricePerNight, hotelId: hotel.id } });
  revalidatePath("/hotels"); revalidatePath(`/hotels/${hotel.slug}`); revalidatePath("/hotel-owner");
  redirect("/hotel-owner?roomSaved=1");
}

export async function updateRoomTypeAction(formData: FormData) {
  const owner = await requireAccountType(["HOTEL_OWNER"]);
  const id = String(formData.get("id") ?? "");
  const parsed = roomTypeSchema.safeParse(formDataObject(formData, ROOM_KEYS));
  if (!id || !parsed.success) redirect(`/hotel-owner?error=${encodeURIComponent(parsed.success ? "Room type not found." : readableIssues(parsed.error))}`);
  const room = await prisma.hotelRoomType.findFirst({ where: { id, hotel: { userId: owner.id, application: { status: ApplicationStatus.APPROVED } } }, select: { hotel: { select: { slug: true } } } });
  if (!room) redirect("/hotel-owner?error=Room+type+not+found");
  await prisma.hotelRoomType.update({ where: { id }, data: parsed.data });
  revalidatePath("/hotels"); revalidatePath(`/hotels/${room.hotel.slug}`); revalidatePath("/hotel-owner");
  redirect("/hotel-owner?roomSaved=1");
}

export async function deleteRoomTypeAction(formData: FormData) {
  const owner = await requireAccountType(["HOTEL_OWNER"]);
  const id = String(formData.get("id") ?? "");
  const room = await prisma.hotelRoomType.findFirst({ where: { id, hotel: { userId: owner.id, application: { status: ApplicationStatus.APPROVED } } }, select: { hotel: { select: { slug: true } } } });
  if (!room) redirect("/hotel-owner?error=Room+type+not+found");
  await prisma.hotelRoomType.delete({ where: { id } });
  revalidatePath("/hotels"); revalidatePath(`/hotels/${room.hotel.slug}`); revalidatePath("/hotel-owner");
  redirect("/hotel-owner?roomDeleted=1");
}

export async function reviewHotelApplicationAction(formData: FormData) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const application = await prisma.hotelApplication.findUnique({ where: { id } });
  if (!application || application.status !== ApplicationStatus.PENDING) redirect("/admin/hotel-applications?error=Application+is+not+available");
  if (decision !== "approve" && decision !== "reject") redirect("/admin/hotel-applications?error=Invalid+review+decision");
  if (decision === "reject") {
    await prisma.hotelApplication.update({ where: { id }, data: { status: ApplicationStatus.REJECTED } });
  } else {
    const slug = `${slugify(application.hotelName)}-${application.userId.slice(-6).toLowerCase()}`;
    await prisma.$transaction([
      prisma.hotelApplication.update({ where: { id }, data: { status: ApplicationStatus.APPROVED } }),
      prisma.hotel.upsert({ where: { applicationId: id }, create: {
        userId: application.userId, applicationId: id, slug, name: application.hotelName,
        summary: application.hotelDescription.slice(0, 240), description: application.hotelDescription,
        location: application.hotelLocation, phone: application.phone, whatsapp: application.whatsapp,
      }, update: {} }),
    ]);
  }
  revalidatePath("/admin/hotel-applications"); revalidatePath("/hotel-owner"); revalidatePath("/hotels"); revalidatePath("/");
  redirect(`/admin/hotel-applications?reviewed=${decision}`);
}
