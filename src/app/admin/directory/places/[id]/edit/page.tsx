import { notFound } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { PlaceForm } from "@/features/directory/components/place-form";
import { requireAccountType } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function EditDirectoryPlacePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const place = await prisma.place.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" }, select: { url: true } } } });
  if (!place) notFound();
  return <main className="py-12"><PageContainer className="max-w-4xl"><Link href="/admin/directory" className="text-sm font-medium text-primary hover:underline">← Directory management</Link><h1 className="mt-5 text-3xl font-medium">Edit {place.name}</h1><p className="mt-2 text-sm text-muted">Current status: {place.status.toLowerCase()}.</p>{query.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-900">{query.error}</p>}<div className="mt-6"><PlaceForm place={place} /></div></PageContainer></main>;
}
