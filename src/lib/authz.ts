import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { AccountType } from "@prisma/client";

import { auth } from "@/auth";

export function accountHome(accountType: AccountType) {
  switch (accountType) {
    case "TOUR_GUIDE":
      return "/guide";
    case "HOTEL_OWNER":
      return "/hotel-owner";
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
    default:
      return "/tourist";
  }
}

export async function requireAccountType(allowed: AccountType[]) {
  await connection();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!allowed.includes(session.user.accountType)) redirect(accountHome(session.user.accountType));
  return session.user;
}

export async function redirectSignedInUser() {
  await connection();
  const session = await auth();
  if (session?.user) redirect(accountHome(session.user.accountType));
}
