import { updateTouristProfile } from "@/features/tourist/actions";
import { StatusMessage } from "@/features/tourist/components/tourist-workspace";
import Image from "next/image";

export function ProfileForm({
  name,
  email,
  phone,
  homeLocation,
  image,
  status,
}: {
  name: string;
  email: string;
  phone: string;
  homeLocation: string;
  image: string | null;
  status?: string;
}) {
  return (
    <div className="grid gap-5">
      <StatusMessage status={status} />
      <form action={updateTouristProfile} encType="multipart/form-data" className="grid gap-5 rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div><h2 className="text-xl font-semibold">Personal information</h2><p className="mt-1 text-sm text-muted">Only add the details you want to share with your account.</p></div>
        <div className="flex items-center gap-4">{image ? <Image unoptimized src={image} alt="Your profile photo" width={64} height={64} className="size-16 rounded-full object-cover" /> : <span className="flex size-16 items-center justify-center rounded-full bg-background text-xs text-muted">Photo</span>}<label className="grid gap-1.5 text-sm font-medium">Profile photo <span className="font-normal text-muted">One image, up to 5 MB</span><input name="profileImage" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="max-w-full text-xs" /></label></div>
        <label className="grid gap-2 text-sm font-medium">Full name<input name="name" defaultValue={name} required minLength={2} maxLength={100} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
        <label className="grid gap-2 text-sm font-medium">Email address<input value={email} readOnly className="h-11 rounded-xl border border-border bg-background px-3 font-normal text-muted" /><span className="text-xs font-normal text-muted">Email changes are managed by your sign-in provider.</span></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">Phone number <span className="font-normal text-muted">(optional)</span><input name="phone" type="tel" defaultValue={phone} maxLength={24} placeholder="+92…" className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-medium">Home city or region <span className="font-normal text-muted">(optional)</span><input name="homeLocation" defaultValue={homeLocation} maxLength={120} placeholder="e.g. Peshawar" className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
        </div>
        <button className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90">Save personal information</button>
      </form>
    </div>
  );
}
