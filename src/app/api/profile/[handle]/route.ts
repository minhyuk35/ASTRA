import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SHOP_ITEMS } from "@/lib/shop-items";
import { getUserBadges, syncBadges } from "@/lib/badges";

export async function GET(
  _req: NextRequest,
  { params }: { params: { handle: string } },
) {
  const user = await prisma.user.findUnique({
    where: { handle: params.handle },
    select: {
      id: true, nickname: true, handle: true, name: true,
      image: true, bio: true, role: true, managerScope: true, points: true,
      createdAt: true,
      guild:       { select: { guild: { select: { name: true, slug: true } } } },
      _count:      { select: { posts: true } },
      inventories: { where: { equipped: true }, select: { itemId: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const equippedCosmetics: Record<string, { id: number; name: string; previewColor: string }> = {};
  for (const inv of user.inventories) {
    const item = SHOP_ITEMS.find((i) => i.id === inv.itemId);
    if (item) equippedCosmetics[item.type] = { id: item.id, name: item.name, previewColor: item.previewColor };
  }

  await syncBadges(user.id).catch(() => {});
  const badges = await getUserBadges(user.id);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { inventories, ...userData } = user;
  return NextResponse.json({ ...userData, equippedCosmetics, badges });
}
