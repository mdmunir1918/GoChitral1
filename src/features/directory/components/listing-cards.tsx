import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { Activity, ActivityImage, Place, PlaceImage } from "@prisma/client";
import { activityCategoryLabels, placeCategoryLabels } from "../data";

type PlaceCardItem = Pick<Place, "slug" | "name" | "category" | "summary" | "location"> & { images: Pick<PlaceImage, "url" | "altText">[] };
type ActivityCardItem = Pick<Activity, "slug" | "name" | "category" | "summary" | "location"> & { images: Pick<ActivityImage, "url" | "altText">[] };

function Cover({ src, alt }: { src?: string; alt: string }) {
  return <div className="relative h-48 overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-sky-800">
    {src ? <Image src={src} alt={alt} fill unoptimized sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_20%,rgba(255,255,255,0.22),transparent_42%),linear-gradient(145deg,transparent_35%,rgba(5,20,18,0.55))]" />}
    <span className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-black/30 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">{alt}</span>
  </div>;
}

export function PlaceCard({ place }: { place: PlaceCardItem }) {
  const label = placeCategoryLabels[place.category];
  return <Link href={`/places/${place.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-white transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
    <Cover src={place.images[0]?.url} alt={place.images[0]?.altText || label} />
    <div className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{label}</p><h2 className="mt-2 text-lg font-semibold tracking-tight">{place.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-muted">{place.summary}</p><p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><MapPin size={13} aria-hidden="true" />{place.location}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Explore place <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></div>
  </Link>;
}

export function ActivityCard({ activity }: { activity: ActivityCardItem }) {
  const label = activityCategoryLabels[activity.category];
  return <Link href={`/activities/${activity.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-white transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
    <Cover src={activity.images[0]?.url} alt={activity.images[0]?.altText || label} />
    <div className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{label}</p><h2 className="mt-2 text-lg font-semibold tracking-tight">{activity.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-muted">{activity.summary}</p><p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><MapPin size={13} aria-hidden="true" />{activity.location}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Explore activity <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></div>
  </Link>;
}
