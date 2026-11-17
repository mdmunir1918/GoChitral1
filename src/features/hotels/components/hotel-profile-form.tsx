import type { Hotel, HotelImage } from "@prisma/client";
import { updateHotelProfileAction } from "../actions";
import { HotelPhotosInput } from "./hotel-photos-input";

type EditableHotel = Pick<Hotel, "id" | "name" | "summary" | "description" | "location" | "latitude" | "longitude" | "amenities" | "phone" | "whatsapp"> & { images: Pick<HotelImage, "url">[] };

function Field({ label, name, value, type = "text", required = false }: { label: string; name: string; value?: string | number | null; type?: string; required?: boolean }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input name={name} type={type} defaultValue={value ?? ""} required={required} className="h-11 rounded-xl border border-border bg-white px-3 font-normal outline-none focus:border-primary" /></label>;
}

export function HotelProfileForm({ hotel }: { hotel: EditableHotel }) {
  return <form action={updateHotelProfileAction} className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
    <h2 className="text-xl font-semibold">Public hotel profile</h2>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Hotel name" name="name" value={hotel.name} required /><Field label="Location" name="location" value={hotel.location} required /></div>
    <Field label="Short summary" name="summary" value={hotel.summary} required />
    <label className="grid gap-1.5 text-sm font-medium">Description<textarea name="description" defaultValue={hotel.description} required className="min-h-28 rounded-xl border border-border bg-white p-3 font-normal" /></label>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Latitude (optional)" name="latitude" value={hotel.latitude} type="number" /><Field label="Longitude (optional)" name="longitude" value={hotel.longitude} type="number" /><Field label="Phone" name="phone" value={hotel.phone} /><Field label="WhatsApp" name="whatsapp" value={hotel.whatsapp} /></div>
    <label className="grid gap-1.5 text-sm font-medium">Amenities <span className="font-normal text-muted">Separate items with commas, such as Wi-Fi, breakfast, parking</span><textarea name="amenities" defaultValue={hotel.amenities.join(", ")} className="min-h-20 rounded-xl border border-border bg-white p-3 font-normal" /></label>
    <label className="grid gap-1.5 text-sm font-medium">Photo URLs <span className="font-normal text-muted">One HTTPS link per line. Leaving this blank keeps the current photos.</span><textarea name="imageUrls" defaultValue={hotel.images.map((image) => image.url).join("\n")} className="min-h-20 rounded-xl border border-border bg-white p-3 font-normal" /></label>
    <HotelPhotosInput />
    <button className="h-11 w-fit rounded-full bg-primary px-5 text-sm font-semibold text-white">Save hotel profile</button>
  </form>;
}
