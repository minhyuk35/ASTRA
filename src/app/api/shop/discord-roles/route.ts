import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDiscordRoleShop, getRoleStatuses, queueRoleGrant } from "@/lib/bot-db";
import { awardBadge, syncBadges } from "@/lib/badges";

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
  if (!discordId) {
    return NextResponse.json({ linked: false, items: [], sitePoints: 0 });
  }

  const [items, statuses, user] = await Promise.all([
    getDiscordRoleShop(),
    getRoleStatuses(discordId),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { points: true } }),
  ]);
  syncBadges(session.user.id).catch(() => {});

  const ownedSet = new Set(statuses.owned);
  const pendingSet = new Set(statuses.pending);

  return NextResponse.json({
    linked: true,
    sitePoints: user?.points ?? 0,
    items: items.map((it) => ({
      ...it,
      owned: ownedSet.has(it.roleId),
      pending: pendingSet.has(it.roleId),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { roleId } = await req.json();
  if (!roleId || typeof roleId !== "string")
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });

  const discordId = await getDiscordId(session.user.id);
  if (!discordId) return NextResponse.json({ error: "디스코드 연동이 필요해요." }, { status: 400 });

  const items = await getDiscordRoleShop();
  const item = items.find((i) => i.roleId === roleId);
  if (!item) return NextResponse.json({ error: "역할을 찾을 수 없어요." }, { status: 404 });

  const statuses = await getRoleStatuses(discordId);
  if (statuses.owned.includes(roleId))
    return NextResponse.json({ error: "이미 보유한 역할이에요." }, { status: 400 });
  if (statuses.pending.includes(roleId))
    return NextResponse.json({ error: "지급 처리 중인 역할이에요." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { points: true } });
  if (!user || user.points < item.sitePrice)
    return NextResponse.json({ error: `포인트가 부족해요. (필요 ${item.sitePrice} pts)` }, { status: 400 });

  // 사이트 포인트 차감
  await prisma.user.update({
    where: { id: session.user.id },
    data: { points: { decrement: item.sitePrice } },
  });

  // 봇 지급 큐 등록 (실패 시 환불)
  const queued = await queueRoleGrant({
    discordUserId: discordId,
    roleId,
    siteUserId: session.user.id,
    refundPoints: item.sitePrice,
  });
  if (!queued) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { points: { increment: item.sitePrice } },
    });
    return NextResponse.json(
      { error: "지급 큐 등록에 실패했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  await awardBadge(session.user.id, "role_buyer");

  const updated = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { points: true },
  });
  return NextResponse.json({ ok: true, sitePoints: updated?.points ?? 0, pending: true });
}
