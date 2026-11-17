import type { HotelRoomType } from "@prisma/client";
import { createRoomTypeAction, deleteRoomTypeAction, updateRoomTypeAction } from "../actions";

export function RoomTypeForm({ room }: { room?: HotelRoomType }) {
  const action = room ? updateRoomTypeAction : createRoomTypeAction;
  return <form action={action} className="grid gap-3 rounded-xl border border-border bg-background p-4">
    {room && <input type="hidden" name="id" value={room.id} />}
    <h3 className="font-semibold">{room ? "Edit room type" : "Add a room type"}</h3>
    <label className="grid gap-1 text-sm">Room type<input name="name" defaultValue={room?.name ?? ""} required maxLength={100} placeholder="e.g. Double room" className="h-10 rounded-lg border border-border bg-white px-3" /></label>
    <label className="grid gap-1 text-sm">Description<textarea name="description" defaultValue={room?.description ?? ""} required maxLength={1000} className="min-h-16 rounded-lg border border-border bg-white p-3" /></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">Maximum guests<input name="occupancy" type="number" min="1" max="20" defaultValue={room?.occupancy ?? 2} required className="h-10 rounded-lg border border-border bg-white px-3" /></label>
      <label className="grid gap-1 text-sm">Price per night (PKR)<input name="pricePerNight" type="number" min="1" step="1" defaultValue={room ? room.pricePerNight.toString() : ""} required className="h-10 rounded-lg border border-border bg-white px-3" /></label>
    </div>
    <div className="flex flex-wrap gap-3"><button className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-white">{room ? "Save room type" : "Add room type"}</button>{room && <button formAction={deleteRoomTypeAction} className="h-10 rounded-full border border-red-200 px-4 text-sm font-semibold text-red-800">Delete room type</button>}</div>
  </form>;
}
