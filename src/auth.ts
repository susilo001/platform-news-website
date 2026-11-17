import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { isDemo } from "@/lib/config";
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/cms/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (
        isDemo ||
        account?.provider !== "google" ||
        profile?.email_verified !== true ||
        !user.email
      )
        return false;
      await rateLimit(`login:${user.email.toLowerCase()}`, 20, 15 * 60 * 1000);
      const staff = await db.user.findUnique({
        where: { email: user.email.toLowerCase() },
      });
      return !!staff?.active;
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email.toLowerCase();
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.email = String(token.email ?? "");
      return session;
    },
  },
});
