"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ApplicationStatus, type ItineraryItemType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAccountType } from "@/lib/authz";

const dayMs = 24 * 60 * 60 * 1000;
const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const tripIdText = z.string().min(1).max(40);

function formText(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseDate(value: string) {
  if (!dateText.safeParse(value).success) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function tripDateToday() {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Karachi" });
  return new Date(`${today}T00:00:00.000Z`);
}

function inclusiveDayCount(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
}

function refreshTripPages(tripId?: string) {
  revalidatePath("/tourist");
  revalidatePath("/tourist/trips");
  if (tripId) revalidatePath(`/tourist/trips/${tripId}`);
}

export async function createTrip(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const title = formText(formData, "title");
  const description = formText(formData, "description");
  const startDate = parseDate(formText(formData, "startDate"));
  const endDate = parseDate(formText(formData, "endDate"));
  if (title.length < 2 || title.length > 120 || description.length > 1000 || !startDate || !endDate || endDate < startDate) {
    redirect("/tourist/trips?status=invalid");
  }
  const dayCount = inclusiveDayCount(startDate, endDate);
  if (dayCount > 30) redirect("/tourist/trips?status=too-long");

  try {
    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        startDate,
        endDate,
        days: {
          create: Array.from({ length: dayCount }, (_, index) => ({
            dayNumber: index + 1,
            date: new Date(startDate.getTime() + index * dayMs),
          })),
        },
      },
      select: { id: true },
    });
    refreshTripPages(trip.id);
    redirect(`/tourist/trips/${trip.id}?status=created`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/tourist/trips?status=error");
  }
}

export async function updateTrip(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const tripId = formText(formData, "tripId");
  const title = formText(formData, "title");
  const description = formText(formData, "description");
  if (!tripIdText.safeParse(tripId).success || title.length < 2 || title.length > 120 || description.length > 1000) {
    redirect(`/tourist/trips/${encodeURIComponent(tripId)}?status=invalid`);
  }
  const result = await prisma.trip.updateMany({
    where: { id: tripId, userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } },
    data: { title, description: description || null },
  });
  if (!result.count) redirect("/tourist/trips?status=unavailable");
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=updated`);
}

export async function archiveTrip(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const tripId = formText(formData, "tripId");
  if (!tripIdText.safeParse(tripId).success) redirect("/tourist/trips?status=invalid");
  const result = await prisma.trip.updateMany({
    where: { id: tripId, userId: user.id, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (!result.count) redirect("/tourist/trips?status=unavailable");
  refreshTripPages(tripId);
  redirect("/tourist/trips?status=trip-completed");
}

export async function restoreTrip(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const tripId = formText(formData, "tripId");
  if (!tripIdText.safeParse(tripId).success) redirect("/tourist/trips?status=invalid");
  const result = await prisma.trip.updateMany({
    where: { id: tripId, userId: user.id, archivedAt: { not: null }, endDate: { gte: tripDateToday() } },
    data: { archivedAt: null },
  });
  if (!result.count) redirect("/tourist/trips?status=unavailable");
  refreshTripPages(tripId);
  redirect("/tourist/trips?status=restored");
}

export async function addTripDay(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const tripId = formText(formData, "tripId");
  if (!tripIdText.safeParse(tripId).success) redirect("/tourist/trips?status=invalid");
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } },
    include: { days: { orderBy: { dayNumber: "desc" }, take: 1 } },
  });
  if (!trip) redirect("/tourist/trips?status=unavailable");
  const dayNumber = (trip.days[0]?.dayNumber ?? 0) + 1;
  if (dayNumber > 30) redirect(`/tourist/trips/${tripId}?status=day-limit`);
  const date = new Date(trip.startDate.getTime() + (dayNumber - 1) * dayMs);
  let newDay: { id: string };
  try {
    [newDay] = await prisma.$transaction([
      prisma.tripDay.create({ data: { tripId, dayNumber, date }, select: { id: true } }),
      prisma.trip.update({ where: { id: tripId, userId: user.id }, data: { endDate: date } }),
    ]);
  } catch {
    redirect(`/tourist/trips/${tripId}?status=error`);
  }
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=day-added#${newDay.id}`);
}

