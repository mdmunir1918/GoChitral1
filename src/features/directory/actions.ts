"use server";

import { DirectorySource, DirectoryStatus } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccountType } from "@/lib/authz";
import { activityFields, activityInputSchema, formDataObject, placeFields, placeInputSchema, placeSuggestionSchema, readableIssues } from "./schemas";
import { optionalCoordinate, parseImageUrls, slugify } from "./data";
import { uploadListingImages } from "./r2-images";

async function uniquePlaceSlug(name: string, exceptId?: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await prisma.place.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

async function uniqueActivitySlug(name: string, exceptId?: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await prisma.activity.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } })) slug = `${base}-${suffix++}`;
  return slug;
}

function placeValues(data: z.infer<typeof placeFields>) {
  return {
    name: data.name,
    category: data.category,
    summary: data.summary,
    description: data.description,
    location: data.location,
    latitude: optionalCoordinate(data.latitude),
    longitude: optionalCoordinate(data.longitude),
    cuisine: data.cuisine || null,
    specialties: data.specialties?.split(",").map((item) => item.trim()).filter(Boolean) ?? [],
    menuInformation: data.menuInformation || null,
    priceRange: data.priceRange || null,
    openingHours: data.openingHours || null,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    contactUrl: data.contactUrl || null,
  };
}

function activityValues(data: z.infer<typeof activityFields>) {
  return {
    name: data.name,
    category: data.category,
    summary: data.summary,
    description: data.description,
    location: data.location,
    latitude: optionalCoordinate(data.latitude),
    longitude: optionalCoordinate(data.longitude),
    priceRange: data.priceRange || null,
  };
}

function valuesFrom(formData: FormData, fields: string[]) {
  return formDataObject(formData, fields);
}

async function listingImageUrls(formData: FormData, rawUrls: string | undefined, scope: "places" | "activities") {
  const links = parseImageUrls(rawUrls);
  const uploaded = await uploadListingImages(formData.getAll("images"), scope);
  return [...links, ...uploaded];
}

export async function createPlaceAction(formData: FormData) {
  const admin = await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const parsed = placeInputSchema.safeParse(valuesFrom(formData, Object.keys(placeFields.shape)));
  if (!parsed.success) redirect(`/admin/directory?error=${encodeURIComponent(readableIssues(parsed.error))}`);

  let imageUrls: string[];
  try { imageUrls = await listingImageUrls(formData, parsed.data.imageUrls, "places"); }
  catch (error) { redirect(`/admin/directory?error=${encodeURIComponent(error instanceof Error ? error.message : "Photo upload failed.")}`); }

  const slug = await uniquePlaceSlug(parsed.data.name);
  await prisma.place.create({
    data: {
      ...placeValues(parsed.data), slug, status: DirectoryStatus.APPROVED,
      source: DirectorySource.ADMIN, createdById: admin.id,
      images: { create: imageUrls.map((url, sortOrder) => ({ url, altText: parsed.data.name, sortOrder })) },
    },
  });
  revalidatePath("/"); revalidatePath("/places"); revalidatePath("/search");
  redirect("/admin/directory?created=place");
}

export async function updatePlaceAction(formData: FormData) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const parsed = placeInputSchema.safeParse(valuesFrom(formData, Object.keys(placeFields.shape)));
  if (!parsed.success) redirect(`/admin/directory/places/${id}/edit?error=${encodeURIComponent(readableIssues(parsed.error))}`);
  let imageUrls: string[];
  try { imageUrls = await listingImageUrls(formData, parsed.data.imageUrls, "places"); }
  catch (error) { redirect(`/admin/directory/places/${id}/edit?error=${encodeURIComponent(error instanceof Error ? error.message : "Photo upload failed.")}`); }
  const current = await prisma.place.findUnique({ where: { id }, select: { slug: true } });
  if (!current) redirect("/admin/directory?error=Place+not+found");
  const slug = await uniquePlaceSlug(parsed.data.name, id);
  await prisma.place.update({
    where: { id },
    data: {
      ...placeValues(parsed.data), slug,
      images: { deleteMany: {}, create: imageUrls.map((url, sortOrder) => ({ url, altText: parsed.data.name, sortOrder })) },
    },
  });
  revalidatePath("/"); revalidatePath("/places"); revalidatePath(`/places/${current.slug}`); revalidatePath(`/places/${slug}`);
  redirect(`/admin/directory?updated=place`);
}

export async function changePlaceStatusAction(formData: FormData) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !Object.values(DirectoryStatus).includes(status as DirectoryStatus)) redirect("/admin/directory?error=Invalid+listing+review");
  await prisma.place.update({ where: { id }, data: { status: status as DirectoryStatus } });
  revalidatePath("/"); revalidatePath("/places"); revalidatePath("/search");
  redirect("/admin/directory?reviewed=place");
}

export async function submitPlaceSuggestionAction(formData: FormData) {
  const tourist = await requireAccountType(["TOURIST"]);
  const parsed = placeSuggestionSchema.safeParse(valuesFrom(formData, Object.keys(placeSuggestionSchema.shape)));
  if (!parsed.success) redirect(`/places/suggest?error=${encodeURIComponent(readableIssues(parsed.error))}`);
  await prisma.placeSuggestion.create({ data: { ...parsed.data, userId: tourist.id } });
  revalidatePath("/admin/directory");
  redirect("/places/suggest?submitted=1");
}

