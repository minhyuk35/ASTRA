import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const guild = await prisma.guild.findUnique({
    where: { slug },
    include: {
      members: { where: { role: "LEADER" }, include: { user: true } },
      _count: { select: { members: true } },
    },
  });
  if (!guild) return NextResponse.json({ error: "Guild not found" }, { status: 404 });

  if (guild._count.members >= guild.capacity)
    return NextResponse.json({ error: "Guild is full" }, { status: 409 });

  const already = await prisma.guildMember.findUnique({ where: { userId: session.user.id } });
  if (already) return NextResponse.json({ error: "Already in a guild" }, { status: 409 });

  const pendingRequest = await prisma.message.findFirst({
    where: { type: "JOIN_REQUEST", senderId: session.user.id, guildId: guild.id, read: false },
  });
  if (pendingRequest) return NextResponse.json({ error: "이미 가입 신청을 보냈어요." }, { status: 409 });

  const targets = guild.members.filter((m) => m.role === "LEADER" || m.role === "SUBLEADER");
  if (targets.length === 0) return NextResponse.json({ error: "No leader found" }, { status: 500 });

  const requester = await prisma.user.findUnique({ where: { id: session.user.id } });

  await prisma.message.createMany({
    data: targets.map((t) => ({
      type: "JOIN_REQUEST" as const,
      title: `${requester?.nickname ?? requester?.name ?? "누군가"}의 가입 신청`,
      preview: `${requester?.nickname ?? requester?.name ?? "알 수 없음"}님이 ${guild.name} 길드에 가입을 신청했습니다.`,
      senderId: session.user.id,
      recipientId: t.userId,
      guildId: guild.id,
    })),
  });

  return NextResponse.json({ ok: true });
}
