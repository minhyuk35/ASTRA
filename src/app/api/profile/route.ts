import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SHOP_ITEMS } from "@/lib/shop-items";

const NICKNAME_CHANGE_COST = 50;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts:    { select: { provider: true, providerAccountId: true } },
      robloxLink:  true,
      guild:       { include: { guild: { select: { name: true, slug: true } } } },
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { inventories, ...userData } = user;
  return NextResponse.json({ ...userData, equippedCosmetics });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { nickname, handle, bio, image } = body as {
    nickname?: string; handle?: string; bio?: string; image?: string;
  };

  // image must be https URL or omitted
  if (image !== undefined && image !== null) {
    try {
      const url = new URL(image);
      if (url.protocol !== "https:" && url.protocol !== "http:")
        return NextResponse.json({ error: "이미지 URL이 올바르지 않아요." }, { status: 400 });
    } catch {
      return NextResponse.json({ error: "이미지 URL이 올바르지 않아요." }, { status: 400 });
    }
  }

  // input length limits
  if (nickname !== undefined && nickname.length > 30)
    return NextResponse.json({ error: "닉네임은 30자 이내로 입력해주세요." }, { status: 400 });
  if (handle !== undefined && handle.length > 30)
    return NextResponse.json({ error: "핸들은 30자 이내로 입력해주세요." }, { status: 400 });
  if (bio !== undefined && bio.length > 300)
    return NextResponse.json({ error: "자기소개는 300자 이내로 입력해주세요." }, { status: 400 });

  // handle must be alphanumeric/underscore/hyphen only
  if (handle !== undefined && handle !== "" && !/^[a-zA-Z0-9_-]+$/.test(handle))
    return NextResponse.json({ error: "핸들은 영문, 숫자, _, - 만 사용할 수 있어요." }, { status: 400 });

  const userId = session.user.id;

  // Run all read queries in parallel
  const [currentUser, nicknameTaken, handleTaken] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { nickname: true, handle: true, points: true } }),
    nickname !== undefined
      ? prisma.user.findFirst({ where: { nickname, NOT: { id: userId } }, select: { id: true } })
      : Promise.resolve(null),
    handle !== undefined
      ? prisma.user.findFirst({ where: { handle, NOT: { id: userId } }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isNicknameChange = nickname !== undefined && nickname !== currentUser.nickname;
  if (isNicknameChange) {
    if (nicknameTaken) return NextResponse.json({ error: "이미 사용 중인 닉네임이에요." }, { status: 409 });
    if (currentUser.nickname !== null && currentUser.points < NICKNAME_CHANGE_COST)
      return NextResponse.json({ error: `닉네임 변경에 ${NICKNAME_CHANGE_COST} 포인트가 필요해요. (현재: ${currentUser.points})` }, { status: 400 });
  }

  const isHandleChange = handle !== undefined && handle !== currentUser.handle;
  if (isHandleChange && handleTaken)
    return NextResponse.json({ error: "이미 사용 중인 핸들이에요." }, { status: 409 });

  const updateData: Record<string, unknown> = {};
  if (nickname !== undefined) updateData.nickname = nickname;
  if (handle   !== undefined) updateData.handle   = handle;
  if (bio      !== undefined) updateData.bio       = bio;
  if (image    !== undefined) updateData.image     = image;

  // Deduct points for nickname change (only when already had a nickname)
  if (isNicknameChange && currentUser.nickname !== null) {
    updateData.points = { decrement: NICKNAME_CHANGE_COST };
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
  return NextResponse.json(updated);
}
