import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ unread: 0 });

  const unread = await prisma.message.count({
    where: { recipientId: session.user.id, read: false },
  });

  return NextResponse.json({ unread });
}
