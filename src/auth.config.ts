import type { NextAuthConfig } from "next-auth";
import GOOGLE from "next-auth/providers/google";

/**
 * Edge-compatible auth config — no database adapter.
 * Used by middleware to check JWT session cookies without hitting the DB.
 * The full auth.ts adds the Drizzle adapter on top of this.
 */
export const authConfig = {
  providers: [GOOGLE],
  pages: {
    error: "/unauthorized",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
