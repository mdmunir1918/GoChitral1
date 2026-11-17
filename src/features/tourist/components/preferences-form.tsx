import { updateTouristPreferences } from "@/features/tourist/actions";
import { StatusMessage } from "@/features/tourist/components/tourist-workspace";

export function PreferencesForm({
  interests,
  style,
  pace,
  status,
}: {
  interests: string[];
  style: string;
  pace: string;
  status?: string;
}) {
  return (
    <div className="grid gap-5">
      <StatusMessage status={status} />
      <form action={updateTouristPreferences} className="grid gap-5 rounded-2xl border border-border bg-white p-5 sm:p-7">
        <div><h2 className="text-xl font-semibold">Travel preferences</h2><p className="mt-1 text-sm text-muted">All fields are optional. You can update them whenever you like.</p></div>
        <label className="grid gap-2 text-sm font-medium">Things you enjoy<input name="travelInterests" defaultValue={interests.join(", ")} maxLength={500} placeholder="e.g. hiking, culture, wildlife" className="h-11 rounded-xl border border-border px-3 font-normal" /><span className="text-xs font-normal text-muted">Separate up to 10 interests with commas.</span></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">Travel style<select name="travelStyle" defaultValue={style} className="h-11 rounded-xl border border-border bg-white px-3 font-normal"><option value="">No preference</option><option value="CULTURE">Culture and heritage</option><option value="NATURE">Nature and scenery</option><option value="ADVENTURE">Adventure</option><option value="SLOW_TRAVEL">Slow travel</option><option value="FAMILY">Family travel</option></select></label>
          <label className="grid gap-2 text-sm font-medium">Preferred pace<select name="preferredPace" defaultValue={pace} className="h-11 rounded-xl border border-border bg-white px-3 font-normal"><option value="">No preference</option><option value="RELAXED">Relaxed</option><option value="BALANCED">Balanced</option><option value="ACTIVE">Active</option></select></label>
        </div>
        <button className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90">Save preferences</button>
      </form>
    </div>
  );
}
