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
  const pts = parseInt((body as { amount?: string | number }).amount as string, 10);
  if (!pts || pts < 1 || pts > 100000)
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const guild = await prisma.guild.findUnique({ where: { slug } });
  if (!guild) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.guildMember.findFirst({
    where: { userId: session.user.id, guildId: guild.id },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.points < pts)
    return NextResponse.json({ error: "Insufficient points" }, { status: 400 });

  // use transaction so points and xp are always consistent
  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { points: { decrement: pts } } }),
    prisma.guild.update({ where: { id: guild.id }, data: { xp: { increment: pts } } }),
  ]);

  return NextResponse.json({ ok: true });
}
