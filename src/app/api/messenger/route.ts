import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: { recipientId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { nickname: true, name: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.message.updateMany({
    where: { recipientId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.message.deleteMany({
    where: { recipientId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
