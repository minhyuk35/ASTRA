import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const userId  = session?.user?.id ?? null;

  // run post fetch and like check in parallel
  const [post, likeRecord] = await Promise.all([
    prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author:   { select: { id: true, nickname: true, handle: true, role: true } },
        _count:   { select: { likes: true, comments: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          where:   { parentId: null },
          include: {
            author:  { select: { id: true, nickname: true, handle: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: { author: { select: { id: true, nickname: true, handle: true } } },
            },
          },
        },
      },
    }),
    userId
      ? prisma.postLike.findUnique({
          where: { userId_postId: { userId, postId: params.id } },
          select: { userId: true },
        })
      : Promise.resolve(null),
  ]);

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...post, liked: !!likeRecord });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.authorId !== session.user.id && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
