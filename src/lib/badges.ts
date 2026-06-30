import { prisma } from "@/lib/prisma";
import { getRoleStatuses } from "@/lib/bot-db";

export type BadgeDef = { key: string; emoji: string; label: string; description: string };

// 배지 메타데이터(보유는 user_badges 테이블에 badgeKey 로 저장)
export const BADGES: BadgeDef[] = [
  { key: "linked",       emoji: "🔗", label: "연결됨",   description: "디스코드 연동 완료" },
  { key: "role_buyer",   emoji: "🎭", label: "입문자",   description: "디스코드 역할 첫 구매" },
  { key: "collector",    emoji: "👑", label: "수집가",   description: "디스코드 역할 5종 이상 보유" },
  { key: "exchanger",    emoji: "💱", label: "환전상",   description: "포인트 환전 경험" },
  { key: "attendance7",  emoji: "📅", label: "개근",     description: "출석 7일 누적" },
  { key: "early",        emoji: "🚀", label: "얼리 크루", description: "초기 가입 크루" },
];

export const BADGE_MAP: Record<string, BadgeDef> = Object.fromEntries(BADGES.map((b) => [b.key, b]));

export async function awardBadge(userId: string, key: string): Promise<void> {
  if (!BADGE_MAP[key]) return;
  try {
    await prisma.userBadge.upsert({
      where: { userId_badgeKey: { userId, badgeKey: key } },
      update: {},
      create: { userId, badgeKey: key },
    });
  } catch {
    // 멱등 — 중복 무시
  }
}

export async function getUserBadges(userId: string): Promise<BadgeDef[]> {
  try {
    const rows = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeKey: true },
    });
    return rows.map((r) => BADGE_MAP[r.badgeKey]).filter(Boolean) as BadgeDef[];
  } catch {
    return [];
  }
}

// 조건을 점검해 자동 부여(멱등). 프로필/상점 로드 시 호출.
export async function syncBadges(userId: string): Promise<void> {
  try {
    const account = await prisma.account.findFirst({
      where: { userId, provider: "discord" },
      select: { providerAccountId: true },
    });
    if (account?.providerAccountId) {
      await awardBadge(userId, "linked");
      const { owned } = await getRoleStatuses(account.providerAccountId);
      if (owned.length >= 1) await awardBadge(userId, "role_buyer");
      if (owned.length >= 5) await awardBadge(userId, "collector");
    }

    const attendanceCount = await prisma.attendance.count({ where: { userId } });
    if (attendanceCount >= 7) await awardBadge(userId, "attendance7");

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    if (me) {
      const earlierCount = await prisma.user.count({ where: { createdAt: { lt: me.createdAt } } });
      if (earlierCount < 50) await awardBadge(userId, "early");
    }
  } catch {
    // 동기화 실패는 조용히 무시
  }
}
