import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import { PageContainer } from "@/components/ui/page-container";
import { prisma } from "@/lib/prisma";
import { SaveListingButton } from "@/features/tourist/components/save-listing-button";
import { AddToTripButton } from "@/features/trips/components/add-to-trip-button";

export const instant = false;
type Params = Promise<{ slug: string }>;

export default async function GuideDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const guide = await prisma.guideProfile.findFirst({ where: { slug, application: { status: ApplicationStatus.APPROVED } }, include: { user: { select: { image: true } }, images: { orderBy: { sortOrder: "asc" } } } });
  if (!guide) notFound();
  const phone = guide.phone.replace(/[^+\d]/g, "");
  const whatsapp = guide.whatsapp.replace(/\D/g, "");
  return <main className="py-10 sm:py-14"><PageContainer>
    <p className="text-sm text-primary"><Link href="/guides" className="hover:underline">Local guides</Link> · {guide.regionsCovered.join(" · ")}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{guide.name}</h1><p className="mt-2 text-sm text-muted">{guide.experienceYears} years of local guiding experience</p>
    {guide.images.length > 0 ? <div className="mt-7 grid gap-3 sm:grid-cols-2">{guide.images.map((image) => <div key={image.id} className="relative min-h-56 overflow-hidden rounded-2xl"><Image unoptimized src={image.url} alt={image.altText} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /></div>)}</div> : guide.user.image && <div className="relative mt-7 h-72 max-w-xl overflow-hidden rounded-2xl"><Image unoptimized src={guide.user.image} alt={`${guide.name} profile photo`} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" /></div>}
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]"><div className="grid content-start gap-7"><section><h2 className="text-xl font-semibold">About</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{guide.biography}</p></section>
      <section><h2 className="text-xl font-semibold">Languages</h2><p className="mt-2 text-sm text-muted">{guide.languages.join(" · ")}</p></section>
      {guide.specialties.length > 0 && <section><h2 className="text-xl font-semibold">Specialties</h2><ul className="mt-3 flex flex-wrap gap-2">{guide.specialties.map((value) => <li key={value} className="rounded-full border border-border bg-white px-3 py-1.5 text-sm">{value}</li>)}</ul></section>}
      {guide.services.length > 0 && <section><h2 className="text-xl font-semibold">Services</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{guide.services.map((value) => <li key={value} className="rounded-xl border border-border bg-white p-3 text-sm">{value}</li>)}</ul></section>}
      {guide.pricingInformation && <section><h2 className="text-xl font-semibold">Pricing information</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{guide.pricingInformation}</p></section>}</div>
      <aside className="h-fit rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold">Contact this guide</h2><p className="mt-2 text-sm leading-6 text-muted">Contact the guide directly to discuss your plans and rates.</p><div className="mt-4 grid gap-3"><SaveListingButton type="GUIDE" listingId={guide.id} /><AddToTripButton type="GUIDE" listingId={guide.id} /></div><div className="mt-4 grid gap-2"><a href={`tel:${phone}`} className="rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white">Call guide</a><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-semibold">WhatsApp</a></div><p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">You can add this guide to a trip for reference. The platform does not arrange bookings or payments.</p></aside>
    </div>
  </PageContainer></main>;
}
