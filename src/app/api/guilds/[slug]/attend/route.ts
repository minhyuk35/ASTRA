import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const guild = await prisma.guild.findUnique({ where: { slug } });
  if (!guild) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.guildMember.findFirst({
    where: { userId: session.user.id, guildId: guild.id },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    const attendance = await prisma.attendance.create({
      data: { userId: session.user.id, date: today, points: 10 },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 10 } },
    });
    await prisma.guild.update({
      where: { id: guild.id },
      data: { xp: { increment: 5 } },
    });
    return NextResponse.json({ ok: true, points: attendance.points });
  } catch {
    return NextResponse.json({ error: "Already attended today" }, { status: 409 });
  }
}
