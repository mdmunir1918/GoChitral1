import Link from "next/link";
import Image from "next/image";
import type { Hotel, HotelImage, HotelRoomType } from "@prisma/client";

type CardHotel = Pick<Hotel, "id" | "slug" | "name" | "summary" | "location"> & { images: Pick<HotelImage, "url" | "altText">[]; roomTypes: Pick<HotelRoomType, "pricePerNight">[] };

export function HotelCard({ hotel }: { hotel: CardHotel }) {
  const lowestPrice = hotel.roomTypes.reduce<number | null>((lowest, room) => {
    const price = Number(room.pricePerNight);
    return lowest === null || price < lowest ? price : lowest;
  }, null);
  return <Link href={`/hotels/${hotel.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
    {hotel.images[0] ? <div className="relative aspect-[4/3]"><Image unoptimized src={hotel.images[0].url} alt={hotel.images[0].altText} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /></div> : <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-50" aria-hidden="true" />}
    <div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{hotel.location}</p><h2 className="mt-1 text-lg font-semibold group-hover:text-primary">{hotel.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{hotel.summary}</p>{lowestPrice !== null && <p className="mt-3 text-sm font-semibold">From PKR {lowestPrice.toLocaleString()} <span className="font-normal text-muted">/ night</span></p>}</div>
  </Link>;
}
