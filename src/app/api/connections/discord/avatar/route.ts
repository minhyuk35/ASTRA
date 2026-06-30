import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "discord" },
    select: { providerAccountId: true, access_token: true, expires_at: true },
  });

  if (!account) return NextResponse.json({ error: "Discord 연동이 필요해요." }, { status: 400 });
  if (!account.access_token)
    return NextResponse.json({ error: "Discord 토큰이 없어요. 재연동해 주세요.", code: "RECONNECT_REQUIRED" }, { status: 400 });

  if (account.expires_at && account.expires_at < Math.floor(Date.now() / 1000)) {
    return NextResponse.json({ error: "Discord 토큰이 만료됐어요. 재연동해 주세요.", code: "RECONNECT_REQUIRED" }, { status: 400 });
  }

  const discordRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${account.access_token}` },
  });

  if (!discordRes.ok) {
    if (discordRes.status === 401)
      return NextResponse.json({ error: "Discord 토큰이 만료됐어요. 재연동해 주세요.", code: "RECONNECT_REQUIRED" }, { status: 400 });
    return NextResponse.json({ error: "Discord에서 정보를 가져오지 못했어요." }, { status: 502 });
  }

  const discordUser = await discordRes.json() as { id: string; avatar: string | null };

  if (!discordUser.avatar) {
    // No custom avatar — use default Discord avatar (color based on discriminator)
    const defaultIdx = Number(parseInt(discordUser.id, 10) % 6);
    const url = `https://cdn.discordapp.com/embed/avatars/${defaultIdx}.png`;
    const imageRes = await fetch(url);
    const buf = await imageRes.arrayBuffer();
    const base64 = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
    await prisma.user.update({ where: { id: session.user.id }, data: { image: base64 } });
    return NextResponse.json({ image: base64 });
  }

  const ext = discordUser.avatar.startsWith("a_") ? "gif" : "png";
  const url = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${ext}?size=256`;

  const imageRes = await fetch(url);
  if (!imageRes.ok) return NextResponse.json({ error: "아바타 이미지를 가져오지 못했어요." }, { status: 502 });

  const buf = await imageRes.arrayBuffer();
  const mime = ext === "gif" ? "image/gif" : "image/png";
  const base64 = `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;

  await prisma.user.update({ where: { id: session.user.id }, data: { image: base64 } });

  return NextResponse.json({ image: base64 });
}
