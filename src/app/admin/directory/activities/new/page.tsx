import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { ActivitySubmissionForm } from "@/features/directory/components/activity-form";
import { requireAccountType } from "@/lib/authz";

export const instant = false;

export default async function NewDirectoryActivityPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const { error } = await searchParams;
  return <main className="py-12"><PageContainer className="max-w-4xl"><Link href="/admin/directory" className="text-sm font-medium text-primary hover:underline">← Directory management</Link><h1 className="mt-5 text-3xl font-medium">Create activity</h1>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-900">{error}</p>}<div className="mt-6"><ActivitySubmissionForm mode="create" /></div></PageContainer></main>;
}
