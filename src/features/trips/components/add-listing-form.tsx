import type { ItineraryItemType, PlaceCategory } from "@prisma/client";
import { addListingToTrip } from "@/features/trips/actions";

type Choice = { id: string; name: string; location?: string; category?: PlaceCategory };
type PlaceKind = "PLACE" | "RESTAURANT";

const foodCategories: PlaceCategory[] = ["RESTAURANT", "FOOD_SPOT"];

export function AddListingForm({
  tripId,
  dayId,
  type,
  choices,
  placeKind,
  anchorLocations = [],
}: {
  tripId: string;
  dayId: string;
  type: Exclude<ItineraryItemType, "CUSTOM">;
  choices: Choice[];
  placeKind?: PlaceKind;
  anchorLocations?: string[];
}) {
  const selectableChoices = type === "PLACE" && placeKind
    ? choices.filter((choice) => foodCategories.includes(choice.category ?? "OTHER") === (placeKind === "RESTAURANT"))
    : choices;
  const recommended = type === "ACTIVITY" && anchorLocations.length
    ? selectableChoices.filter((choice) => choice.location && anchorLocations.some((location) => location.toLowerCase().includes(choice.location!.toLowerCase()) || choice.location!.toLowerCase().includes(location.toLowerCase())))
    : [];
  const otherChoices = recommended.length ? selectableChoices.filter((choice) => !recommended.some((item) => item.id === choice.id)) : selectableChoices;
  const heading = type === "PLACE"
    ? placeKind === "RESTAURANT" ? "Restaurant" : "Place to visit"
    : type === "ACTIVITY" ? "Activity" : type === "HOTEL" ? "Hotel" : "Tour guide";
  const description = type === "PLACE"
    ? placeKind === "RESTAURANT" ? "Choose a restaurant or local food spot." : "Choose a destination, attraction, or cultural place."
    : type === "ACTIVITY" ? "Add an experience that fits this day."
      : type === "HOTEL" ? "Hotel stays are planned in the accommodation section." : "Choose a guide for this day.";
  const fieldId = `listing-${type.toLowerCase()}-${placeKind?.toLowerCase() ?? "all"}-${dayId}`;
  const emptyMessage = type === "PLACE" && placeKind === "RESTAURANT" ? "No approved restaurants are listed yet." : `No approved ${heading.toLowerCase()} listings yet.`;

  return (
    <form action={addListingToTrip} className="flex min-h-52 flex-col gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{heading}</p>
        <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
        {type === "ACTIVITY" && recommended.length > 0 && <p className="mt-2 text-xs font-medium text-primary">Suggestions near this day’s stops</p>}
      </div>
      <input type="hidden" name="selection" value={`${tripId}|${dayId}`} />
      <input type="hidden" name="type" value={type} />
      {placeKind && <input type="hidden" name="placeKind" value={placeKind} />}
      <label htmlFor={fieldId} className="grid gap-2 text-sm font-medium">
        Choose {heading.toLowerCase()}
        <select id={fieldId} name="listingId" required disabled={!selectableChoices.length} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal disabled:opacity-60">
          <option value="">{selectableChoices.length ? `Select ${heading.toLowerCase()}` : emptyMessage}</option>
          {recommended.length > 0 && <optgroup label="Suggested for this day">{recommended.map((row) => <option key={row.id} value={row.id}>{row.name}{row.location ? ` · ${row.location}` : ""}</option>)}</optgroup>}
          <optgroup label={recommended.length ? "More options" : `Approved ${heading.toLowerCase()} listings`}>
            {otherChoices.map((row) => <option key={row.id} value={row.id}>{row.name}{row.location ? ` · ${row.location}` : ""}</option>)}
          </optgroup>
        </select>
      </label>
      <button disabled={!selectableChoices.length} className="mt-auto inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit">
        Add {heading.toLowerCase()}
      </button>
    </form>
  );
}
