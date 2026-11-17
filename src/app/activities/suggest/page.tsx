import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageContainer } from "@/components/ui/page-container";
import { ActivitySubmissionForm } from "@/features/directory/components/activity-form";
import { requireAccountType } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function SuggestActivityPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const guide = await requireAccountType(["TOUR_GUIDE"]);
  const application = await prisma.guideApplication.findUnique({ where: { userId: guide.id }, select: { status: true } });
  if (application?.status !== "APPROVED") redirect("/guide?error=Your+guide+application+must+be+approved+first");
  const params = await searchParams;
  return <main className="py-12"><PageContainer className="max-w-3xl">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Guide contribution</p><h1 className="mt-3 text-3xl font-medium tracking-tight">Submit an activity</h1><p className="mt-3 text-sm leading-6 text-muted">Only approved guide accounts can submit activities. An admin reviews each submission before it becomes public.</p>
    {params.submitted && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Activity submitted for review.</p>}
    {params.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-900">{params.error}</p>}
    <div className="mt-6"><ActivitySubmissionForm /></div>
  </PageContainer></main>;
}
