import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import GOOGLE from "next-auth/providers/google";
import NextAuth from "next-auth";
import {
  accounts,
  users,
  verificationTokens,
  sessions,
  userDetails,
} from "./db/schema";
import { eq } from "drizzle-orm";
import { userDetailsRelations } from "./db/schema/user";

declare module "next-auth" {
  interface User {
    role?: string | null;
    userDetailId?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // debug: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
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
    async signIn({ user, email }) {
      const userDetail = await db.query.userDetails.findFirst({
        where: (userDetails, { eq }) =>
          eq(userDetails.email, user?.email || ""),
      });
      if (!userDetail) {
        return "/unauthorized";
      }
      if (!user?.userDetailId) {
        await db
          .update(users)
          .set({ userDetailId: userDetail.id })
          .where(eq(users.email, userDetail?.email));
        return true;
      }
      return true;
    },
    async session({ session, user }) {
      session.user.role = user.role;
      session.user.userDetailId = user.userDetailId;

      return session;
    },
  },
});
