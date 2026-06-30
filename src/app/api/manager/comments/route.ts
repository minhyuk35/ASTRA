import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, managerScope: true },
  });

  if (!user || user.role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!user.managerScope)
    return NextResponse.json({ error: "담당 섹션이 지정되지 않았어요." }, { status: 403 });

  const announcements = await prisma.announcement.findMany({
    where: { category: user.managerScope },
    select: {
      id: true, title: true, category: true, createdAt: true,
      annComments: {
        orderBy: { createdAt: "asc" },
        include: {
          replies: {
            orderBy: { createdAt: "asc" },
            select: { id: true, label: true, content: true, createdAt: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ scope: user.managerScope, announcements });
}
