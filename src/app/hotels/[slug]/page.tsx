import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/ui/page-container";
import { SaveListingButton } from "@/features/tourist/components/save-listing-button";
import { AddToTripButton } from "@/features/trips/components/add-to-trip-button";

export const instant = false;
type Params = Promise<{ slug: string }>;

export default async function HotelDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const hotel = await prisma.hotel.findFirst({ where: { slug, application: { status: ApplicationStatus.APPROVED } }, include: { images: { orderBy: { sortOrder: "asc" } }, roomTypes: { orderBy: [{ pricePerNight: "asc" }, { name: "asc" }] } } });
  if (!hotel) notFound();
  const phone = hotel.phone?.replace(/[^+\d]/g, "");
  const whatsapp = hotel.whatsapp?.replace(/\D/g, "");
  return <main className="py-10 sm:py-14"><PageContainer>
    <p className="text-sm text-primary">{hotel.location} · <Link href="/hotels" className="hover:underline">Hotels</Link></p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{hotel.name}</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted">{hotel.summary}</p>
    {hotel.images.length > 0 ? <div className="mt-7 grid gap-3 sm:grid-cols-2">{hotel.images.map((image) => <div key={image.id} className="relative min-h-56 overflow-hidden rounded-2xl"><Image unoptimized src={image.url} alt={image.altText} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /></div>)}</div> : <div className="mt-7 h-56 rounded-2xl bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-50" aria-label="No hotel photos yet" />}
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]"><div className="grid content-start gap-8"><section><h2 className="text-xl font-semibold">About this stay</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{hotel.description}</p></section>
      {hotel.amenities.length > 0 && <section><h2 className="text-xl font-semibold">Amenities</h2><ul className="mt-3 flex flex-wrap gap-2">{hotel.amenities.map((amenity) => <li key={amenity} className="rounded-full border border-border bg-white px-3 py-1.5 text-sm">{amenity}</li>)}</ul></section>}
      <section><h2 className="text-xl font-semibold">Room types and prices</h2><p className="mt-1 text-sm text-muted">Contact the hotel to confirm details and availability. This site does not take reservations.</p>{hotel.roomTypes.length ? <div className="mt-4 grid gap-3">{hotel.roomTypes.map((room) => <article key={room.id} className="rounded-2xl border border-border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{room.name}</h3><p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-muted">{room.description}</p><p className="mt-2 text-sm text-muted">Up to {room.occupancy} {room.occupancy === 1 ? "guest" : "guests"}</p></div><p className="text-right text-sm font-semibold">PKR {Number(room.pricePerNight).toLocaleString()}<span className="block font-normal text-muted">per night</span></p></div></article>)}</div> : <p className="mt-3 rounded-xl border border-dashed border-border p-5 text-sm text-muted">Room information will be added by the hotel owner.</p>}</section></div>
      <aside className="h-fit rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold">Contact the hotel</h2><p className="mt-2 text-sm leading-6 text-muted">Ask the provider directly about prices and availability.</p><div className="mt-4 grid gap-3"><SaveListingButton type="HOTEL" listingId={hotel.id} /><AddToTripButton type="HOTEL" listingId={hotel.id} /></div><div className="mt-4 grid gap-2">{phone && <a href={`tel:${phone}`} className="rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white">Call hotel</a>}{whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-semibold">WhatsApp</a>}{!phone && !whatsapp && <p className="text-sm text-muted">The hotel has not added public contact details yet.</p>}</div><p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">Booking and payment happen directly with the hotel.</p></aside>
    </div>
  </PageContainer></main>;
}
