import type { GuideImage, GuideProfile } from "@prisma/client";
import Image from "next/image";
import { updateGuideProfileAction } from "../actions";
import { GuidePhotosInput } from "./guide-photos-input";

type EditableGuide = Pick<GuideProfile, "id" | "name" | "biography" | "experienceYears" | "languages" | "regionsCovered" | "specialties" | "services" | "pricingInformation" | "phone" | "whatsapp"> & { images: Pick<GuideImage, "url">[]; user: { image: string | null } };

function Field({ label, name, value, type = "text" }: { label: string; name: string; value?: string | number | null; type?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input name={name} type={type} defaultValue={value ?? ""} required className="h-11 rounded-xl border border-border bg-white px-3 font-normal outline-none focus:border-primary" /></label>;
}

export function GuideProfileForm({ profile }: { profile: EditableGuide }) {
  return <form action={updateGuideProfileAction} encType="multipart/form-data" className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
    <h2 className="text-xl font-semibold">Your public guide profile</h2>
    <div className="flex items-center gap-4">{profile.user.image ? <Image unoptimized src={profile.user.image} alt={`${profile.name} profile photo`} width={64} height={64} className="size-16 rounded-full object-cover" /> : <span className="flex size-16 items-center justify-center rounded-full bg-background text-xs text-muted">Photo</span>}<label className="grid gap-1.5 text-sm font-medium">Profile photo <span className="font-normal text-muted">One image, up to 5 MB</span><input name="profileImage" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="max-w-full text-xs" /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Public name" name="name" value={profile.name} /><Field label="Years of experience" name="experienceYears" value={profile.experienceYears} type="number" /></div>
    <label className="grid gap-1.5 text-sm font-medium">Biography<textarea name="biography" defaultValue={profile.biography} required minLength={30} maxLength={3000} className="min-h-32 rounded-xl border border-border bg-white p-3 font-normal" /></label>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Languages" name="languages" value={profile.languages.join(", ")} /><Field label="Regions covered" name="regionsCovered" value={profile.regionsCovered.join(", ")} /><Field label="Specialties" name="specialties" value={profile.specialties.join(", ")} /><Field label="Services" name="services" value={profile.services.join(", ")} /><Field label="Phone" name="phone" value={profile.phone} /><Field label="WhatsApp" name="whatsapp" value={profile.whatsapp} /></div>
    <label className="grid gap-1.5 text-sm font-medium">Pricing information <span className="font-normal text-muted">Optional, for example: half-day and full-day rates</span><textarea name="pricingInformation" defaultValue={profile.pricingInformation ?? ""} className="min-h-20 rounded-xl border border-border bg-white p-3 font-normal" /></label>
    <GuidePhotosInput urls={profile.images.map((image) => image.url)} />
    <p className="text-xs leading-5 text-muted">Your public profile is visible only while your guide application is approved. Visitors contact you directly; the platform does not take bookings or payments.</p>
    <button className="h-11 w-fit rounded-full bg-primary px-5 text-sm font-semibold text-white">Save guide profile</button>
  </form>;
}
