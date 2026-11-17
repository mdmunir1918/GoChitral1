import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { AccountType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/features/auth/schemas";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (!user?.passwordHash) return null;

      const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!passwordMatches) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.accountType = user.accountType;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        const accountType = Object.values(AccountType).find(
          (candidate) => candidate === token.accountType,
        );
        session.user.accountType = accountType ?? AccountType.TOURIST;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
