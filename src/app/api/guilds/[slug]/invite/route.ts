import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { nickname } = body as { nickname?: string };
  if (!nickname?.trim()) return NextResponse.json({ error: "Nickname required" }, { status: 400 });

  const guild = await prisma.guild.findUnique({
    where: { slug },
    include: { members: true, _count: { select: { members: true } } },
  });
  if (!guild) return NextResponse.json({ error: "Guild not found" }, { status: 404 });

  const senderMembership = guild.members.find((m) => m.userId === session.user.id);
  if (!senderMembership || (senderMembership.role !== "LEADER" && senderMembership.role !== "SUBLEADER"))
    return NextResponse.json({ error: "Only leader or subleader can invite" }, { status: 403 });

  if (guild._count.members >= guild.capacity)
    return NextResponse.json({ error: "Guild is full" }, { status: 409 });

  const target = await prisma.user.findFirst({
    where: { OR: [{ nickname: nickname.trim() }, { name: nickname.trim() }] },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const alreadyMember = await prisma.guildMember.findUnique({ where: { userId: target.id } });
  if (alreadyMember) return NextResponse.json({ error: "User is already in a guild" }, { status: 409 });

  const pendingInvite = await prisma.message.findFirst({
    where: { type: "GUILD_INVITATION", recipientId: target.id, guildId: guild.id, read: false },
  });
  if (pendingInvite) return NextResponse.json({ error: "이미 초대를 보냈어요." }, { status: 409 });

  const sender = await prisma.user.findUnique({ where: { id: session.user.id } });

  await prisma.message.create({
    data: {
      type: "GUILD_INVITATION",
      title: `${guild.name} 길드 초대`,
      preview: `${sender?.nickname ?? sender?.name ?? "길드장"}님이 ${guild.name} 길드에 초대했습니다.`,
      senderId: session.user.id,
      recipientId: target.id,
      guildId: guild.id,
    },
  });

  return NextResponse.json({ ok: true });
}
