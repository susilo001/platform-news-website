import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { isDemo } from "@/lib/config";
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  pages: { signIn: "/cms/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async signIn({ user }) {
      if (isDemo || !user.email) return false;
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
