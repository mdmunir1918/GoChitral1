import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { accountHome } from "@/lib/authz";

export async function GET(request: Request) {
  const session = await auth();
  const destination = session?.user ? accountHome(session.user.accountType) : "/login";
  return NextResponse.redirect(new URL(destination, request.url));
}
