import { ProfileForm } from "@/features/tourist/components/profile-form";
import { requireAccountType } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const instant = false;
type Search = Promise<{ status?: string }>;

export default async function TouristProfilePage({ searchParams }: { searchParams: Search }) {
  const user = await requireAccountType(["TOURIST"]);
  const [params, record] = await Promise.all([
    searchParams,
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, image: true, touristProfile: { select: { phone: true, homeLocation: true } } } }),
  ]);
  return <div className="grid gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your profile</p><h2 className="mt-2 text-2xl font-medium">Personal information</h2></div><ProfileForm name={record?.name ?? user.name ?? ""} email={record?.email ?? user.email ?? ""} image={record?.image ?? null} phone={record?.touristProfile?.phone ?? ""} homeLocation={record?.touristProfile?.homeLocation ?? ""} status={params.status} /></div>;
}
