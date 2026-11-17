import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import {
  addListingToTrip,
  addTripAccommodation,
  addTripDay,
  archiveTrip,
  moveItineraryItem,
  removeItineraryItem,
  removeTripAccommodation,
  restoreTrip,
  updateItineraryItem,
  updateTrip,
  updateTripDayNotes,
  updateTripAccommodation,
} from "@/features/trips/actions";
import { AddListingForm } from "@/features/trips/components/add-listing-form";
import { StatusMessage } from "@/features/tourist/components/tourist-workspace";
import { requireAccountType } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const instant = false;
type Params = Promise<{ tripId: string }>;
type Search = Promise<{ status?: string }>;

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateLabel(date: Date) {
  return date.toLocaleDateString("en-PK", { dateStyle: "full", timeZone: "UTC" });
}

function mapUrl(latitude: number | null, longitude: number | null, location: string) {
  const query = latitude !== null && longitude !== null ? `${latitude},${longitude}` : location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function localToday() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Karachi" });
}

export default async function TouristTripDetailPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const user = await requireAccountType(["TOURIST"]);
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const [trip, places, activities, hotels, guides] = await Promise.all([
    prisma.trip.findFirst({
      where: { id: tripId, userId: user.id },
      include: {
        days: { orderBy: { dayNumber: "asc" }, include: { items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } } },
        accommodations: { orderBy: { checkIn: "asc" }, include: { hotel: { select: { slug: true } } } },
      },
    }),
    prisma.place.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { id: true, name: true, category: true } }),
    prisma.activity.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { id: true, name: true, location: true } }),
    prisma.hotel.findMany({ where: { application: { status: ApplicationStatus.APPROVED } }, orderBy: { name: "asc" }, select: { id: true, name: true, location: true } }),
    prisma.guideProfile.findMany({ where: { application: { status: ApplicationStatus.APPROVED } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!trip) notFound();
  const dateCompleted = dateInput(trip.endDate) < localToday();
  const archived = Boolean(trip.archivedAt) || dateCompleted;
  const configuredAppUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? process.env.AUTH_URL;
  const appUrl = configuredAppUrl?.startsWith("https://") ? new URL(configuredAppUrl).origin : "https://gochitral.vercel.app";
  const itineraryText = [
    `My trip: ${trip.title}`,
    `${dateLabel(trip.startDate)} – ${dateLabel(trip.endDate)}`,
    ...trip.days.flatMap((day) => [
      `\nDay ${day.dayNumber} · ${dateLabel(day.date)}`,
      ...day.items.map((item) => `• ${item.startTime ? `${item.startTime} — ` : ""}${item.title}${item.location ? ` (${item.location})` : ""}`),
    ]),
    "\nPlanned with GoChitral",
    appUrl,
  ].join("\n");
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(itineraryText)}`;

  return (
    <div className="grid gap-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Link href="/tourist/trips" className="text-sm font-medium text-primary hover:underline">← My trips</Link><p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Private itinerary</p><h2 className="mt-2 text-3xl font-medium tracking-tight">{trip.title}</h2><p className="mt-2 text-sm text-muted">{dateLabel(trip.startDate)} – {dateLabel(trip.endDate)} · {trip.days.length} {trip.days.length === 1 ? "day" : "days"}</p>{trip.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{trip.description}</p>}</div>
        <div className="flex flex-wrap gap-2"><a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#168b55] px-4 py-2.5 text-sm font-semibold text-white">Share on WhatsApp</a>{archived ? !dateCompleted && <form action={restoreTrip}><input type="hidden" name="tripId" value={trip.id} /><button className="rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold">Restore trip</button></form> : <form action={archiveTrip}><input type="hidden" name="tripId" value={trip.id} /><button className="rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold">Mark trip complete</button></form>}</div>
      </div>
      <StatusMessage status={query.status} />
      {archived && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">{dateCompleted ? "This trip moved to your archives because its end date has passed." : "This trip is archived. Restore it to make changes."}</p>}

      {!archived && <details className="rounded-2xl border border-border bg-white p-5"><summary className="cursor-pointer font-semibold">Edit trip details</summary><form action={updateTrip} className="mt-4 grid gap-4"><input type="hidden" name="tripId" value={trip.id} /><label className="grid gap-2 text-sm font-medium">Trip name<input name="title" defaultValue={trip.title} required minLength={2} maxLength={120} className="h-11 rounded-xl border border-border px-3 font-normal" /></label><label className="grid gap-2 text-sm font-medium">Short description<textarea name="description" defaultValue={trip.description ?? ""} maxLength={1000} rows={3} className="rounded-xl border border-border p-3 font-normal" /></label><p className="text-xs text-muted">Trip dates are set when you create it. Add a day at the end of the itinerary to extend your trip.</p><button className="w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">Save trip details</button></form></details>}

      <nav aria-label="Trip days" className="flex gap-2 overflow-x-auto pb-2">{trip.days.map((day) => <a key={day.id} href={`#${day.id}`} className="shrink-0 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary">Day {day.dayNumber}</a>)}{!archived && trip.days.length < 30 && <form action={addTripDay} className="shrink-0"><input type="hidden" name="tripId" value={trip.id} /><button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">+ Add day</button></form>}</nav>

      <div className="grid gap-6">
        {trip.days.map((day) => <section key={day.id} id={day.id} className="scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Day {day.dayNumber}</p><h3 className="mt-1 text-xl font-semibold">{dateLabel(day.date)}</h3></div><span className="rounded-full bg-background px-3 py-1 text-xs text-muted">{day.items.length} {day.items.length === 1 ? "item" : "items"}</span></div>
          {!archived && <form action={updateTripDayNotes} className="mt-4 flex flex-col gap-2 sm:flex-row"><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="dayId" value={day.id} /><input type="hidden" name="dayAnchor" value={day.id} /><input name="notes" defaultValue={day.notes ?? ""} maxLength={1000} placeholder="Add a note for this day (optional)" className="h-10 min-w-0 flex-1 rounded-xl border border-border px-3 text-sm" /><button className="rounded-full border border-border px-4 py-2 text-sm font-medium">Save day note</button></form>}
          <div className="mt-4 grid gap-3">{day.items.map((item, index) => <article key={item.id} className="rounded-xl border border-border/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.type === "PLACE" ? "Place or food spot" : item.type === "ACTIVITY" ? "Activity" : item.type === "HOTEL" ? "Hotel visit" : item.type === "GUIDE" ? "Guide" : "Custom plan"}</p><h4 className="mt-1 font-semibold">{item.title}</h4>{item.startTime && <p className="mt-1 text-xs text-muted">{item.startTime}</p>}{item.location && <p className="mt-1 text-sm text-muted">{item.location}</p>}{item.priceInformation && <p className="mt-2 text-sm font-medium">Indicative price: {item.priceInformation}</p>}{item.latitude !== null && item.longitude !== null && <a href={mapUrl(item.latitude, item.longitude, item.location ?? "")} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Open map location</a>}{item.location && (item.latitude === null || item.longitude === null) && <a href={mapUrl(null, null, item.location)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Search map</a>}</div></div>
            {item.notes && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{item.notes}</p>}
            {!archived && <div className="mt-4 grid gap-3 border-t border-border pt-3">
              <details><summary className="cursor-pointer text-sm font-medium text-primary">Edit item</summary><form action={updateItineraryItem} className="mt-3 grid gap-3"><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="tripId" value={trip.id} /><label className="grid gap-1 text-xs font-semibold">Title<input name="title" defaultValue={item.title} required minLength={2} maxLength={180} className="h-10 rounded-lg border border-border px-3 text-sm font-normal" /></label><div className="grid gap-3 sm:grid-cols-[140px_1fr]"><label className="grid gap-1 text-xs font-semibold">Start time<input name="startTime" type="time" defaultValue={item.startTime ?? ""} className="h-10 rounded-lg border border-border px-3 text-sm font-normal" /></label><label className="grid gap-1 text-xs font-semibold">Notes<textarea name="notes" defaultValue={item.notes ?? ""} maxLength={1000} rows={2} className="rounded-lg border border-border p-3 text-sm font-normal" /></label></div><button className="w-fit rounded-full border border-border px-4 py-2 text-sm font-medium">Save item</button></form></details>
              <div className="flex flex-wrap items-center gap-3"><form action={moveItineraryItem}><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="direction" value="up" /><button disabled={index === 0} className="text-sm text-muted enabled:hover:text-primary disabled:opacity-40">Move up</button></form><form action={moveItineraryItem}><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="direction" value="down" /><button disabled={index === day.items.length - 1} className="text-sm text-muted enabled:hover:text-primary disabled:opacity-40">Move down</button></form><form action={removeItineraryItem}><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="tripId" value={trip.id} /><button className="text-sm text-rose-700 hover:underline">Remove item</button></form></div>
            </div>}
          </article>)}</div>
          {!archived && <div className="mt-5 grid gap-4 border-t border-border pt-5 lg:grid-cols-2">
            <AddListingForm tripId={trip.id} dayId={day.id} type="PLACE" choices={places} />
            <AddListingForm tripId={trip.id} dayId={day.id} type="ACTIVITY" choices={activities} anchorLocations={[...day.items.map((item) => item.location ?? ""), ...hotels.filter((hotel) => day.items.some((item) => item.type === "HOTEL" && item.title === hotel.name)).map((hotel) => hotel.location)].filter(Boolean)} />
            <AddListingForm tripId={trip.id} dayId={day.id} type="HOTEL" choices={hotels} />
            <AddListingForm tripId={trip.id} dayId={day.id} type="GUIDE" choices={guides} />
            <form action={addListingToTrip} className="grid content-start gap-3 rounded-xl border border-dashed border-border p-4"><div><h4 className="font-semibold">Add a personal stop</h4><p className="mt-1 text-xs leading-5 text-muted">Add a custom reminder or place that is not in the directory.</p></div><input type="hidden" name="type" value="CUSTOM" /><input type="hidden" name="selection" value={`${trip.id}|${day.id}`} /><input name="customTitle" required minLength={2} maxLength={180} placeholder="Stop or reminder name" className="h-11 rounded-xl border border-border px-3 text-sm" /><input name="customLocation" maxLength={160} placeholder="Location (optional)" className="h-11 rounded-xl border border-border px-3 text-sm" /><button className="w-fit rounded-full border border-border px-4 py-2.5 text-sm font-semibold">Add personal stop</button></form>
          </div>}
        </section>)}
      </div>

      <section id="accommodation" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Separate from daily activities</p><h3 className="mt-1 text-xl font-semibold">Accommodation</h3><p className="mt-2 text-sm leading-6 text-muted">Save hotel and stay details for planning. This is not a reservation; contact the hotel to confirm availability and current prices.</p></div>
        {trip.accommodations.length > 0 && <div className="mt-5 grid gap-4">{trip.accommodations.map((stay) => <article key={stay.id} className="rounded-xl border border-border p-4"><div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold">{stay.hotelName}</h4><p className="mt-1 text-sm text-muted">{stay.location}</p>{stay.indicativePricePerNight && <p className="mt-2 text-sm font-medium">Indicative: PKR {Number(stay.indicativePricePerNight).toLocaleString("en-PK")} per night</p>}</div>{stay.hotel?.slug && <Link href={`/hotels/${stay.hotel.slug}`} className="text-sm font-medium text-primary hover:underline">Hotel details</Link>}</div>
            {!archived && <div className="grid gap-3"><form action={updateTripAccommodation} className="grid gap-3"><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="accommodationId" value={stay.id} /><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-semibold">Check-in<input name="checkIn" type="date" required defaultValue={dateInput(stay.checkIn)} className="h-10 rounded-lg border border-border px-3 text-sm font-normal" /></label><label className="grid gap-1 text-xs font-semibold">Check-out<input name="checkOut" type="date" required defaultValue={dateInput(stay.checkOut)} className="h-10 rounded-lg border border-border px-3 text-sm font-normal" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-semibold">Room type<input name="roomTypeName" defaultValue={stay.roomTypeName ?? ""} maxLength={120} className="h-10 rounded-lg border border-border px-3 text-sm font-normal" /></label><label className="grid gap-1 text-xs font-semibold">Guests<input name="guests" type="number" min={1} max={20} defaultValue={stay.guests ?? ""} className="h-10 rounded-lg border border-border px-3 text-sm font-normal" /></label></div><label className="grid gap-1 text-xs font-semibold">Notes<textarea name="notes" defaultValue={stay.notes ?? ""} maxLength={1000} rows={2} className="rounded-lg border border-border p-3 text-sm font-normal" /></label><button className="w-fit rounded-full border border-border px-4 py-2 text-sm font-medium">Save stay details</button></form><form action={removeTripAccommodation}><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="accommodationId" value={stay.id} /><button className="text-left text-sm text-rose-700 hover:underline">Remove this stay</button></form></div>}
          </article>)}</div>}
        {!archived && <form action={addTripAccommodation} className="mt-5 grid gap-4 rounded-xl bg-background p-4"><h4 className="font-semibold">Add a hotel stay</h4><input type="hidden" name="tripId" value={trip.id} /><label className="grid gap-2 text-sm font-medium">Hotel<select name="hotelId" required className="h-11 rounded-xl border border-border bg-white px-3 font-normal"><option value="">Choose an approved hotel</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Check-in<input type="date" name="checkIn" required className="h-11 rounded-xl border border-border px-3 font-normal" /></label><label className="grid gap-2 text-sm font-medium">Check-out<input type="date" name="checkOut" required className="h-11 rounded-xl border border-border px-3 font-normal" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Room type <span className="font-normal text-muted">(optional)</span><input name="roomTypeName" maxLength={120} placeholder="e.g. Standard room" className="h-11 rounded-xl border border-border px-3 font-normal" /></label><label className="grid gap-2 text-sm font-medium">Guests <span className="font-normal text-muted">(optional)</span><input name="guests" type="number" min={1} max={20} className="h-11 rounded-xl border border-border px-3 font-normal" /></label></div><label className="grid gap-2 text-sm font-medium">Notes <span className="font-normal text-muted">(optional)</span><textarea name="notes" maxLength={1000} rows={2} className="rounded-xl border border-border p-3 font-normal" /></label><button disabled={!hotels.length} className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Add accommodation</button>{!hotels.length && <p className="text-xs text-muted">No approved hotels are listed yet.</p>}</form>}
      </section>
      {archived && <p className="text-center text-sm text-muted">Archived itineraries are read-only. Restore this trip to continue editing.</p>}
    </div>
  );
}
