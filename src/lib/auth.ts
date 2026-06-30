import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId:     process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn:  "/auth/login",
    signOut: "/",
    error:   "/auth/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const u = user as { role?: string; nickname?: string; handle?: string; managerScope?: string | null };
        session.user.id           = user.id;
        session.user.role         = u.role         ?? "USER";
        session.user.nickname     = u.nickname     ?? null;
        session.user.handle       = u.handle       ?? null;
        session.user.managerScope = u.managerScope ?? null;
      }
      return session;
    },
    // NextAuth는 이미 연동된 계정으로 재로그인할 때 Account 행의 토큰을 자동으로
    // 갱신해 주지 않는다 — "재연동" 버튼이 실제로 만료된 토큰을 고치도록 여기서 직접 갱신.
    async signIn({ account }) {
      if (account?.provider && account.providerAccountId && account.access_token) {
        await prisma.account.updateMany({
          where: { provider: account.provider, providerAccountId: account.providerAccountId },
          data: {
            access_token:  account.access_token,
            refresh_token: account.refresh_token ?? undefined,
            expires_at:    account.expires_at    ?? undefined,
            token_type:    account.token_type    ?? undefined,
            scope:         account.scope         ?? undefined,
          },
        });
      }
      return true;
    },
  },
  events: {
    // 신규 가입 시 handle 이 비어 있으면 랜덤 핸들을 자동 발급(중복 시 재시도).
    async createUser({ user }) {
      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        select: { handle: true },
      });
      if (existing?.handle) return;
      for (let i = 0; i < 8; i++) {
        const handle = `astra-${Math.random().toString(36).slice(2, 8)}`;
        try {
          await prisma.user.update({ where: { id: user.id }, data: { handle } });
          return;
        } catch {
          // handle unique 충돌 → 재시도
        }
      }
    },
  },
};
