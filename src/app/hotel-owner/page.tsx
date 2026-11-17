import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAccountType } from "@/lib/authz";
import { logout } from "@/features/auth/actions";
import { HotelProfileForm } from "@/features/hotels/components/hotel-profile-form";
import { RoomTypeForm } from "@/features/hotels/components/room-type-form";

export const instant = false;
type Search = Promise<{ error?: string; saved?: string; roomSaved?: string; roomDeleted?: string }>;

export default async function HotelOwnerHomePage({ searchParams }: { searchParams: Search }) {
  const user = await requireAccountType(["HOTEL_OWNER"]);
  const [application, params] = await Promise.all([
    prisma.hotelApplication.findUnique({ where: { userId: user.id }, include: { hotel: { include: { images: { orderBy: { sortOrder: "asc" } }, roomTypes: { orderBy: { name: "asc" } } } } } }),
    searchParams,
  ]);
  const approved = application?.status === "APPROVED" && application.hotel;

  return <main className="mx-auto grid min-h-screen max-w-5xl content-start gap-5 px-5 py-12 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Hotel owner workspace</p><h1 className="mt-2 text-3xl font-semibold">Welcome{user.name ? `, ${user.name}` : ""}</h1></div><Link href="/hotels" className="text-sm font-semibold text-primary hover:underline">View public hotels</Link></header>
    {params.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error}</p>}
    {params.saved && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Your hotel profile was saved.</p>}
    {params.roomSaved && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Room type saved.</p>}
    {params.roomDeleted && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Room type deleted.</p>}
    {!application && <section className="rounded-2xl border border-border bg-white p-6"><h2 className="font-semibold">No hotel application found</h2><p className="mt-2 text-sm text-muted">Apply with a separate hotel owner account to create a provider profile.</p></section>}
    {application?.status === "PENDING" && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-semibold text-amber-950">Your application is being reviewed</h2><p className="mt-2 text-sm leading-6 text-amber-900">Your hotel details stay private until an admin approves the application. You can update your public profile after approval.</p></section>}
    {application?.status === "REJECTED" && <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-semibold text-red-950">Your application was not approved</h2><p className="mt-2 text-sm leading-6 text-red-900">Contact the platform team if you need help with your application.</p></section>}
    {approved && <><HotelProfileForm hotel={approved} /><section className="grid gap-4 rounded-2xl border border-border bg-white p-5 sm:p-6"><div><h2 className="text-xl font-semibold">Room types</h2><p className="mt-1 text-sm text-muted">Show your room options, maximum guests, and fixed price per night. This does not create bookings.</p></div>
      {approved.roomTypes.map((room) => <RoomTypeForm key={room.id} room={room} />)}<RoomTypeForm />
    </section></>}
    <form action={logout}><button className="w-fit rounded-full border border-border px-5 py-2.5 text-sm font-medium">Sign out</button></form>
  </main>;
}
