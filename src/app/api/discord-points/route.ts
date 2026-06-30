import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDiscordPoints, deductDiscordPoints } from "@/lib/bot-db";

// 전환 비율: DISCORD 100pts → ASTRA 1pt (1,000 Discord = 10 ASTRA)
const CONVERT_RATE = 100;

async function getDiscordId(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "discord" },
  });
  return account?.providerAccountId ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const discordId = await getDiscordId(session.user.id);
  if (!discordId) return NextResponse.json({ discordPoints: null, sitePoints: 0 });

  const [discordPoints, user] = await Promise.all([
    getDiscordPoints(discordId),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { points: true } }),
  ]);

  return NextResponse.json({ discordPoints, sitePoints: user?.points ?? 0 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || typeof amount !== "number" || amount < 1)
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const astraPoints = Math.floor(amount / CONVERT_RATE);
  if (astraPoints < 1)
    return NextResponse.json({ error: `최소 ${CONVERT_RATE} Discord 포인트부터 전환할 수 있어요.` }, { status: 400 });

  const discordId = await getDiscordId(session.user.id);
  if (!discordId) return NextResponse.json({ error: "Discord 계정이 연결되어 있지 않아요." }, { status: 400 });

  const success = await deductDiscordPoints(discordId, amount);
  if (!success) return NextResponse.json({ error: "Discord 포인트가 부족해요." }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { points: { increment: astraPoints } },
    select: { points: true },
  });

  return NextResponse.json({ ok: true, sitePoints: updated.points, astraReceived: astraPoints });
}
