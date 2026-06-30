import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const msg = await prisma.message.findFirst({
    where: { id, recipientId: session.user.id },
  });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.message.update({ where: { id }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
