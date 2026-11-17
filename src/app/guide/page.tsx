import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccountType } from "@/lib/authz";
import { logout } from "@/features/auth/actions";
import { GuideProfileForm } from "@/features/guides/components/guide-profile-form";

export const instant = false;
type Search = Promise<{ error?: string; saved?: string }>;

export default async function GuideHomePage({ searchParams }: { searchParams: Search }) {
  const user = await requireAccountType(["TOUR_GUIDE"]);
  const [application, params] = await Promise.all([
    prisma.guideApplication.findUnique({
      where: { userId: user.id },
      include: { guide: { include: { user: { select: { image: true } }, images: { orderBy: { sortOrder: "asc" } } } } },
    }),
    searchParams,
  ]);
  const profile = application?.status === "APPROVED" ? application.guide : null;
  return <main className="mx-auto grid min-h-screen max-w-5xl content-start gap-5 px-5 py-12 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Guide workspace</p><h1 className="mt-2 text-3xl font-semibold">Welcome{user.name ? `, ${user.name}` : ""}</h1></div><Link href="/guides" className="text-sm font-semibold text-primary hover:underline">View public guide directory</Link></header>
    {params.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error}</p>}
    {params.saved && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Your guide profile was saved.</p>}
    {!application && <section className="rounded-2xl border border-border bg-white p-6"><h2 className="font-semibold">No guide application found</h2><p className="mt-2 text-sm text-muted">Apply through the guide registration form to create a provider profile.</p></section>}
    {application?.status === "PENDING" && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-semibold text-amber-950">Your application is being reviewed</h2><p className="mt-2 text-sm leading-6 text-amber-900">Your profile is private until an admin approves the application.</p></section>}
    {application?.status === "REJECTED" && <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-semibold text-red-950">Your application was not approved</h2><p className="mt-2 text-sm leading-6 text-red-900">Contact the platform team if you need help with your application.</p></section>}
    {profile && <><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">Your approved profile is public at <Link className="font-semibold underline" href={`/guides/${profile.slug}`}>/guides/{profile.slug}</Link>. <Link href="/activities/suggest" className="ml-2 font-semibold underline">Submit an activity</Link></div><GuideProfileForm profile={profile} /></>}
    <form action={logout}><button className="w-fit rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium">Sign out</button></form>
  </main>;
}
