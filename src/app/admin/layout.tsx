import type { ReactNode } from "react";
import Link from "next/link";
import { logout } from "@/features/auth/actions";
import { requireAccountType } from "@/lib/authz";

export const instant = false;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAccountType(["ADMIN", "SUPER_ADMIN"]);
  const roleLabel = user.accountType === "SUPER_ADMIN" ? "Super Admin" : "Admin";

  return <>
    <div className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="font-semibold text-foreground">Administration</Link>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">{roleLabel}</span>
        </div>
        <form action={logout}>
          <button type="submit" className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-background">Sign out</button>
        </form>
      </div>
    </div>
    {children}
  </>;
}
