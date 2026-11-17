import Image from "next/image";
import Link from "next/link";
import type { GuideImage, GuideProfile } from "@prisma/client";

type CardGuide = Pick<GuideProfile, "id" | "slug" | "name" | "summary" | "experienceYears" | "regionsCovered" | "specialties"> & { images: Pick<GuideImage, "url" | "altText">[]; user: { image: string | null } };

export function GuideCard({ guide }: { guide: CardGuide }) {
  return <Link href={`/guides/${guide.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
    {guide.images[0] || guide.user.image ? <div className="relative aspect-[4/3]"><Image unoptimized src={guide.images[0]?.url ?? guide.user.image!} alt={guide.images[0]?.altText ?? `${guide.name} profile photo`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /></div> : <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-50 text-sm font-medium text-emerald-950">Local guide</div>}
    <div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{guide.regionsCovered.slice(0, 2).join(" · ") || "Chitral"}</p><h2 className="mt-1 text-lg font-semibold group-hover:text-primary">{guide.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{guide.summary}</p><p className="mt-3 text-xs text-muted">{guide.experienceYears} years experience{guide.specialties.length ? ` · ${guide.specialties.slice(0, 2).join(", ")}` : ""}</p></div>
  </Link>;
}
