import { requireAccountType } from "@/lib/authz";
import Link from "next/link";

export const instant = false;

export default async function AdminHomePage() {
  await requireAccountType(["ADMIN", "SUPER_ADMIN"]);

  return <main className="mx-auto max-w-4xl px-6 py-16"><h1 className="text-3xl font-semibold">Administration</h1><p className="mt-3 text-muted">Review provider applications and manage directory content.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/admin/hotel-applications" className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Review hotel applications</Link><Link href="/admin/guide-applications" className="inline-flex rounded-full border border-border px-5 py-3 text-sm font-semibold">Review guide applications</Link><Link href="/admin/directory" className="inline-flex rounded-full border border-border px-5 py-3 text-sm font-semibold">Manage tourism directory</Link></div></main>;
}
