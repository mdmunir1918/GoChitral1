import type { Activity, ActivityImage } from "@prisma/client";
import { createActivityAdminAction, submitActivityAction, updateActivityAdminAction } from "../actions";
import { activityCategoryLabels } from "../data";

type EditableActivity = Pick<Activity, "id" | "name" | "category" | "summary" | "description" | "location" | "latitude" | "longitude" | "priceRange"> & { images: Pick<ActivityImage, "url">[] };

export function ActivitySubmissionForm({ activity, mode = "submit" }: { activity?: EditableActivity; mode?: "submit" | "create" | "edit" }) {
  const action = mode === "create" ? createActivityAdminAction : mode === "edit" ? updateActivityAdminAction : submitActivityAction;
  return <form action={action} className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6">
    {activity && <input type="hidden" name="id" value={activity.id} />}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-medium">Activity name<input name="name" required minLength={2} maxLength={120} defaultValue={activity?.name ?? ""} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
      <label className="grid gap-1.5 text-sm font-medium">Category<select name="category" defaultValue={activity?.category ?? "HIKING"} className="h-11 rounded-xl border border-border bg-white px-3 font-normal">{Object.entries(activityCategoryLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
    </div>
    <label className="grid gap-1.5 text-sm font-medium">Short summary<input name="summary" required minLength={10} maxLength={240} defaultValue={activity?.summary ?? ""} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
    <label className="grid gap-1.5 text-sm font-medium">Description<textarea name="description" required minLength={20} maxLength={6000} defaultValue={activity?.description ?? ""} className="min-h-28 rounded-xl border border-border p-3 font-normal" /></label>
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="grid gap-1.5 text-sm font-medium">Location<input name="location" required minLength={2} maxLength={160} defaultValue={activity?.location ?? ""} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
      <label className="grid gap-1.5 text-sm font-medium">Latitude<input name="latitude" type="number" step="any" defaultValue={activity?.latitude ?? ""} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
      <label className="grid gap-1.5 text-sm font-medium">Longitude<input name="longitude" type="number" step="any" defaultValue={activity?.longitude ?? ""} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
    </div>
    <label className="grid gap-1.5 text-sm font-medium">Indicative price range<input name="priceRange" maxLength={120} placeholder="Optional" defaultValue={activity?.priceRange ?? ""} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
    <label className="grid gap-1.5 text-sm font-medium">Photo URLs <span className="font-normal text-muted">One HTTPS link per line.</span><textarea name="imageUrls" defaultValue={activity?.images.map((image) => image.url).join("\n") ?? ""} className="min-h-20 rounded-xl border border-border p-3 font-normal" /></label>
    <label className="grid gap-1.5 text-sm font-medium">Upload photos <span className="font-normal text-muted">Choose up to 5 JPEG, PNG, WebP, or AVIF files (5 MB max each).</span><input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="rounded-xl border border-border bg-white p-3 text-sm font-normal" /></label>
    {mode === "submit" && <p className="text-xs leading-5 text-muted">Submissions stay private until an admin reviews and approves them. Only approved guide accounts can submit activities.</p>}
    <button type="submit" className="h-11 w-fit rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">{mode === "submit" ? "Submit for review" : mode === "edit" ? "Save activity" : "Create activity"}</button>
  </form>;
}
