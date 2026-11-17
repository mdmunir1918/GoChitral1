import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccountType } from "@/lib/authz";

export const instant = false;

export default async function TouristHomePage() {
  const user = await requireAccountType(["TOURIST"]);
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Karachi" });
  const startOfToday = new Date(`${today}T00:00:00.000Z`);
  const [profile, tripsCount, savedCount, hotels, guides, places, activities] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, touristProfile: { select: { travelInterests: true } } } }),
    prisma.trip.count({ where: { userId: user.id, archivedAt: null, endDate: { gte: startOfToday } } }),
    prisma.savedListing.count({ where: { userId: user.id } }),
    prisma.hotel.findMany({ where: { application: { status: "APPROVED" } }, take: 3, orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, location: true, summary: true } }),
    prisma.guideProfile.findMany({ where: { application: { status: "APPROVED" } }, take: 3, orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, summary: true, regionsCovered: true } }),
    prisma.place.findMany({ where: { status: "APPROVED" }, take: 3, orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, location: true, summary: true, category: true } }),
    prisma.activity.findMany({ where: { status: "APPROVED" }, take: 3, orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, location: true, summary: true } }),
  ]);

  const sections = [
    { title: "Recommended places", href: "/places", rows: places.map((item) => ({ title: item.name, detail: `${item.location} · ${item.summary}`, href: `/places/${item.slug}` })) },
    { title: "Recommended experiences", href: "/activities", rows: activities.map((item) => ({ title: item.name, detail: `${item.location} · ${item.summary}`, href: `/activities/${item.slug}` })) },
    { title: "Places to stay", href: "/hotels", rows: hotels.map((item) => ({ title: item.name, detail: `${item.location} · ${item.summary}`, href: `/hotels/${item.slug}` })) },
    { title: "Local guides", href: "/guides", rows: guides.map((item) => ({ title: item.name, detail: `${item.regionsCovered.slice(0, 2).join(", ") || "Chitral"} · ${item.summary}`, href: `/guides/${item.slug}` })) },
  ];

  return (
    <div className="grid gap-8">
      <section className="rounded-3xl bg-[#14332d] p-6 text-white sm:p-8">
        <p className="text-sm text-white/70">Welcome back{profile?.name ? `, ${profile.name}` : ""}</p>
        <h2 className="mt-2 max-w-2xl text-2xl font-medium sm:text-3xl">Start gathering ideas for your trip through Chitral.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Save places you like or organize them into a private, day-by-day itinerary.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/tourist/trips" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#14332d]">Create or open a trip</Link><Link href="/places" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white">Explore destinations</Link><Link href="/tourist/saved" className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white">Saved places ({savedCount})</Link></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[{ label: "My trips", value: tripsCount, href: "/tourist/trips", note: "Your active itineraries" }, { label: "Saved places", value: savedCount, href: "/tourist/saved", note: "Your private collection" }, { label: "Travel preferences", value: profile?.touristProfile?.travelInterests.length ?? 0, href: "/tourist/preferences", note: "Optional profile details" }].map((card) => <Link key={card.label} href={card.href} className="rounded-2xl border border-border bg-white p-5 transition hover:border-primary"><p className="text-sm text-muted">{card.label}</p><p className="mt-2 text-2xl font-semibold">{card.value}</p><p className="mt-1 text-xs text-muted">{card.note}</p></Link>)}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {sections.map((section) => <section key={section.title} className="rounded-2xl border border-border bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{section.title}</h2><Link href={section.href} className="text-sm font-medium text-primary hover:underline">See all</Link></div>{section.rows.length ? <div className="mt-4 grid gap-3">{section.rows.map((row) => <Link key={row.href} href={row.href} className="rounded-xl border border-border/80 p-4 transition hover:border-primary"><h3 className="font-medium">{row.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{row.detail}</p></Link>)}</div> : <p className="mt-4 rounded-xl bg-background p-4 text-sm leading-6 text-muted">No approved listings here yet. Browse the directory for updates.</p>}</section>)}
      </div>
      <section className="rounded-2xl border border-dashed border-border bg-white/70 p-5 sm:p-6"><h2 className="font-semibold">More tools are on the way</h2><p className="mt-2 text-sm leading-6 text-muted">Messaging, notifications, and reviews will arrive in their upcoming phases. Your account, trips, and saved listings are private to you.</p><div className="mt-4 flex flex-wrap gap-4 text-sm"><Link href="/tourist/profile" className="font-medium text-primary hover:underline">Personal information</Link><Link href="/tourist/preferences" className="font-medium text-primary hover:underline">Travel preferences</Link><Link href="/tourist/settings" className="font-medium text-primary hover:underline">Account settings</Link></div></section>
    </div>
  );
}
