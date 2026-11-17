import type { DefaultSession } from "next-auth";
import type { AccountType } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountType: AccountType;
    } & DefaultSession["user"];
  }

  interface User {
    accountType: AccountType;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountType?: AccountType;
  }
}
