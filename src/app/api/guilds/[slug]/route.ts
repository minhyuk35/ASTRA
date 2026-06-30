import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  const [guild, myMembership] = await Promise.all([
    prisma.guild.findUnique({
      where: { slug },
      include: {
        members: {
          include: { user: { select: { id: true, nickname: true, handle: true, name: true, image: true, points: true } } },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
        _count: { select: { members: true } },
      },
    }),
    session?.user?.id
      ? prisma.guildMember.findUnique({ where: { userId: session.user.id } })
      : null,
  ]);

  if (!guild) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const myRoleInThisGuild = guild.members.find((m) => m.user.id === session?.user?.id)?.role ?? null;

  return NextResponse.json({
    ...guild,
    memberCount: guild._count.members,
    userRole: myRoleInThisGuild,
    userInAnyGuild: myMembership !== null,
  });
}
