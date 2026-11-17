import { PreferencesForm } from "@/features/tourist/components/preferences-form";
import { requireAccountType } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const instant = false;
type Search = Promise<{ status?: string }>;

export default async function TouristPreferencesPage({ searchParams }: { searchParams: Search }) {
  const user = await requireAccountType(["TOURIST"]);
  const [params, profile] = await Promise.all([
    searchParams,
    prisma.touristProfile.findUnique({ where: { userId: user.id }, select: { travelInterests: true, travelStyle: true, preferredPace: true } }),
  ]);
  return <div className="grid gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Optional profile details</p><h2 className="mt-2 text-2xl font-medium">Travel preferences</h2></div><PreferencesForm interests={profile?.travelInterests ?? []} style={profile?.travelStyle ?? ""} pace={profile?.preferredPace ?? ""} status={params.status} /></div>;
}
