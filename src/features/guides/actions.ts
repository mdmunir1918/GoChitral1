"use server";

import { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAccountType } from "@/lib/authz";
import { parseImageUrls, slugify } from "@/features/directory/data";
import { uploadListingImages } from "@/features/directory/r2-images";
import { guideFormData, guideProfileSchema, guideValidationMessage } from "./schemas";

export async function updateGuideProfileAction(formData: FormData) {
  const user = await requireAccountType(["TOUR_GUIDE"]);
  const application = await prisma.guideApplication.findUnique({ where: { userId: user.id }, select: { id: true, status: true } });
  if (!application || application.status !== ApplicationStatus.APPROVED) redirect("/guide?error=Your+guide+application+must+be+approved+before+editing+your+profile");
  const parsed = guideProfileSchema.safeParse(guideFormData(formData));
  if (!parsed.success) redirect(`/guide?error=${encodeURIComponent(guideValidationMessage(parsed.error))}`);

  let imageUrls: string[];
  let profileImage: string | undefined;
  try {
    const links = parseImageUrls(parsed.data.imageUrls);
    const uploaded = await uploadListingImages(formData.getAll("images"), "guides");
    const profileFiles = formData.getAll("profileImage").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (profileFiles.length > 1) throw new Error("Choose one profile photo.");
    profileImage = (await uploadListingImages(profileFiles, "guides"))[0];
    imageUrls = [...links, ...uploaded];
  } catch (error) {
    redirect(`/guide?error=${encodeURIComponent(error instanceof Error ? error.message : "Portfolio photo upload failed.")}`);
  }

  const profile = await prisma.guideProfile.findUnique({ where: { userId: user.id }, select: { id: true, slug: true } });
  if (!profile) redirect("/guide?error=Guide+profile+is+not+available");
  const nextSlug = `${slugify(parsed.data.name)}-${user.id.slice(-6).toLowerCase()}`;
  await prisma.guideProfile.update({ where: { id: profile.id }, data: {
    name: parsed.data.name,
    summary: parsed.data.biography.slice(0, 240),
    biography: parsed.data.biography,
    experienceYears: parsed.data.experienceYears,
    languages: splitList(parsed.data.languages),
    regionsCovered: splitList(parsed.data.regionsCovered),
    specialties: splitList(parsed.data.specialties),
    services: splitList(parsed.data.services),
    pricingInformation: parsed.data.pricingInformation || null,
    phone: parsed.data.phone,
    whatsapp: parsed.data.whatsapp,
    slug: nextSlug,
    ...(imageUrls.length ? { images: { deleteMany: {}, create: imageUrls.map((url, sortOrder) => ({ url, altText: `${parsed.data.name} portfolio photo`, sortOrder })) } } : {}),
  } });
  if (profileImage) await prisma.user.update({ where: { id: user.id }, data: { image: profileImage } });
  revalidatePath("/guides"); revalidatePath(`/guides/${profile.slug}`); revalidatePath(`/guides/${nextSlug}`); revalidatePath("/");
  redirect("/guide?saved=1");
}

export async function reviewGuideApplicationAction(formData: FormData) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const application = await prisma.guideApplication.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
  if (!application || application.status !== ApplicationStatus.PENDING) redirect("/admin/guide-applications?error=Application+is+not+available");
  if (decision !== "approve" && decision !== "reject") redirect("/admin/guide-applications?error=Invalid+review+decision");

  if (decision === "reject") {
    await prisma.guideApplication.update({ where: { id }, data: { status: ApplicationStatus.REJECTED } });
  } else {
    const name = application.user.name ?? "Local guide";
    const slug = `${slugify(name)}-${application.userId.slice(-6).toLowerCase()}`;
    await prisma.$transaction([
      prisma.guideApplication.update({ where: { id }, data: { status: ApplicationStatus.APPROVED } }),
      prisma.guideProfile.upsert({ where: { applicationId: id }, create: {
        userId: application.userId,
        applicationId: id,
        slug,
        name,
        summary: application.biography.slice(0, 240),
        biography: application.biography,
        experienceYears: application.experienceYears,
        languages: application.languages,
        regionsCovered: application.regionsCovered,
        specialties: application.specialties,
        services: application.services,
        phone: application.phone,
        whatsapp: application.whatsapp,
      }, update: {} }),
    ]);
  }
  revalidatePath("/admin/guide-applications"); revalidatePath("/guide"); revalidatePath("/guides"); revalidatePath("/");
  redirect(`/admin/guide-applications?reviewed=${decision}`);
}

function splitList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}
