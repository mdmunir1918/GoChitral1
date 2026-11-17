import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Compass, MapPin, Sparkles, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/page-states";
import { PageContainer } from "@/components/ui/page-container";
import { discoveryPlaces, experienceIdeas, foodIdeas } from "@/features/homepage/data";
import { prisma } from "@/lib/prisma";
import { ActivityCard, PlaceCard } from "@/features/directory/components/listing-cards";
import { HotelCard } from "@/features/hotels/components/hotel-card";
import { GuideCard } from "@/features/guides/components/guide-card";
import { ApplicationStatus } from "@prisma/client";

export const instant = false;

export default async function Home() {
  const [places, foodPlaces, activities, hotels, guides] = await Promise.all([
    prisma.place.findMany({
    where: { status: "APPROVED", category: { in: ["DESTINATION", "NATURAL_ATTRACTION", "HISTORICAL_PLACE", "CULTURAL_PLACE", "VIEWPOINT", "OTHER"] } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 4,
    }),
    prisma.place.findMany({ where: { status: "APPROVED", category: { in: ["RESTAURANT", "FOOD_SPOT"] } }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 2 }),
    prisma.activity.findMany({ where: { status: "APPROVED" }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 3 }),
    prisma.hotel.findMany({ where: { application: { status: ApplicationStatus.APPROVED } }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } }, roomTypes: { select: { pricePerNight: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 3 }),
    prisma.guideProfile.findMany({ where: { application: { status: ApplicationStatus.APPROVED } }, include: { user: { select: { image: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 3 }),
  ]);
  return (
    <main className="overflow-hidden pb-10">
      <section className="relative isolate min-h-[620px] overflow-hidden bg-[#122d2a] text-white sm:min-h-[680px]">
        <Image
          src="/images/chitral-hindukush-hero.png"
          alt="Sunrise over a green mountain valley in the Hindukush"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b211e]/90 via-[#102b28]/65 to-[#102b28]/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#10211f]/55 via-transparent to-black/10" />
        <PageContainer className="flex min-h-[620px] flex-col justify-center py-20 sm:min-h-[680px]">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 backdrop-blur-sm">
              <MapPin size={14} aria-hidden="true" /> Northern Pakistan · Hindukush
            </p>
            <h1 className="max-w-2xl text-5xl font-medium leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">Find your way to Chitral.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">Mountain valleys, local culture, and a slower kind of journey. Start exploring and make the trip your own.</p>
            <form action="/search" method="get" className="mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3 text-muted">
                <Compass size={19} aria-hidden="true" />
                <span className="sr-only">Search Chitral</span>
                <input name="q" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted" placeholder="Try a valley, place, or experience" />
              </label>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90" type="submit">Explore Chitral <ArrowRight size={16} aria-hidden="true" /></button>
            </form>
            <p className="mt-4 flex items-center gap-2 text-xs text-white/70"><Check size={14} aria-hidden="true" /> Discover freely · Contact providers directly · No online booking fees</p>
          </div>
        </PageContainer>
        <a href="#destinations" aria-label="Scroll to discover Chitral" className="absolute bottom-6 right-7 hidden size-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 sm:flex">
          <ArrowDown size={18} aria-hidden="true" />
        </a>
      </section>

      <PageContainer>
        <section id="destinations" className="scroll-mt-8 py-20 sm:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Start exploring</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Places that stay with you</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted">Begin with a valley, a town, or a stretch of high mountain road. There is no single way to see Chitral.</p>
          </div>
          {places.length > 0 ? <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{places.map((place) => <PlaceCard key={place.id} place={place} />)}</div> : <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {discoveryPlaces.map(({ slug, name, type, summary, icon: Icon, tone }, index) => (
              <Link href={`/places/${slug}`} key={slug} className="group overflow-hidden rounded-2xl border border-border bg-white transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
                <div className={`relative flex h-48 items-end overflow-hidden bg-gradient-to-br ${tone} p-5 text-white`}>
                  <div className="absolute -right-7 -top-8 size-40 rounded-full border border-white/15 transition duration-500 group-hover:scale-110" />
                  <div className="absolute -right-1 -top-1 size-28 rounded-full border border-white/15" />
                  <Icon size={54} strokeWidth={1} className="absolute right-6 top-7 text-white/65 transition duration-500 group-hover:scale-110 group-hover:text-white/90" aria-hidden="true" />
                  <span className="relative rounded-full border border-white/25 bg-black/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm">{type}</span>
                  {index === 0 && <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">A place to begin</span>}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted">{summary}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Explore place <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>}
          <Link href="/places" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Browse all places <ArrowRight size={15} aria-hidden="true" /></Link>
        </section>

        <section id="experiences" className="scroll-mt-8 rounded-[2rem] bg-[#f0f2ec] px-5 py-12 sm:px-10 sm:py-16">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-white text-primary"><Sparkles size={19} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Make it yours</p>
              <h2 className="mt-1 text-2xl font-medium tracking-tight sm:text-3xl">Ways to experience Chitral</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {experienceIdeas.map(({ title, text, icon: Icon, href }) => (
              <Link key={title} href={href} className="group flex min-h-40 items-start gap-4 rounded-2xl border border-white/70 bg-white/80 p-5 transition hover:bg-white hover:shadow-md">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon size={18} aria-hidden="true" /></span>
                <span><span className="block font-semibold">{title}</span><span className="mt-2 block text-sm leading-6 text-muted">{text}</span><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">Explore ideas <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></span>
              </Link>
            ))}
          </div>
          {activities.length > 0 && <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</div>}
          <Link href="/activities" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Browse all experiences <ArrowRight size={15} aria-hidden="true" /></Link>
        </section>

        <section id="stay" className="scroll-mt-8 py-20 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">A good place to pause</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Find a stay for your journey</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-muted">Discover locally owned stays, compare details, then contact the provider to confirm prices and availability directly.</p>
            </div>
            <div>{hotels.length ? <div className="grid gap-4">{hotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}</div> : <EmptyState title="Stay listings are on the way" description="Hotel owners can apply to join. Once listings are reviewed, you’ll find them here." className="min-h-44" />}<div className="mt-3 flex flex-wrap gap-4"><Link href="/hotels" className="inline-flex text-sm font-semibold text-primary hover:underline">Browse all hotels <ArrowRight size={14} className="ml-1" aria-hidden="true" /></Link><Link href="/register/hotel" className="inline-flex text-sm font-semibold text-primary hover:underline">Own a hotel? Apply to list it <ArrowRight size={14} className="ml-1" aria-hidden="true" /></Link></div></div>
          </div>
        </section>

        <section id="guides" className="scroll-mt-8 border-t border-border py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Local knowledge matters</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Meet guides who know the way</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-muted">A local guide can help you plan responsibly, understand the region, and make the most of your time.</p>
            </div>
            <div>{guides.length ? <div className="grid gap-4">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div> : <EmptyState title="Guide profiles are coming soon" description="Approved local guide profiles will appear here as the directory opens." className="min-h-44" />}<div className="mt-3 flex flex-wrap gap-4"><Link href="/guides" className="inline-flex text-sm font-semibold text-primary hover:underline">Browse all guides <ArrowRight size={14} className="ml-1" aria-hidden="true" /></Link><Link href="/register/guide" className="inline-flex text-sm font-semibold text-primary hover:underline">Are you a guide? Apply to join <ArrowRight size={14} className="ml-1" aria-hidden="true" /></Link></div></div>
          </div>
        </section>

        <section id="food" className="scroll-mt-8 border-t border-border py-16 sm:py-20">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">A taste of the region</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">Food and local favourites</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted">Restaurants and food spots are part of the places directory, curated to help you discover what is nearby.</p>
          </div>
          {foodPlaces.length > 0 ? <div className="mt-8 grid gap-4 sm:grid-cols-2">{foodPlaces.map((place) => <PlaceCard key={place.id} place={place} />)}</div> : <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {foodIdeas.map(({ title, text }) => <div key={title} className="rounded-2xl border border-border bg-white p-5"><div className="flex size-10 items-center justify-center rounded-full bg-amber-50 text-amber-800"><Star size={18} aria-hidden="true" /></div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div>)}
          </div>}
        </section>

        <section className="rounded-[2rem] bg-primary px-6 py-10 text-white sm:flex sm:items-center sm:justify-between sm:px-10 sm:py-12">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">Your next story starts here</p><h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">Plan a journey through Chitral</h2><p className="mt-2 max-w-lg text-sm leading-6 text-white/75">Create an account to save places and start building a private itinerary.</p></div>
          <Link href="/register" className="mt-6 inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-primary transition hover:bg-white/90 sm:mt-0">Get started <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </PageContainer>
    </main>
  );
}
