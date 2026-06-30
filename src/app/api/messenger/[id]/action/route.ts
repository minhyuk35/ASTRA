import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { action } = body as { action?: string };
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const msg = await prisma.message.findFirst({
    where: { id, recipientId: session.user.id },
  });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.message.update({ where: { id }, data: { read: true } });

  if (action === "accept" && msg.guildId) {
    let targetUserId: string;

    if (msg.type === "GUILD_INVITATION") {
      targetUserId = session.user.id;
    } else if (msg.type === "JOIN_REQUEST") {
      if (!msg.senderId) return NextResponse.json({ error: "No sender" }, { status: 400 });
      targetUserId = msg.senderId;
    } else {
      return NextResponse.json({ ok: true });
    }

    const alreadyMember = await prisma.guildMember.findUnique({ where: { userId: targetUserId } });
    if (!alreadyMember) {
      const guild = await prisma.guild.findUnique({
        where: { id: msg.guildId },
        include: { _count: { select: { members: true } } },
      });
      if (guild && guild._count.members < guild.capacity) {
        await prisma.guildMember.create({
          data: { userId: targetUserId, guildId: msg.guildId, role: "MEMBER" },
        });
      }
    }

    if (msg.type === "JOIN_REQUEST" && msg.senderId) {
      await prisma.message.create({
        data: {
          type: "SYSTEM",
          title: "길드 가입 신청 승인",
          preview: "길드 가입 신청이 승인되었습니다. 환영합니다!",
          recipientId: msg.senderId,
          guildId: msg.guildId,
        },
      });
    }
  }

  if (action === "reject" && msg.senderId && (msg.type === "GUILD_INVITATION" || msg.type === "JOIN_REQUEST")) {
    const actorName = session.user.nickname ?? session.user.name ?? "상대방";

    await prisma.message.create({
      data: {
        type: "SYSTEM",
        title: msg.type === "GUILD_INVITATION" ? "길드 초대 거절" : "길드 가입 신청 거절",
        preview:
          msg.type === "GUILD_INVITATION"
            ? `${actorName}님이 길드 초대를 거절했습니다.`
            : `${actorName}님이 길드 가입 신청을 거절했습니다.`,
        recipientId: msg.senderId,
        guildId: msg.guildId,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