export async function updateTripDayNotes(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const tripId = formText(formData, "tripId");
  const dayId = formText(formData, "dayId");
  const notes = formText(formData, "notes");
  if (!tripIdText.safeParse(tripId).success || !dayId || notes.length > 1000) redirect(`/tourist/trips/${encodeURIComponent(tripId)}?status=invalid`);
  const result = await prisma.tripDay.updateMany({
    where: { id: dayId, tripId, trip: { userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } } },
    data: { notes: notes || null },
  });
  if (!result.count) redirect("/tourist/trips?status=unavailable");
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=updated#${formText(formData, "dayAnchor") || "day"}`);
}

async function getDayForOwner(userId: string, tripId: string, dayId: string) {
  return prisma.tripDay.findFirst({
    where: { id: dayId, tripId, trip: { userId, archivedAt: null, endDate: { gte: tripDateToday() } } },
    select: { id: true },
  });
}

type PublicListingSnapshot = {
  type: Exclude<ItineraryItemType, "CUSTOM">;
  id: string;
  title: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  priceInformation: string | null;
};

async function getPublicListing(type: string, id: string): Promise<PublicListingSnapshot | null> {
  if (type === "PLACE") {
    const place = await prisma.place.findFirst({ where: { id, status: "APPROVED" }, select: { id: true, name: true, location: true, latitude: true, longitude: true, priceRange: true } });
    return place ? { type: "PLACE", id: place.id, title: place.name, location: place.location, latitude: place.latitude, longitude: place.longitude, priceInformation: place.priceRange } : null;
  }
  if (type === "ACTIVITY") {
    const activity = await prisma.activity.findFirst({ where: { id, status: "APPROVED" }, select: { id: true, name: true, location: true, latitude: true, longitude: true, priceRange: true } });
    return activity ? { type: "ACTIVITY", id: activity.id, title: activity.name, location: activity.location, latitude: activity.latitude, longitude: activity.longitude, priceInformation: activity.priceRange } : null;
  }
  if (type === "HOTEL") {
    const hotel = await prisma.hotel.findFirst({ where: { id, application: { status: ApplicationStatus.APPROVED } }, select: { id: true, name: true, location: true, latitude: true, longitude: true, roomTypes: { orderBy: { pricePerNight: "asc" }, take: 1, select: { pricePerNight: true } } } });
    const priceInformation = hotel?.roomTypes[0] ? `From PKR ${Number(hotel.roomTypes[0].pricePerNight).toLocaleString("en-PK")} per night` : null;
    return hotel ? { type: "HOTEL", id: hotel.id, title: hotel.name, location: hotel.location, latitude: hotel.latitude, longitude: hotel.longitude, priceInformation } : null;
  }
  if (type === "GUIDE") {
    const guide = await prisma.guideProfile.findFirst({ where: { id, application: { status: ApplicationStatus.APPROVED } }, select: { id: true, name: true, regionsCovered: true, pricingInformation: true } });
    return guide ? { type: "GUIDE", id: guide.id, title: guide.name, location: guide.regionsCovered.join(", ") || "Chitral", latitude: null, longitude: null, priceInformation: guide.pricingInformation?.slice(0, 240) ?? null } : null;
  }
  return null;
}

