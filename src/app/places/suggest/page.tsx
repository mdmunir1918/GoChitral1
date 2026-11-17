import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageContainer } from "@/components/ui/page-container";
import { requireAccountType } from "@/lib/authz";
import { placeCategoryLabels } from "@/features/directory/data";
import { submitPlaceSuggestionAction } from "@/features/directory/actions";

export const instant = false;

export default async function SuggestPlacePage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  await requireAccountType(["TOURIST"]);
  const params = await searchParams;
  return <main className="py-12"><PageContainer className="max-w-3xl">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Help improve the directory</p><h1 className="mt-3 text-3xl font-medium tracking-tight">Suggest a place</h1><p className="mt-3 text-sm leading-6 text-muted">Your suggestion is private until an admin reviews it. Don’t include private or sensitive information.</p>
    {params.submitted && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Suggestion submitted for review.</p>}
    {params.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-900">{params.error}</p>}
    <form action={submitPlaceSuggestionAction} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-5">
      <label className="grid gap-1.5 text-sm font-medium">Place name<input name="name" required minLength={2} maxLength={120} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
      <label className="grid gap-1.5 text-sm font-medium">Category<select name="category" className="h-11 rounded-xl border border-border bg-white px-3 font-normal">{Object.entries(placeCategoryLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-medium">Location<input name="location" required minLength={2} maxLength={160} className="h-11 rounded-xl border border-border px-3 font-normal" /></label>
      <label className="grid gap-1.5 text-sm font-medium">What should visitors know?<textarea name="description" required minLength={20} maxLength={2000} className="min-h-28 rounded-xl border border-border p-3 font-normal" /></label>
      <button type="submit" className="h-11 w-fit rounded-full bg-primary px-5 text-sm font-semibold text-white">Send suggestion</button>
    </form>
  </PageContainer></main>;
}