export async function reviewPlaceSuggestionAction(formData: FormData) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const suggestion = await prisma.placeSuggestion.findUnique({ where: { id } });
  if (!suggestion || suggestion.status !== DirectoryStatus.PENDING) redirect("/admin/directory?error=Suggestion+not+available");

  if (decision === "approve") {
    const slug = await uniquePlaceSlug(suggestion.name);
    await prisma.$transaction([
      prisma.place.create({ data: {
        slug, name: suggestion.name, category: suggestion.category,
        summary: suggestion.description.slice(0, 240), description: suggestion.description,
        location: suggestion.location, status: DirectoryStatus.APPROVED,
        source: DirectorySource.TOURIST_SUGGESTION,
      } }),
      prisma.placeSuggestion.update({ where: { id }, data: { status: DirectoryStatus.APPROVED } }),
    ]);
  } else if (decision === "reject") {
    await prisma.placeSuggestion.update({ where: { id }, data: { status: DirectoryStatus.REJECTED } });
  } else {
    redirect("/admin/directory?error=Invalid+suggestion+decision");
  }
  revalidatePath("/"); revalidatePath("/places"); revalidatePath("/search");
  redirect("/admin/directory?reviewed=suggestion");
}

export async function submitActivityAction(formData: FormData) {
  const guide = await requireAccountType(["TOUR_GUIDE"]);
  const application = await prisma.guideApplication.findUnique({ where: { userId: guide.id }, select: { status: true } });
  if (application?.status !== "APPROVED") redirect("/guide?error=Your+guide+application+must+be+approved+first");
  const parsed = activityInputSchema.safeParse(valuesFrom(formData, Object.keys(activityFields.shape)));
  if (!parsed.success) redirect(`/activities/suggest?error=${encodeURIComponent(readableIssues(parsed.error))}`);
  let imageUrls: string[];
  try { imageUrls = await listingImageUrls(formData, parsed.data.imageUrls, "activities"); }
  catch (error) { redirect(`/activities/suggest?error=${encodeURIComponent(error instanceof Error ? error.message : "Photo upload failed.")}`); }
  await prisma.activity.create({
    data: {
      ...activityValues(parsed.data), slug: await uniqueActivitySlug(parsed.data.name),
      status: DirectoryStatus.PENDING, source: DirectorySource.PROVIDER, createdById: guide.id,
      images: { create: imageUrls.map((url, sortOrder) => ({ url, altText: parsed.data.name, sortOrder })) },
    },
  });
  revalidatePath("/admin/directory");
  redirect("/activities/suggest?submitted=1");
}

export async function createActivityAdminAction(formData: FormData) {
  const admin = await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const parsed = activityInputSchema.safeParse(valuesFrom(formData, Object.keys(activityFields.shape)));
  if (!parsed.success) redirect(`/admin/directory/activities/new?error=${encodeURIComponent(readableIssues(parsed.error))}`);
  let imageUrls: string[];
  try { imageUrls = await listingImageUrls(formData, parsed.data.imageUrls, "activities"); }
  catch (error) { redirect(`/admin/directory/activities/new?error=${encodeURIComponent(error instanceof Error ? error.message : "Photo upload failed.")}`); }
  await prisma.activity.create({ data: {
    ...activityValues(parsed.data), slug: await uniqueActivitySlug(parsed.data.name),
    status: DirectoryStatus.APPROVED, source: DirectorySource.ADMIN, createdById: admin.id,
    images: { create: imageUrls.map((url, sortOrder) => ({ url, altText: parsed.data.name, sortOrder })) },
  } });
  revalidatePath("/"); revalidatePath("/activities"); revalidatePath("/search");
  redirect("/admin/directory?created=activity");
}

export async function updateActivityAdminAction(formData: FormData) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const parsed = activityInputSchema.safeParse(valuesFrom(formData, Object.keys(activityFields.shape)));
  if (!parsed.success) redirect(`/admin/directory/activities/${id}/edit?error=${encodeURIComponent(readableIssues(parsed.error))}`);
  let imageUrls: string[];
  try { imageUrls = await listingImageUrls(formData, parsed.data.imageUrls, "activities"); }
  catch (error) { redirect(`/admin/directory/activities/${id}/edit?error=${encodeURIComponent(error instanceof Error ? error.message : "Photo upload failed.")}`); }
  const activity = await prisma.activity.findUnique({ where: { id }, select: { slug: true } });
  if (!activity) redirect("/admin/directory?error=Activity+not+found");
  const slug = await uniqueActivitySlug(parsed.data.name, id);
  await prisma.activity.update({ where: { id }, data: {
    ...activityValues(parsed.data), slug,
    images: { deleteMany: {}, create: imageUrls.map((url, sortOrder) => ({ url, altText: parsed.data.name, sortOrder })) },
  } });
  revalidatePath("/"); revalidatePath("/activities"); revalidatePath("/search"); revalidatePath(`/activities/${activity.slug}`); revalidatePath(`/activities/${slug}`);
  redirect("/admin/directory?updated=activity");
}

export async function changeActivityStatusAction(formData: FormData) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !Object.values(DirectoryStatus).includes(status as DirectoryStatus)) redirect("/admin/directory?error=Invalid+activity+review");
  const activity = await prisma.activity.findUnique({ where: { id }, select: { slug: true } });
  if (!activity) redirect("/admin/directory?error=Activity+not+found");
  await prisma.activity.update({ where: { id }, data: { status: status as DirectoryStatus } });
  revalidatePath("/"); revalidatePath("/activities"); revalidatePath(`/activities/${activity.slug}`); revalidatePath("/search");
  redirect("/admin/directory?reviewed=activity");
}
