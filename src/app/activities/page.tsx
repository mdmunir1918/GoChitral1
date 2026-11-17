import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/ui/page-container";
import { EmptyState } from "@/components/ui/page-states";
import { ActivityCard } from "@/features/directory/components/listing-cards";
import { activityCategoryLabels } from "@/features/directory/data";
import { ActivityCategory } from "@prisma/client";

export const instant = false;
const pageSize = 12;

export default async function ActivitiesDirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; location?: string; page?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const location = params.location?.trim().slice(0, 120) ?? "";
  const category = Object.values(ActivityCategory).includes(params.category as ActivityCategory) ? params.category as ActivityCategory : undefined;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const where = {
    status: "APPROVED" as const,
    ...(category ? { category } : {}),
    ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}),
    ...(query ? { OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { summary: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [activities, total] = await Promise.all([
    prisma.activity.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.activity.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const search = new URLSearchParams();
  if (query) search.set("q", query);
  if (location) search.set("location", location);
  if (category) search.set("category", category);
  return <main className="py-12 sm:py-16"><PageContainer>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Experiences</p>
    <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Things to do in Chitral</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Explore approved activities and experiences shared by local guides.</p></div><Link href="/activities/suggest" className="text-sm font-semibold text-primary hover:underline">Guide? Submit an activity</Link></div>
    <form action="/activities" method="get" className="mt-7 grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[1fr_220px_200px_auto]">
      <input name="q" defaultValue={query} placeholder="Search activities" aria-label="Search activities" className="h-11 rounded-xl border border-border px-3 text-sm" />
      <select name="category" defaultValue={category ?? ""} aria-label="Filter by category" className="h-11 rounded-xl border border-border bg-white px-3 text-sm"><option value="">All categories</option>{Object.entries(activityCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <input name="location" defaultValue={location} placeholder="Location" aria-label="Filter by location" className="h-11 rounded-xl border border-border px-3 text-sm" />
      <button className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">Filter</button>
    </form>
    <p className="mt-6 text-sm text-muted">{total} approved {total === 1 ? "activity" : "activities"}</p>
    {activities.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</div> : <EmptyState className="mt-4" title="No approved activities yet" description="Approved guide submissions will appear here after admin review." />}
    {pageCount > 1 && <nav aria-label="Activity pages" className="mt-8 flex justify-center gap-3 text-sm">{page > 1 && <Link className="rounded-full border border-border px-4 py-2" href={`/activities?${search}&page=${page - 1}`}>Previous</Link>}<span className="px-3 py-2 text-muted">Page {page} of {pageCount}</span>{page < pageCount && <Link className="rounded-full border border-border px-4 py-2" href={`/activities?${search}&page=${page + 1}`}>Next</Link>}</nav>}
  </PageContainer></main>;
}
