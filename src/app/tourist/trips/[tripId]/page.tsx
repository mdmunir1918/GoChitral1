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
  removeTripDay,
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
import { ListingMap, type MapPoint } from "@/features/maps/components/listing-map";

export const instant = false;
const dayMs = 24 * 60 * 60 * 1000;
type Params = Promise<{ tripId: string }>;
type Search = Promise<{ status?: string }>;

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateLabel(date: Date, style: "full" | "medium" = "full") {
  return date.toLocaleDateString("en-PK", { dateStyle: style, timeZone: "UTC" });
}

function mapUrl(latitude: number | null, longitude: number | null, location: string) {
  const query = latitude !== null && longitude !== null ? `${latitude},${longitude}` : location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function localToday() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Karachi" });
}

function isRestaurant(category?: string | null) {
  return category === "RESTAURANT" || category === "FOOD_SPOT";
}

export default async function TouristTripDetailPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const user = await requireAccountType(["TOURIST"]);
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const [trip, places, activities, hotels, guides] = await Promise.all([
    prisma.trip.findFirst({
      where: { id: tripId, userId: user.id },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: { items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { place: { select: { category: true } } } } },
        },
        accommodations: { orderBy: { checkIn: "asc" }, include: { hotel: { select: { slug: true } } } },
      },
    }),
    prisma.place.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { id: true, name: true, category: true, location: true } }),
    prisma.activity.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { id: true, name: true, location: true } }),
    prisma.hotel.findMany({ where: { application: { status: ApplicationStatus.APPROVED } }, orderBy: { name: "asc" }, select: { id: true, name: true, location: true } }),
    prisma.guideProfile.findMany({ where: { application: { status: ApplicationStatus.APPROVED } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!trip) notFound();

  const dateCompleted = dateInput(trip.endDate) < localToday();
  const archived = Boolean(trip.archivedAt) || dateCompleted;
  const itineraryMapPoints: MapPoint[] = trip.days.flatMap((day) => day.items.filter((item) => item.latitude !== null && item.longitude !== null).map((item) => ({ id: item.id, title: item.title, location: item.location ?? "Planned stop", latitude: item.latitude!, longitude: item.longitude! })));
  const configuredAppUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? process.env.AUTH_URL;
  const appUrl = configuredAppUrl?.startsWith("https://") ? new URL(configuredAppUrl).origin : "https://gochitral.vercel.app";
  const itineraryText = [
    `My trip: ${trip.title}`,
    `${dateLabel(trip.startDate, "medium")} – ${dateLabel(trip.endDate, "medium")}`,
    ...trip.days.flatMap((day) => [
      `\nDay ${day.dayNumber} · ${dateLabel(day.date, "medium")}`,
      ...day.items.map((item) => `• ${item.startTime ? `${item.startTime} — ` : ""}${item.title}${item.location ? ` (${item.location})` : ""}`),
    ]),
    "\nPlanned with GoChitral",
    appUrl,
  ].join("\n");
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(itineraryText)}`;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 pb-8">
      <header className="grid gap-5 border-b border-border pb-6 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/tourist/trips" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">← My trips</Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your private itinerary</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{trip.title}</h2>
          <p className="mt-2 text-sm text-muted">{dateLabel(trip.startDate, "medium")} – {dateLabel(trip.endDate, "medium")} <span aria-hidden="true">·</span> {trip.days.length} {trip.days.length === 1 ? "day" : "days"}</p>
          {trip.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{trip.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-full bg-[#168b55] px-5 text-sm font-semibold text-white transition hover:bg-[#117244]">Share trip</a>
          {archived
            ? !dateCompleted && <form action={restoreTrip}><input type="hidden" name="tripId" value={trip.id} /><button className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-semibold hover:border-primary">Restore trip</button></form>
            : <form action={archiveTrip}><input type="hidden" name="tripId" value={trip.id} /><button className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-muted transition hover:border-primary hover:text-foreground">Mark complete</button></form>}
        </div>
      </header>

      <StatusMessage status={query.status} />
      {archived && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{dateCompleted ? "This trip is in your archives because its end date has passed." : "This trip is archived. Restore it to make changes."}</p>}

      {!archived && <details className="group rounded-2xl border border-border bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold marker:hidden sm:px-6">
          <span>Edit trip details</span><span className="text-sm font-normal text-muted group-open:hidden">Show</span><span className="hidden text-sm font-normal text-muted group-open:inline">Hide</span>
        </summary>
        <form action={updateTrip} className="grid gap-4 border-t border-border px-5 py-5 sm:px-6">
          <input type="hidden" name="tripId" value={trip.id} />
          <label className="grid gap-2 text-sm font-medium">Trip name<input name="title" defaultValue={trip.title} required minLength={2} maxLength={120} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-medium">Short description <span className="font-normal text-muted">(optional)</span><textarea name="description" defaultValue={trip.description ?? ""} maxLength={1000} rows={2} className="rounded-xl border border-border p-3 font-normal" /></label>
          <p className="text-xs leading-5 text-muted">Trip dates are managed with the days below. Add a day to extend your trip or remove a day to shorten it.</p>
          <div className="flex justify-end"><button className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 sm:w-fit">Save trip details</button></div>
        </form>
      </details>}

      <nav aria-label="Trip days" className="flex flex-wrap items-center gap-2">
        {trip.days.map((day) => <a key={day.id} href={`#${day.id}`} className="inline-flex h-10 shrink-0 items-center rounded-full border border-border bg-white px-4 text-sm font-medium transition hover:border-primary hover:text-primary">Day {day.dayNumber}</a>)}
        {!archived && trip.days.length < 30 && <form action={addTripDay} className="w-full sm:ml-auto sm:w-auto"><input type="hidden" name="tripId" value={trip.id} /><button className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 sm:w-auto">+ Add a day</button></form>}
      </nav>

      {itineraryMapPoints.length > 0 && <ListingMap points={itineraryMapPoints} label="Map of itinerary stops with saved coordinates" />}

      <section id="accommodation" className="scroll-mt-6 rounded-3xl border border-border bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Plan separately</p><h3 className="mt-1 text-2xl font-semibold">Accommodation</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Keep hotel stays and dates here. Restaurants and places to visit are planned within each day.</p></div>
        </div>

        {trip.accommodations.length > 0 && <div className="mt-5 grid gap-3">{trip.accommodations.map((stay) => <article key={stay.id} className="rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h4 className="font-semibold">{stay.hotelName}</h4><p className="mt-1 text-sm text-muted">{stay.location}</p><p className="mt-2 text-sm">{dateLabel(stay.checkIn, "medium")} – {dateLabel(stay.checkOut, "medium")}{stay.roomTypeName ? ` · ${stay.roomTypeName}` : ""}</p>{stay.indicativePricePerNight && <p className="mt-1 text-sm font-medium">From PKR {Number(stay.indicativePricePerNight).toLocaleString("en-PK")} per night</p>}</div>
            {stay.hotel?.slug && <Link href={`/hotels/${stay.hotel.slug}`} className="inline-flex h-9 items-center rounded-full border border-border bg-white px-4 text-sm font-medium text-primary hover:border-primary">Hotel details</Link>}
          </div>
          {!archived && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <details className="group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-primary marker:hidden">Edit stay <span className="text-muted group-open:hidden">＋</span><span className="hidden text-muted group-open:inline">−</span></summary>
              <form action={updateTripAccommodation} className="mt-4 grid w-full gap-3 sm:min-w-[34rem]">
                <input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="accommodationId" value={stay.id} />
                <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Check-in<input name="checkIn" type="date" required defaultValue={dateInput(stay.checkIn)} className="h-11 rounded-xl border border-border bg-white px-3 font-normal" /></label><label className="grid gap-1.5 text-sm font-medium">Check-out<input name="checkOut" type="date" required defaultValue={dateInput(stay.checkOut)} className="h-11 rounded-xl border border-border bg-white px-3 font-normal" /></label></div>
                <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Room type <span className="font-normal text-muted">(optional)</span><input name="roomTypeName" defaultValue={stay.roomTypeName ?? ""} maxLength={120} className="h-11 rounded-xl border border-border bg-white px-3 font-normal" /></label><label className="grid gap-1.5 text-sm font-medium">Guests <span className="font-normal text-muted">(optional)</span><input name="guests" type="number" min={1} max={20} defaultValue={stay.guests ?? ""} className="h-11 rounded-xl border border-border bg-white px-3 font-normal" /></label></div>
                <label className="grid gap-1.5 text-sm font-medium">Notes <span className="font-normal text-muted">(optional)</span><textarea name="notes" defaultValue={stay.notes ?? ""} maxLength={1000} rows={2} className="rounded-xl border border-border bg-white p-3 font-normal" /></label>
                <div className="flex justify-end"><button className="inline-flex h-10 w-full items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-semibold hover:border-primary sm:w-fit">Save stay</button></div>
              </form>
            </details>
            <form action={removeTripAccommodation}><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="accommodationId" value={stay.id} /><button className="text-sm font-medium text-rose-700 hover:underline">Remove stay</button></form>
          </div>}
        </article>)}</div>}

        {!archived && <details className="group mt-5 rounded-2xl border border-dashed border-border bg-background/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden sm:px-5"><span><span className="block font-semibold">+ Add a hotel stay</span><span className="mt-1 block text-sm font-normal text-muted">Choose a hotel and dates. No booking is made here.</span></span><span className="text-sm font-medium text-primary group-open:hidden">Open</span><span className="hidden text-sm font-medium text-primary group-open:inline">Close</span></summary>
          <form action={addTripAccommodation} className="grid gap-4 border-t border-border p-4 sm:p-5">
            <input type="hidden" name="tripId" value={trip.id} />
            <label className="grid gap-2 text-sm font-medium">Hotel<select name="hotelId" required disabled={!hotels.length} className="h-11 rounded-xl border border-border bg-white px-3 font-normal disabled:opacity-60"><option value="">{hotels.length ? "Choose an approved hotel" : "No approved hotels are listed yet"}</option>{hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name} · {hotel.location}</option>)}</select></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Check-in<input type="date" name="checkIn" required min={dateInput(trip.startDate)} max={dateInput(trip.endDate)} className="h-11 rounded-xl border border-border bg-white px-3 font-normal" /></label><label className="grid gap-2 text-sm font-medium">Check-out<input type="date" name="checkOut" required min={dateInput(new Date(trip.startDate.getTime() + dayMs))} max={dateInput(new Date(trip.endDate.getTime() + dayMs))} className="h-11 rounded-xl border border-border bg-white px-3 font-normal" /></label></div>
            <details className="rounded-xl border border-border bg-white px-4"><summary className="cursor-pointer py-3 text-sm font-medium text-primary">Optional stay details</summary><div className="grid gap-3 border-t border-border py-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Room type<input name="roomTypeName" maxLength={120} placeholder="e.g. Standard room" className="h-11 rounded-xl border border-border px-3 font-normal" /></label><label className="grid gap-1.5 text-sm font-medium">Guests<input name="guests" type="number" min={1} max={20} className="h-11 rounded-xl border border-border px-3 font-normal" /></label><label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Notes<textarea name="notes" maxLength={1000} rows={2} className="rounded-xl border border-border p-3 font-normal" /></label></div></details>
            <div className="flex justify-end"><button disabled={!hotels.length} className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit">Save hotel stay</button></div>
            <p className="text-xs leading-5 text-muted">This is a planning note, not a reservation. Contact the hotel to confirm availability and prices.</p>
          </form>
        </details>}
      </section>

      <section className="grid gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Your itinerary</p><h3 className="mt-1 text-2xl font-semibold">Plan your days</h3><p className="mt-2 text-sm leading-6 text-muted">Add places, restaurants, activities, and guides to the day you want to visit them.</p></div>

        {trip.days.map((day) => {
          const dayHotelLocations = trip.accommodations.filter((stay) => stay.checkIn <= day.date && stay.checkOut >= day.date).map((stay) => stay.location);
          const anchorLocations = [...day.items.map((item) => item.location ?? ""), ...dayHotelLocations].filter(Boolean);
          return <section key={day.id} id={day.id} className="scroll-mt-6 overflow-hidden rounded-3xl border border-border bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-background/60 px-5 py-5 sm:px-6">
              <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Day {day.dayNumber}</p><h4 className="mt-1 text-xl font-semibold">{dateLabel(day.date)}</h4></div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted">{day.items.length} {day.items.length === 1 ? "stop" : "stops"}</span>
                {!archived && trip.days.length > 1 && <details className="group w-full sm:w-auto">
                  <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-full border border-border bg-white px-3 text-sm font-medium text-muted hover:border-rose-300 hover:text-rose-700 marker:hidden">Remove day</summary>
                  <div className="mt-2 w-full rounded-2xl border border-rose-200 bg-white p-4 sm:w-80">
                    <p className="text-sm font-semibold text-foreground">Remove Day {day.dayNumber}?</p>
                    <p className="mt-2 text-xs leading-5 text-muted">Stops on this day will be deleted. Later days and hotel stays will move earlier by one day. This cannot be undone.</p>
                    <form action={removeTripDay} className="mt-4 flex justify-end"><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="dayId" value={day.id} /><button className="inline-flex h-9 items-center rounded-full bg-rose-700 px-3 text-sm font-semibold text-white hover:bg-rose-800">Confirm remove</button></form>
                  </div>
                </details>}
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:p-6">
              {!archived && <details className="group rounded-2xl border border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold marker:hidden"><span>{day.notes ? "Day note" : "Add a day note"}</span><span className="text-xs font-medium text-primary group-open:hidden">Edit</span><span className="hidden text-xs font-medium text-primary group-open:inline">Close</span></summary>
                <form action={updateTripDayNotes} className="grid gap-3 border-t border-border p-4">
                  <input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="dayId" value={day.id} /><input type="hidden" name="dayAnchor" value={day.id} />
                  <label htmlFor={`day-note-${day.id}`} className="text-xs font-medium text-muted">A short reminder for this day</label><textarea id={`day-note-${day.id}`} name="notes" defaultValue={day.notes ?? ""} maxLength={1000} rows={2} placeholder="Optional note" className="rounded-xl border border-border p-3 text-sm" />
                  <div className="flex justify-end"><button className="inline-flex h-10 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-semibold hover:border-primary sm:w-fit">Save note</button></div>
                </form>
              </details>}
              {day.notes && <p className="rounded-xl bg-background px-4 py-3 text-sm leading-6 text-muted">{day.notes}</p>}

              {day.items.length > 0 ? <div className="grid gap-3">{day.items.map((item, index) => {
                const label = item.type === "PLACE" ? isRestaurant(item.place?.category) ? "Restaurant" : "Place to visit" : item.type === "ACTIVITY" ? "Activity" : item.type === "HOTEL" ? "Hotel" : item.type === "GUIDE" ? "Tour guide" : "Personal plan";
                return <article key={item.id} className="rounded-2xl border border-border p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">{label}</span>{item.startTime && <span className="text-xs font-medium text-muted">{item.startTime}</span>}</div>
                      <h5 className="mt-2 text-base font-semibold">{item.title}</h5>
                      {item.location && <p className="mt-1 text-sm text-muted">{item.location}</p>}
                      {item.priceInformation && <p className="mt-2 text-sm font-medium">Indicative price: {item.priceInformation}</p>}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{item.latitude !== null && item.longitude !== null ? <a href={mapUrl(item.latitude, item.longitude, item.location ?? "")} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">Open map</a> : item.location && <a href={mapUrl(null, null, item.location)} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">Search map</a>}{item.notes && <span className="text-sm text-muted">{item.notes}</span>}</div>
                    </div>
                    {!archived && <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <form action={moveItineraryItem}><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="direction" value="up" /><button aria-label={`Move ${item.title} up`} title="Move up" disabled={index === 0} className="inline-flex h-9 items-center rounded-full border border-border px-3 text-xs font-medium text-muted hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">↑</button></form>
                      <form action={moveItineraryItem}><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="tripId" value={trip.id} /><input type="hidden" name="direction" value="down" /><button aria-label={`Move ${item.title} down`} title="Move down" disabled={index === day.items.length - 1} className="inline-flex h-9 items-center rounded-full border border-border px-3 text-xs font-medium text-muted hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">↓</button></form>
                      <details className="group relative"><summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-full border border-border px-3 text-xs font-semibold text-primary marker:hidden">Edit</summary><div className="absolute right-0 z-10 mt-2 w-[min(28rem,calc(100vw-3rem))] rounded-2xl border border-border bg-white p-4 shadow-lg"><form action={updateItineraryItem} className="grid gap-3"><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="tripId" value={trip.id} /><label className="grid gap-1.5 text-sm font-medium">Stop name<input name="title" defaultValue={item.title} required minLength={2} maxLength={180} className="h-10 rounded-lg border border-border px-3 font-normal" /></label><div className="grid gap-3 sm:grid-cols-[120px_1fr]"><label className="grid gap-1.5 text-sm font-medium">Time<input name="startTime" type="time" defaultValue={item.startTime ?? ""} className="h-10 rounded-lg border border-border px-3 font-normal" /></label><label className="grid gap-1.5 text-sm font-medium">Note<textarea name="notes" defaultValue={item.notes ?? ""} maxLength={1000} rows={2} className="rounded-lg border border-border p-3 font-normal" /></label></div><div className="flex justify-end"><button className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white sm:w-fit">Save stop</button></div></form></div></details>
                      <form action={removeItineraryItem}><input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="tripId" value={trip.id} /><button className="inline-flex h-9 items-center rounded-full border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50">Remove</button></form>
                    </div>}
                  </div>
                </article>;
              })}</div> : <div className="rounded-2xl border border-dashed border-border bg-background/50 px-4 py-6 text-center"><p className="text-sm font-medium">No stops planned yet</p><p className="mt-1 text-xs text-muted">Add a place, restaurant, activity, or guide below.</p></div>}

              {!archived && <details className="group rounded-2xl border border-primary/20 bg-primary/[0.025]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 marker:hidden sm:px-5"><span><span className="block font-semibold">Add to this day</span><span className="mt-1 block text-sm font-normal text-muted">Choose a place, restaurant, activity, or guide.</span></span><span className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white group-open:hidden">Add stops</span><span className="hidden text-sm font-semibold text-primary group-open:inline">Close</span></summary>
                <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2 sm:p-5">
                  <AddListingForm tripId={trip.id} dayId={day.id} type="PLACE" placeKind="PLACE" choices={places} />
                  <AddListingForm tripId={trip.id} dayId={day.id} type="PLACE" placeKind="RESTAURANT" choices={places} />
                  <AddListingForm tripId={trip.id} dayId={day.id} type="ACTIVITY" choices={activities} anchorLocations={anchorLocations} />
                  <AddListingForm tripId={trip.id} dayId={day.id} type="GUIDE" choices={guides} />
                  <details className="group rounded-2xl border border-dashed border-border bg-white p-4 sm:col-span-2 sm:p-5">
                    <summary className="cursor-pointer list-none marker:hidden"><span className="font-semibold">Add a personal stop</span><span className="mt-1 block text-sm text-muted">For a reminder or place that is not in the directory.</span></summary>
                    <form action={addListingToTrip} className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                      <input type="hidden" name="type" value="CUSTOM" /><input type="hidden" name="selection" value={`${trip.id}|${day.id}`} />
                      <label className="grid gap-1.5 text-sm font-medium">Stop or reminder<input name="customTitle" required minLength={2} maxLength={180} placeholder="e.g. Pick up supplies" className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
                      <label className="grid gap-1.5 text-sm font-medium">Location <span className="font-normal text-muted">(optional)</span><input name="customLocation" maxLength={160} placeholder="Town or area" className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
                      <div className="flex justify-end sm:col-span-2"><button className="inline-flex h-11 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-semibold hover:border-primary sm:w-fit">Add personal stop</button></div>
                    </form>
                  </details>
                </div>
              </details>}
            </div>
          </section>;
        })}
      </section>

      {archived && <p className="text-center text-sm text-muted">Archived itineraries are read-only. Restore this trip to continue editing.</p>}
    </div>
  );
}
