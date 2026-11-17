import type { ItineraryItemType, PlaceCategory } from "@prisma/client";
import { addListingToTrip } from "@/features/trips/actions";

type Choice = { id: string; name: string; location?: string; category?: PlaceCategory };

export function AddListingForm({
  tripId, dayId, type, choices, anchorLocations = [],
}: {
  tripId: string; dayId: string; type: Exclude<ItineraryItemType, "CUSTOM">; choices: Choice[]; anchorLocations?: string[];
}) {
  const recommended = type === "ACTIVITY" && anchorLocations.length
    ? choices.filter((choice) => choice.location && anchorLocations.some((location) => location.toLowerCase().includes(choice.location!.toLowerCase()) || choice.location!.toLowerCase().includes(location.toLowerCase())))
    : [];
  const otherChoices = recommended.length ? choices.filter((choice) => !recommended.some((item) => item.id === choice.id)) : choices;
  const placeGroups = type === "PLACE" ? [
    { label: "Attractions and places", rows: choices.filter((item) => !["RESTAURANT", "FOOD_SPOT"].includes(item.category ?? "")) },
    { label: "Restaurants and food spots", rows: choices.filter((item) => ["RESTAURANT", "FOOD_SPOT"].includes(item.category ?? "")) },
  ] : [];
  return <form action={addListingToTrip} className="grid content-start gap-3 rounded-xl bg-background p-4">
    <div><h4 className="font-semibold">{type === "PLACE" ? "Add a place or restaurant" : type === "ACTIVITY" ? "Add an activity" : type === "HOTEL" ? "Add a hotel visit" : "Add a guide"}</h4>
      {type === "ACTIVITY" && recommended.length > 0 && <p className="mt-1 text-xs leading-5 text-muted">Suggested because it matches a place or hotel on this day.</p>}</div>
    <input type="hidden" name="selection" value={`${tripId}|${dayId}`} /><input type="hidden" name="type" value={type} />
    <select name="listingId" required disabled={!choices.length} className="h-11 rounded-xl border border-border bg-white px-3 text-sm disabled:opacity-50"><option value="">{choices.length ? "Choose one" : "No approved listings yet"}</option>
      {type === "PLACE" ? placeGroups.map((group) => group.rows.length > 0 && <optgroup key={group.label} label={group.label}>{group.rows.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</optgroup>) : <>
        {recommended.length > 0 && <optgroup label="Suggested near your other stops">{recommended.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</optgroup>}
        {otherChoices.length > 0 && <optgroup label={recommended.length ? "Other approved listings" : type === "ACTIVITY" ? "All approved activities" : "Approved listings"}>{otherChoices.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</optgroup>}
      </>}
    </select>
    <button disabled={!choices.length} className="w-fit rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Add to Day</button>
  </form>;
}
