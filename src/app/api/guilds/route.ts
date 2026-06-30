import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  const [guilds, myMembership] = await Promise.all([
    prisma.guild.findMany({
      orderBy: [{ level: "desc" }, { xp: "desc" }],
      include: { _count: { select: { members: true } } },
    }),
    session?.user?.id
      ? prisma.guildMember.findUnique({
          where: { userId: session.user.id },
          include: { guild: { include: { _count: { select: { members: true } } } } },
        })
      : null,
  ]);

  const myGuild = myMembership
    ? { ...myMembership.guild, memberCount: myMembership.guild._count.members, myRole: myMembership.role }
    : null;

  return NextResponse.json({
    guilds: guilds.map((g) => ({ ...g, memberCount: g._count.members })),
    myGuild,
  });
}

const GUILD_CREATE_COST = 1000;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { name, description, bannerColor } = body as { name?: string; description?: string; bannerColor?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (name.trim().length > 30) return NextResponse.json({ error: "길드 이름은 30자 이내로 입력해주세요." }, { status: 400 });
  if (description && description.length > 200) return NextResponse.json({ error: "길드 설명은 200자 이내로 입력해주세요." }, { status: 400 });

  const [existing, user] = await Promise.all([
    prisma.guildMember.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { points: true } }),
  ]);

  if (existing) return NextResponse.json({ error: "이미 길드에 소속되어 있어요." }, { status: 409 });
  if (!user || user.points < GUILD_CREATE_COST)
    return NextResponse.json({ error: `길드 창설에는 ${GUILD_CREATE_COST.toLocaleString()} 포인트가 필요해요. (현재: ${user?.points ?? 0})` }, { status: 400 });

  const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const duplicateName = await prisma.guild.findFirst({ where: { OR: [{ name: name.trim() }, { slug }] } });
  if (duplicateName) return NextResponse.json({ error: "이미 존재하는 길드 이름이에요." }, { status: 409 });

  const [guild] = await prisma.$transaction([
    prisma.guild.create({
      data: {
        name: name.trim(),
        slug,
        description,
        bannerColor: bannerColor ?? "#0d1528",
        members: { create: { userId: session.user.id, role: "LEADER" } },
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { points: { decrement: GUILD_CREATE_COST } },
    }),
  ]);

  return NextResponse.json(guild, { status: 201 });
}