export async function addListingToTrip(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const selection = formText(formData, "selection");
  const [tripId, dayId] = selection.split("|");
  const listingValue = formText(formData, "listing");
  const [listingType, listingId] = listingValue ? listingValue.split("|") : [formText(formData, "type"), formText(formData, "listingId")];
  const type = listingType;
  if (type !== "CUSTOM" && (!listingId || !["PLACE", "ACTIVITY", "HOTEL", "GUIDE"].includes(type))) {
    redirect(`/tourist/trips/${encodeURIComponent(tripId)}?status=invalid`);
  }
  if (!tripId || !dayId || !tripIdText.safeParse(tripId).success || !(await getDayForOwner(user.id, tripId, dayId))) {
    redirect("/tourist/trips?status=unavailable");
  }

  let common = {
    dayId,
    sortOrder: (await prisma.itineraryItem.aggregate({ where: { dayId }, _max: { sortOrder: true } }))._max.sortOrder ?? -1,
    title: "",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    priceInformation: null as string | null,
  };
  common.sortOrder += 1;
  if (type === "CUSTOM") {
    const title = formText(formData, "customTitle");
    const location = formText(formData, "customLocation");
    if (title.length < 2 || title.length > 180 || location.length > 160) redirect(`/tourist/trips/${tripId}?status=invalid`);
    common = { ...common, title, location, priceInformation: null };
    try {
      await prisma.itineraryItem.create({ data: { ...common, type: "CUSTOM", location: location || null } });
    } catch {
      redirect(`/tourist/trips/${tripId}?status=error`);
    }
  } else {
    const listing = await getPublicListing(type, listingId);
    if (!listing) redirect(`/tourist/trips/${tripId}?status=unavailable`);
    common = { ...common, title: listing.title, location: listing.location, latitude: listing.latitude, longitude: listing.longitude, priceInformation: listing.priceInformation };
    const relations = listing.type === "PLACE" ? { placeId: listing.id } : listing.type === "ACTIVITY" ? { activityId: listing.id } : listing.type === "HOTEL" ? { hotelId: listing.id } : { guideProfileId: listing.id };
    try {
      await prisma.itineraryItem.create({ data: { ...common, type: listing.type, ...relations } });
    } catch {
      redirect(`/tourist/trips/${tripId}?status=error`);
    }
  }
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=item-added#${dayId}`);
}

export async function updateItineraryItem(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const itemId = formText(formData, "itemId");
  const tripId = formText(formData, "tripId");
  const title = formText(formData, "title");
  const notes = formText(formData, "notes");
  const startTime = formText(formData, "startTime");
  if (!itemId || !tripIdText.safeParse(tripId).success || title.length < 2 || title.length > 180 || notes.length > 1000 || (startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))) {
    redirect(`/tourist/trips/${encodeURIComponent(tripId)}?status=invalid`);
  }
  const result = await prisma.itineraryItem.updateMany({
    where: { id: itemId, day: { tripId, trip: { userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } } } },
    data: { title, notes: notes || null, startTime: startTime || null },
  });
  if (!result.count) redirect("/tourist/trips?status=unavailable");
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=updated`);
}

export async function moveItineraryItem(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const itemId = formText(formData, "itemId");
  const tripId = formText(formData, "tripId");
  const direction = formText(formData, "direction");
  if (!itemId || !tripIdText.safeParse(tripId).success || !["up", "down"].includes(direction)) redirect(`/tourist/trips/${encodeURIComponent(tripId)}?status=invalid`);
  const item = await prisma.itineraryItem.findFirst({ where: { id: itemId, day: { tripId, trip: { userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } } } }, select: { id: true, dayId: true, sortOrder: true } });
  if (!item) redirect("/tourist/trips?status=unavailable");
  const neighbors = await prisma.itineraryItem.findMany({ where: { dayId: item.dayId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, sortOrder: true } });
  const index = neighbors.findIndex((entry) => entry.id === item.id);
  const neighbor = neighbors[index + (direction === "up" ? -1 : 1)];
  if (neighbor) await prisma.$transaction([
    prisma.itineraryItem.update({ where: { id: item.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.itineraryItem.update({ where: { id: neighbor.id }, data: { sortOrder: item.sortOrder } }),
  ]);
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=reordered#${item.dayId}`);
}

