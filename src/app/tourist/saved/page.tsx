import Link from "next/link";
import { removeSavedListing } from "@/features/tourist/actions";
import { StatusMessage } from "@/features/tourist/components/tourist-workspace";
import { requireAccountType } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const instant = false;
type Search = Promise<{ status?: string }>;

export default async function TouristSavedPage({ searchParams }: { searchParams: Search }) {
  const user = await requireAccountType(["TOURIST"]);
  const [params, records] = await Promise.all([
    searchParams,
    prisma.savedListing.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        place: { select: { name: true, slug: true, summary: true, location: true, status: true } },
        activity: { select: { name: true, slug: true, summary: true, location: true, status: true } },
        hotel: { select: { name: true, slug: true, summary: true, location: true, application: { select: { status: true } } } },
        guideProfile: { select: { name: true, slug: true, summary: true, regionsCovered: true, application: { select: { status: true } } } },
      },
    }),
  ]);

  const items = records.flatMap((record) => {
    if (record.place?.status === "APPROVED") return [{ id: record.id, title: record.place.name, detail: `${record.place.location} · ${record.place.summary}`, href: `/places/${record.place.slug}`, kind: "Place" }];
    if (record.activity?.status === "APPROVED") return [{ id: record.id, title: record.activity.name, detail: `${record.activity.location} · ${record.activity.summary}`, href: `/activities/${record.activity.slug}`, kind: "Experience" }];
    if (record.hotel?.application.status === "APPROVED") return [{ id: record.id, title: record.hotel.name, detail: `${record.hotel.location} · ${record.hotel.summary}`, href: `/hotels/${record.hotel.slug}`, kind: "Stay" }];
    if (record.guideProfile?.application.status === "APPROVED") return [{ id: record.id, title: record.guideProfile.name, detail: `${record.guideProfile.regionsCovered.slice(0, 2).join(", ") || "Chitral"} · ${record.guideProfile.summary}`, href: `/guides/${record.guideProfile.slug}`, kind: "Guide" }];
    return [];
  });

  return <div className="grid gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your collection</p><h2 className="mt-2 text-2xl font-medium">Saved places</h2><p className="mt-2 text-sm text-muted">Keep approved places, experiences, stays, and local guides together for later.</p></div><StatusMessage status={params.status} />{items.length ? <div className="grid gap-3 sm:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border border-border bg-white p-5"><Link href={item.href} className="group"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.kind}</p><h3 className="mt-2 font-semibold group-hover:text-primary">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{item.detail}</p></Link><form action={removeSavedListing} className="mt-4 border-t border-border pt-3"><input type="hidden" name="savedListingId" value={item.id} /><button className="text-sm font-medium text-muted hover:text-rose-700">Remove from saved</button></form></article>)}</div> : <section className="rounded-2xl border border-dashed border-border bg-white p-7"><h3 className="font-semibold">Nothing saved yet</h3><p className="mt-2 max-w-lg text-sm leading-6 text-muted">Open a place, activity, hotel, or guide and choose “Save to my places” to keep it here.</p><Link href="/places" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Browse places</Link></section>}</div>;
}
