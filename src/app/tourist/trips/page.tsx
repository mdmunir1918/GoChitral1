import Link from "next/link";
import { archiveTrip, createTrip, restoreTrip } from "@/features/trips/actions";
import { StatusMessage } from "@/features/tourist/components/tourist-workspace";
import { requireAccountType } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const instant = false;
type Search = Promise<{ status?: string }>;

function dateLabel(date: Date) {
  return date.toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "UTC" });
}

function todayInChitral() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Karachi" });
}

export default async function TouristTripsPage({ searchParams }: { searchParams: Search }) {
  const user = await requireAccountType(["TOURIST"]);
  const [params, trips] = await Promise.all([
    searchParams,
    prisma.trip.findMany({
      where: { userId: user.id },
      orderBy: [{ archivedAt: "asc" }, { startDate: "asc" }],
      include: { _count: { select: { days: true } } },
    }),
  ]);
  const today = todayInChitral();
  const tomorrow = new Date(new Date(`${today}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const activeTrips = trips.filter((trip) => !trip.archivedAt && trip.endDate.toISOString().slice(0, 10) >= today);
  const archivedTrips = trips.filter((trip) => trip.archivedAt || trip.endDate.toISOString().slice(0, 10) < today);
  return (
    <div className="grid gap-8">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your private plans</p><h2 className="mt-2 text-2xl font-medium">My trips</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Plan your days, keep useful listings together, and save accommodation details. Your trips are private to your account.</p></div>
      <StatusMessage status={params.status} />
      <form action={createTrip} className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div><h3 className="text-lg font-semibold">Plan a trip</h3></div>
        <label className="grid gap-2 text-sm font-medium">Trip name<input name="title" required minLength={2} maxLength={120} placeholder="e.g. A week in Chitral" className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Start date<input name="startDate" type="date" required defaultValue={today} className="h-11 rounded-xl border border-border px-3 font-normal" /></label><label className="grid gap-2 text-sm font-medium">End date<input name="endDate" type="date" required defaultValue={tomorrow} className="h-11 rounded-xl border border-border px-3 font-normal" /></label></div>
        <p className="text-xs text-muted">Choose dates up to 30 days apart. Trip planning does not make bookings.</p>
        <button className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90">Create trip</button>
      </form>
      <section className="grid gap-4">
        <h3 className="text-lg font-semibold">Current and upcoming trips</h3>
        {activeTrips.length ? <div className="grid gap-3 sm:grid-cols-2">{activeTrips.map((trip) => <article key={trip.id} className="rounded-2xl border border-border bg-white p-5"><Link href={`/tourist/trips/${trip.id}`} className="group"><h4 className="text-lg font-semibold group-hover:text-primary">{trip.title}</h4><p className="mt-2 text-sm text-muted">{dateLabel(trip.startDate)} – {dateLabel(trip.endDate)} · {trip._count.days} {trip._count.days === 1 ? "day" : "days"}</p>{trip.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{trip.description}</p>}</Link><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><Link href={`/tourist/trips/${trip.id}`} className="text-sm font-semibold text-primary hover:underline">Open itinerary</Link><form action={archiveTrip}><input type="hidden" name="tripId" value={trip.id} /><button className="text-sm text-muted hover:text-foreground">Mark complete</button></form></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-border bg-white p-6"><p className="font-medium">No current trips</p><p className="mt-2 text-sm text-muted">Create a trip to start adding places and activities.</p></div>}
      </section>
      {archivedTrips.length > 0 && <section className="grid gap-4"><h3 className="text-lg font-semibold">Archives</h3><div className="grid gap-3 sm:grid-cols-2">{archivedTrips.map((trip) => <article key={trip.id} className="rounded-2xl border border-border bg-white p-5"><h4 className="font-semibold">{trip.title}</h4><p className="mt-2 text-sm text-muted">{dateLabel(trip.startDate)} – {dateLabel(trip.endDate)}</p>{trip.endDate.toISOString().slice(0, 10) >= today && trip.archivedAt && <form action={restoreTrip} className="mt-4 border-t border-border pt-3"><input type="hidden" name="tripId" value={trip.id} /><button className="text-sm font-semibold text-primary hover:underline">Restore trip</button></form>}{trip.endDate.toISOString().slice(0, 10) < today && <p className="mt-3 text-xs text-muted">Archived after the trip end date</p>}</article>)}</div></section>}
    </div>
  );
}