export async function removeItineraryItem(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const itemId = formText(formData, "itemId");
  const tripId = formText(formData, "tripId");
  if (!itemId || !tripIdText.safeParse(tripId).success) redirect(`/tourist/trips/${encodeURIComponent(tripId)}?status=invalid`);
  const result = await prisma.itineraryItem.deleteMany({ where: { id: itemId, day: { tripId, trip: { userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } } } } });
  if (!result.count) redirect("/tourist/trips?status=unavailable");
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=removed`);
}

export async function addTripAccommodation(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const tripId = formText(formData, "tripId");
  const hotelId = formText(formData, "hotelId");
  const checkIn = parseDate(formText(formData, "checkIn"));
  const checkOut = parseDate(formText(formData, "checkOut"));
  const roomTypeName = formText(formData, "roomTypeName");
  const guestsRaw = formText(formData, "guests");
  const notes = formText(formData, "notes");
  const guests = guestsRaw ? Number(guestsRaw) : null;
  if (!tripIdText.safeParse(tripId).success || !hotelId || !checkIn || !checkOut || checkOut <= checkIn || roomTypeName.length > 120 || (guests !== null && (!Number.isInteger(guests) || guests < 1 || guests > 20)) || notes.length > 1000) {
    redirect(`/tourist/trips/${encodeURIComponent(tripId)}?status=invalid`);
  }
  const [trip, hotel] = await Promise.all([
    prisma.trip.findFirst({ where: { id: tripId, userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } }, select: { id: true } }),
    prisma.hotel.findFirst({ where: { id: hotelId, application: { status: ApplicationStatus.APPROVED } }, select: { id: true, name: true, location: true, roomTypes: { select: { id: true, name: true, pricePerNight: true } } } }),
  ]);
  if (!trip || !hotel) redirect("/tourist/trips?status=unavailable");
  const matchingRoom = roomTypeName ? hotel.roomTypes.find((room) => room.name.toLowerCase() === roomTypeName.toLowerCase()) : undefined;
  try {
    await prisma.tripAccommodation.create({
      data: {
        tripId,
        hotelId: hotel.id,
        roomTypeId: matchingRoom?.id,
        hotelName: hotel.name,
        location: hotel.location,
        checkIn,
        checkOut,
        roomTypeName: matchingRoom?.name ?? (roomTypeName || null),
        guests,
        notes: notes || null,
        indicativePricePerNight: matchingRoom?.pricePerNight,
      },
    });
  } catch {
    redirect(`/tourist/trips/${tripId}?status=error`);
  }
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=stay-added#accommodation`);
}

export async function updateTripAccommodation(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const tripId = formText(formData, "tripId");
  const accommodationId = formText(formData, "accommodationId");
  const checkIn = parseDate(formText(formData, "checkIn"));
  const checkOut = parseDate(formText(formData, "checkOut"));
  const roomTypeName = formText(formData, "roomTypeName");
  const guestsRaw = formText(formData, "guests");
  const notes = formText(formData, "notes");
  const guests = guestsRaw ? Number(guestsRaw) : null;
  if (!accommodationId || !tripIdText.safeParse(tripId).success || !checkIn || !checkOut || checkOut <= checkIn || roomTypeName.length > 120 || (guests !== null && (!Number.isInteger(guests) || guests < 1 || guests > 20)) || notes.length > 1000) redirect(`/tourist/trips/${encodeURIComponent(tripId)}?status=invalid`);
  const accommodation = await prisma.tripAccommodation.findFirst({ where: { id: accommodationId, tripId, trip: { userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } } }, select: { hotelId: true } });
  if (!accommodation) redirect("/tourist/trips?status=unavailable");
  const room = accommodation.hotelId && roomTypeName ? await prisma.hotelRoomType.findFirst({ where: { hotelId: accommodation.hotelId, name: { equals: roomTypeName, mode: "insensitive" } }, select: { id: true, name: true, pricePerNight: true } }) : null;
  const result = await prisma.tripAccommodation.updateMany({
    where: { id: accommodationId, tripId, trip: { userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } } },
    data: { checkIn, checkOut, roomTypeName: room?.name ?? (roomTypeName || null), roomTypeId: room?.id ?? null, indicativePricePerNight: room?.pricePerNight ?? null, guests, notes: notes || null },
  });
  if (!result.count) redirect("/tourist/trips?status=unavailable");
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=updated#accommodation`);
}

export async function removeTripAccommodation(formData: FormData) {
  const user = await requireAccountType(["TOURIST"]);
  const tripId = formText(formData, "tripId");
  const accommodationId = formText(formData, "accommodationId");
  if (!accommodationId || !tripIdText.safeParse(tripId).success) redirect(`/tourist/trips/${encodeURIComponent(tripId)}?status=invalid`);
  const result = await prisma.tripAccommodation.deleteMany({ where: { id: accommodationId, tripId, trip: { userId: user.id, archivedAt: null, endDate: { gte: tripDateToday() } } } });
  if (!result.count) redirect("/tourist/trips?status=unavailable");
  refreshTripPages(tripId);
  redirect(`/tourist/trips/${tripId}?status=removed#accommodation`);
}
