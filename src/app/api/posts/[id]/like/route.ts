import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const postId = params.id;

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId, postId } },
    select: { userId: true },
  });

  let liked: boolean;
  if (existing) {
    await prisma.postLike.delete({ where: { userId_postId: { userId, postId } } });
    liked = false;
  } else {
    await prisma.postLike.create({ data: { userId, postId } });
    liked = true;
  }

  // count after the write for accuracy
  const count = await prisma.postLike.count({ where: { postId } });
  return NextResponse.json({ liked, count });
}
