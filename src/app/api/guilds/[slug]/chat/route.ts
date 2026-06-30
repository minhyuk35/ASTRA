import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const guild = await prisma.guild.findUnique({ where: { slug } });
  if (!guild) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.guildMember.findFirst({
    where: { userId: session.user.id, guildId: guild.id },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const messages = await prisma.guildChatMessage.findMany({
    where: { guildId: guild.id },
    orderBy: { createdAt: "asc" },
    take: 60,
    include: {
      author: { select: { id: true, nickname: true, name: true, image: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const guild = await prisma.guild.findUnique({ where: { slug } });
  if (!guild) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const membership = await prisma.guildMember.findFirst({
    where: { userId: session.user.id, guildId: guild.id },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { content } = body as { content?: string };
  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const msg = await prisma.guildChatMessage.create({
    data: {
      guildId: guild.id,
      authorId: session.user.id,
      content: content.trim().slice(0, 400),
    },
    include: {
      author: { select: { id: true, nickname: true, name: true, image: true } },
    },
  });

  return NextResponse.json(msg, { status: 201 });
}
