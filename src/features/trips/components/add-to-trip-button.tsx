import Link from "next/link";
import { auth } from "@/auth";
import { addListingToTrip } from "@/features/trips/actions";
import { prisma } from "@/lib/prisma";

export async function AddToTripButton({
  type,
  listingId,
  customTitle,
  customLocation,
}: {
  type: "PLACE" | "ACTIVITY" | "HOTEL" | "GUIDE" | "CUSTOM";
  listingId?: string;
  customTitle?: string;
  customLocation?: string;
}) {
  const session = await auth();
  if (!session?.user) return <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold hover:border-primary hover:text-primary">Sign in to add to a trip</Link>;
  if (session.user.accountType !== "TOURIST") return null;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Karachi" });
  const todayDate = new Date(`${today}T00:00:00.000Z`);
  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id, archivedAt: null, endDate: { gte: todayDate } },
    orderBy: { updatedAt: "desc" },
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });
  if (!trips.length) return <Link href="/tourist/trips" className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white">Create a trip first</Link>;

  return (
    <form action={addListingToTrip} className="grid gap-3">
      <input type="hidden" name="type" value={type} />
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      {customTitle && <input type="hidden" name="customTitle" value={customTitle} />}
      {customLocation && <input type="hidden" name="customLocation" value={customLocation} />}
      <label className="grid gap-2 text-xs font-semibold text-muted">Choose a trip day
        <select name="selection" required className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-normal text-foreground">
          {trips.map((trip) => <optgroup key={trip.id} label={trip.title}>{trip.days.map((day) => <option key={day.id} value={`${trip.id}|${day.id}`}>Day {day.dayNumber} · {day.date.toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "UTC" })}</option>)}</optgroup>)}
        </select>
      </label>
      <button className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">Add to trip</button>
    </form>
  );
}
