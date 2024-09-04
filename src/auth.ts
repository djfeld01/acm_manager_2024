import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import GOOGLE from "next-auth/providers/google";
import NextAuth from "next-auth";
import { accounts, users, verificationTokens, sessions } from "./db/schema";

declare module "next-auth" {
  interface User {
    role?: string | null;
    givenName?: string | null;
    preferLanguage?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // debug: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokenTable: verificationTokens,
    sessionsTable: sessions,
  }),
  providers: [
    GOOGLE,
    // GOOGLE({
    //   profile(profile) {
    //     console.log(profile.role);
    //     return {
    //       id: profile.sub,
    //       name: profile.name,
    //       email: profile.email,
    //       image: profile.picture,
    //       role: profile.role ?? "USER",
    //     };
    //   },
    // }),
  ],
  callbacks: {
    async session({ session, user }) {
      console.log(`We are in the session callback: ${session.user.role}`);
      console.log(`here is a user role: ${user.role}`);
      session.user.role = user.role;
      return session;
    },
  },
});
