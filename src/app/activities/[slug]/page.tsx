import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";
import { prisma } from "@/lib/prisma";
import { activityCategoryLabels } from "@/features/directory/data";
import { SaveListingButton } from "@/features/tourist/components/save-listing-button";
import { AddToTripButton } from "@/features/trips/components/add-to-trip-button";
import { ListingMap } from "@/features/maps/components/listing-map";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const activity = await prisma.activity.findFirst({ where: { slug, status: "APPROVED" }, select: { name: true, summary: true } });
  return activity ? { title: `${activity.name} | GoChitral`, description: activity.summary } : { title: "Activity not found | GoChitral" };
}

export default async function ActivityDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const activity = await prisma.activity.findFirst({ where: { slug, status: "APPROVED" }, include: { images: { orderBy: { sortOrder: "asc" } } } });
  if (!activity) notFound();
  return <main className="pb-16">
    <div className="relative h-[340px] overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-sky-800 sm:h-[430px]">
      {activity.images[0] && <Image src={activity.images[0].url} alt={activity.images[0].altText} fill unoptimized sizes="100vw" className="object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b211e]/90 via-[#0b211e]/25 to-transparent" />
      <PageContainer className="relative flex h-full flex-col justify-end pb-9 text-white sm:pb-12"><Link href="/activities" className="mb-6 inline-flex w-fit items-center gap-2 text-sm text-white/80 hover:text-white"><ArrowLeft size={15} aria-hidden="true" /> All activities</Link><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">{activityCategoryLabels[activity.category]}</p><h1 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl">{activity.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{activity.summary}</p></PageContainer>
    </div>
    {activity.images.length > 1 && <PageContainer className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-3">{activity.images.slice(1, 4).map((image) => <div key={image.id} className="relative h-36 overflow-hidden rounded-xl bg-background"><Image src={image.url} alt={image.altText} fill unoptimized sizes="33vw" className="object-cover" /></div>)}</PageContainer>}
    {activity.latitude !== null && activity.longitude !== null && <PageContainer className="pt-8"><ListingMap points={[{ id: activity.id, title: activity.name, location: activity.location, latitude: activity.latitude, longitude: activity.longitude }]} label={`Map location for ${activity.name}`} /></PageContainer>}
    <PageContainer className="grid gap-10 py-10 lg:grid-cols-[1fr_330px]"><article className="max-w-3xl"><p className="flex items-center gap-2 text-sm text-muted"><MapPin size={16} className="text-primary" aria-hidden="true" />{activity.location}</p><h2 className="mt-7 text-2xl font-semibold">About this activity</h2><p className="mt-4 whitespace-pre-line text-base leading-8 text-muted">{activity.description}</p></article><aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Indicative price</h2><p className="mt-2 text-sm leading-6 text-muted">{activity.priceRange ?? "Ask the guide for current pricing."}</p><div className="mt-4 grid gap-3"><SaveListingButton type="ACTIVITY" listingId={activity.id} /><AddToTripButton type="ACTIVITY" listingId={activity.id} /></div><p className="mt-4 text-xs leading-5 text-muted">Save this experience for later or add it to a trip. Contact the provider directly to confirm arrangements. This platform does not take bookings or payments.</p></aside></PageContainer>
  </main>;
}
