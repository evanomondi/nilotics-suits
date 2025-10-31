import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.BREVO_HOST,
        port: Number(process.env.BREVO_PORT || 587),
        auth: {
          user: process.env.BREVO_USER,
          pass: process.env.BREVO_PASS,
        },
      },
      from: process.env.BREVO_FROM_EMAIL,
      generateVerificationToken: async () => {
        // simple OTP; in production consider rate limiting and secure RNG
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      maxAge: 10 * 60, // 10 minutes
    }),
  ],
  session: { strategy: "jwt" },
  pages: {},
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-ignore
      session.user.role = token.role;
      return session;
    },
  },
});
