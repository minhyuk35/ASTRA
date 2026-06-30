import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SHOP_ITEMS } from "@/lib/shop-items";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(SHOP_ITEMS.map((item) => ({ ...item, owned: false, equipped: false })));
  }

  const inventory = await prisma.userInventory.findMany({
    where: { userId: session.user.id },
    select: { itemId: true, equipped: true },
  });

  const owned = new Map(inventory.map((i) => [i.itemId, i.equipped]));

  return NextResponse.json(
    SHOP_ITEMS.map((item) => ({
      ...item,
      owned:    owned.has(item.id),
      equipped: owned.get(item.id) ?? false,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { itemId } = await req.json();
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "아이템을 찾을 수 없어요." }, { status: 404 });

  const [existing, user] = await Promise.all([
    prisma.userInventory.findUnique({
      where: { userId_itemId: { userId: session.user.id, itemId } },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { points: true } }),
  ]);

  if (existing) return NextResponse.json({ error: "이미 보유한 아이템이에요." }, { status: 400 });
  if (!user || user.points < item.price)
    return NextResponse.json({ error: `포인트가 부족해요. (필요: ${item.price}pts)` }, { status: 400 });

  const [, updatedUser] = await prisma.$transaction([
    prisma.userInventory.create({ data: { userId: session.user.id, itemId } }),
    prisma.user.update({ where: { id: session.user.id }, data: { points: { decrement: item.price } }, select: { points: true } }),
  ]);

  return NextResponse.json({ success: true, points: updatedUser.points }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { itemId, equipped } = await req.json();
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "아이템을 찾을 수 없어요." }, { status: 404 });

  const entry = await prisma.userInventory.findUnique({
    where: { userId_itemId: { userId: session.user.id, itemId } },
  });
  if (!entry) return NextResponse.json({ error: "보유하지 않은 아이템이에요." }, { status: 400 });

  // Unequip other items of same type if equipping
  if (equipped) {
    const sameTypeIds = SHOP_ITEMS.filter((i) => i.type === item.type).map((i) => i.id);
    await prisma.userInventory.updateMany({
      where: { userId: session.user.id, itemId: { in: sameTypeIds } },
      data: { equipped: false },
    });
  }

  await prisma.userInventory.update({
    where: { userId_itemId: { userId: session.user.id, itemId } },
    data: { equipped },
  });

  return NextResponse.json({ success: true });
}
