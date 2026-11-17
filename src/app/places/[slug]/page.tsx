import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MapPin, Mountain } from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";
import { discoveryPlaces } from "@/features/homepage/data";
import { prisma } from "@/lib/prisma";
import { placeCategoryLabels } from "@/features/directory/data";
import { SaveListingButton } from "@/features/tourist/components/save-listing-button";
import { AddToTripButton } from "@/features/trips/components/add-to-trip-button";
import { ListingMap } from "@/features/maps/components/listing-map";

export const instant = false;

export function generateStaticParams() {
  return discoveryPlaces.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const directoryPlace = await prisma.place.findFirst({ where: { slug, status: "APPROVED" }, select: { name: true, summary: true } });
  if (directoryPlace) return { title: `${directoryPlace.name} | GoChitral`, description: directoryPlace.summary };
  const place = discoveryPlaces.find((entry) => entry.slug === slug);
  if (!place) return { title: "Place not found | GoChitral" };
  return { title: `${place.name} | GoChitral`, description: place.summary };
}

export default async function PlaceDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const directoryPlace = await prisma.place.findFirst({ where: { slug, status: "APPROVED" }, include: { images: { orderBy: { sortOrder: "asc" } } } });
  if (directoryPlace) return (
    <main className="pb-16">
      <div className="relative h-[340px] overflow-hidden bg-[#14332d] sm:h-[430px]">
        {directoryPlace.images[0] && <Image src={directoryPlace.images[0].url} alt={directoryPlace.images[0].altText} fill unoptimized sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b211e]/90 via-[#0b211e]/25 to-transparent" />
        <PageContainer className="relative flex h-full flex-col justify-end pb-9 text-white sm:pb-12">
          <Link href="/places" className="mb-6 inline-flex w-fit items-center gap-2 text-sm text-white/80 transition hover:text-white"><ArrowLeft size={15} aria-hidden="true" /> All places</Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">{placeCategoryLabels[directoryPlace.category]}</p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl">{directoryPlace.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{directoryPlace.summary}</p>
        </PageContainer>
      </div>
      {directoryPlace.images.length > 1 && <PageContainer className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-3">{directoryPlace.images.slice(1, 4).map((image) => <div key={image.id} className="relative h-36 overflow-hidden rounded-xl bg-background"><Image src={image.url} alt={image.altText} fill unoptimized sizes="33vw" className="object-cover" /></div>)}</PageContainer>}
      {directoryPlace.latitude !== null && directoryPlace.longitude !== null && <PageContainer className="pt-8"><ListingMap points={[{ id: directoryPlace.id, title: directoryPlace.name, location: directoryPlace.location, latitude: directoryPlace.latitude, longitude: directoryPlace.longitude }]} label={`Map location for ${directoryPlace.name}`} /></PageContainer>}
      <PageContainer className="grid gap-10 py-10 lg:grid-cols-[1fr_330px] lg:py-14">
        <article className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-muted"><MapPin size={16} className="text-primary" aria-hidden="true" /> {directoryPlace.location}</div>
          <h2 className="mt-7 text-2xl font-semibold tracking-tight">A little about this place</h2><p className="mt-4 whitespace-pre-line text-base leading-8 text-muted">{directoryPlace.description}</p>
          {(directoryPlace.cuisine || directoryPlace.specialties.length > 0 || directoryPlace.menuInformation || directoryPlace.priceRange || directoryPlace.openingHours) && <section className="mt-8 rounded-2xl border border-border bg-white p-5"><h2 className="text-lg font-semibold">Visitor information</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2">{directoryPlace.cuisine && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Cuisine</dt><dd className="mt-1 text-sm">{directoryPlace.cuisine}</dd></div>}{directoryPlace.specialties.length > 0 && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Specialties</dt><dd className="mt-1 text-sm">{directoryPlace.specialties.join(", ")}</dd></div>}{directoryPlace.priceRange && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Price range</dt><dd className="mt-1 text-sm">{directoryPlace.priceRange}</dd></div>}{directoryPlace.openingHours && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Opening hours</dt><dd className="mt-1 text-sm">{directoryPlace.openingHours}</dd></div>}</dl>{directoryPlace.menuInformation && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted">{directoryPlace.menuInformation}</p>}</section>}
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><Check size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><p>Travel conditions can change. Confirm access, transport, and local guidance before you depart.</p></div>
        </article>
        <aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm"><div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><Mountain size={19} aria-hidden="true" /></div><h2 className="mt-4 text-lg font-semibold">Contact and plan</h2><p className="mt-2 text-sm leading-6 text-muted">Save this place or add it to a day in one of your trips.</p><div className="mt-4 grid gap-3"><SaveListingButton type="PLACE" listingId={directoryPlace.id} /><AddToTripButton type="PLACE" listingId={directoryPlace.id} /></div>{directoryPlace.phone && <a href={`tel:${directoryPlace.phone}`} className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white">Call {directoryPlace.phone}</a>}{directoryPlace.whatsapp && <a href={`https://wa.me/${directoryPlace.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-semibold">WhatsApp</a>}{directoryPlace.contactUrl && <a href={directoryPlace.contactUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex w-full justify-center text-sm font-medium text-primary hover:underline">Visit website</a>}</aside>
      </PageContainer>
    </main>
  );
  const place = discoveryPlaces.find((entry) => entry.slug === slug);
  if (!place) notFound();

  return (
    <main className="pb-16">
      <div className="relative h-[340px] overflow-hidden bg-[#14332d] sm:h-[430px]">
        <Image src="/images/chitral-hindukush-hero.png" alt="Mountain landscape of the Hindukush region" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b211e]/90 via-[#0b211e]/25 to-transparent" />
        <PageContainer className="relative flex h-full flex-col justify-end pb-9 text-white sm:pb-12">
          <Link href="/#destinations" className="mb-6 inline-flex w-fit items-center gap-2 text-sm text-white/80 transition hover:text-white"><ArrowLeft size={15} aria-hidden="true" /> All places</Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">{place.type}</p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl">{place.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{place.summary}</p>
        </PageContainer>
      </div>

      <PageContainer className="grid gap-10 py-10 lg:grid-cols-[1fr_330px] lg:py-14">
        <article className="max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-muted"><MapPin size={16} className="text-primary" aria-hidden="true" /> Chitral, Khyber Pakhtunkhwa, Pakistan</div>
          <h2 className="mt-7 text-2xl font-semibold tracking-tight">A little about this place</h2>
          <p className="mt-4 text-base leading-8 text-muted">{place.detail}</p>
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><Check size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><p>Travel conditions can change. Confirm access, transport, and local guidance before you depart.</p></div>
        </article>
        <aside className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><Mountain size={19} aria-hidden="true" /></div>
          <h2 className="mt-4 text-lg font-semibold">Add it to your journey</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Add this discovery idea as a personal stop in your trip itinerary.</p>
          <div className="mt-5"><AddToTripButton type="CUSTOM" customTitle={place.name} customLocation="Chitral, Khyber Pakhtunkhwa" /></div>
        </aside>
      </PageContainer>
    </main>
  );
}
