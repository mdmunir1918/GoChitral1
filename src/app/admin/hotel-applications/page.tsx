import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccountType } from "@/lib/authz";
import { reviewHotelApplicationAction } from "@/features/hotels/actions";

export const instant = false;
type Search = Promise<{ error?: string; reviewed?: string }>;

export default async function HotelApplicationsPage({ searchParams }: { searchParams: Search }) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const [applications, params] = await Promise.all([
    prisma.hotelApplication.findMany({ where: { status: "PENDING" }, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } }),
    searchParams,
  ]);
  return <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8"><Link href="/admin" className="text-sm font-semibold text-primary hover:underline">← Administration</Link><h1 className="mt-4 text-3xl font-semibold">Hotel applications</h1><p className="mt-2 text-sm text-muted">Approve an application to create its public hotel profile. Pending hotel details are private.</p>
    {params.error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error}</p>}
    {params.reviewed && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Application {params.reviewed}.</p>}
    {applications.length ? <div className="mt-6 grid gap-4">{applications.map((application) => <article key={application.id} className="rounded-2xl border border-border bg-white p-5 sm:p-6"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-semibold">{application.hotelName}</h2><p className="mt-1 text-sm text-muted">{application.hotelLocation} · {application.user.name ?? "Owner"} · {application.user.email}</p></div><p className="text-xs text-muted">Submitted {application.createdAt.toLocaleDateString()}</p></div><p className="mt-4 whitespace-pre-line text-sm leading-6">{application.hotelDescription}</p><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted">Phone / WhatsApp</dt><dd>{application.phone} · {application.whatsapp}</dd></div><div><dt className="text-muted">Business information</dt><dd>{application.businessDetails}</dd></div><div className="sm:col-span-2"><dt className="text-muted">Verification details</dt><dd className="whitespace-pre-line">{application.verificationDetails}</dd></div></dl><div className="mt-5 flex gap-3"><form action={reviewHotelApplicationAction}><input type="hidden" name="id" value={application.id} /><input type="hidden" name="decision" value="approve" /><button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">Approve and publish</button></form><form action={reviewHotelApplicationAction}><input type="hidden" name="id" value={application.id} /><input type="hidden" name="decision" value="reject" /><button className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-800">Reject</button></form></div></article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-border bg-white p-8 text-center"><h2 className="font-semibold">No pending hotel applications</h2><p className="mt-2 text-sm text-muted">New provider applications will appear here.</p></div>}
  </main>;
}
