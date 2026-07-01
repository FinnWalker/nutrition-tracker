import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const authConfig = {
  providers: [Google],
} satisfies NextAuthConfig;

export default authConfig;
