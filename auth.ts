import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Keep sessions cookie-based for simpler auth checks while still persisting users/accounts in Postgres.
  session: { strategy: "jwt" },
  providers: [Google],
});
