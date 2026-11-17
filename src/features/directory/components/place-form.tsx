import type { Place, PlaceImage } from "@prisma/client";
import { createPlaceAction, updatePlaceAction } from "../actions";
import { placeCategoryLabels } from "../data";

type EditablePlace = Pick<Place, "id" | "name" | "category" | "summary" | "description" | "location" | "latitude" | "longitude" | "cuisine" | "specialties" | "menuInformation" | "priceRange" | "openingHours" | "phone" | "whatsapp" | "contactUrl"> & { images: Pick<PlaceImage, "url">[] };

function TextField({ name, label, value, required = false, type = "text" }: { name: string; label: string; value?: string | number | null; required?: boolean; type?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input className="h-11 rounded-xl border border-border bg-white px-3 font-normal outline-none focus:border-primary" name={name} type={type} defaultValue={value ?? ""} required={required} /></label>;
}

export function PlaceForm({ place }: { place?: EditablePlace }) {
  const action = place ? updatePlaceAction : createPlaceAction;
  return <form action={action} className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
    {place && <input type="hidden" name="id" value={place.id} />}
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField name="name" label="Name" value={place?.name} required />
      <label className="grid gap-1.5 text-sm font-medium">Category<select name="category" defaultValue={place?.category ?? "DESTINATION"} className="h-11 rounded-xl border border-border bg-white px-3 font-normal">{Object.entries(placeCategoryLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
    </div>
    <TextField name="summary" label="Short summary (up to 240 characters)" value={place?.summary} required />
    <label className="grid gap-1.5 text-sm font-medium">Description<textarea name="description" defaultValue={place?.description ?? ""} className="min-h-32 rounded-xl border border-border bg-white p-3 font-normal" required /></label>
    <div className="grid gap-4 sm:grid-cols-3"><TextField name="location" label="Location" value={place?.location} required /><TextField name="latitude" label="Latitude" value={place?.latitude} type="number" /><TextField name="longitude" label="Longitude" value={place?.longitude} type="number" /></div>
    <div className="grid gap-4 sm:grid-cols-2"><TextField name="cuisine" label="Cuisine (optional)" value={place?.cuisine} /><TextField name="specialties" label="Specialties, comma separated" value={place?.specialties.join(", ")} /><TextField name="priceRange" label="Price range" value={place?.priceRange} /><TextField name="openingHours" label="Opening hours" value={place?.openingHours} /><TextField name="phone" label="Phone" value={place?.phone} /><TextField name="whatsapp" label="WhatsApp" value={place?.whatsapp} /><TextField name="contactUrl" label="Website or contact link (HTTPS)" value={place?.contactUrl} type="url" /></div>
    <label className="grid gap-1.5 text-sm font-medium">Menu or visitor information<textarea name="menuInformation" defaultValue={place?.menuInformation ?? ""} className="min-h-20 rounded-xl border border-border bg-white p-3 font-normal" /></label>
    <label className="grid gap-1.5 text-sm font-medium">Photo URLs <span className="font-normal text-muted">One HTTPS link per line. Existing local paths under /images/ also work.</span><textarea name="imageUrls" defaultValue={place?.images.map((image) => image.url).join("\n") ?? ""} className="min-h-24 rounded-xl border border-border bg-white p-3 font-normal" /></label>
    <label className="grid gap-1.5 text-sm font-medium">Upload photos <span className="font-normal text-muted">Choose up to 5 JPEG, PNG, WebP, or AVIF files (5 MB max each).</span><input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="rounded-xl border border-border bg-white p-3 text-sm font-normal" /></label>
    <p className="text-xs leading-5 text-muted">Admin-created places publish immediately. Restaurant and food-spot details are optional fields on a regular place listing.</p>
    <button type="submit" className="h-11 w-fit rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">{place ? "Save place" : "Create place"}</button>
  </form>;
}
