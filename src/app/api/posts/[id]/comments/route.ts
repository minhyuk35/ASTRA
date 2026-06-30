import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { content, parentId } = body as { content?: string; parentId?: string };
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });
  if (content.trim().length > 1000)
    return NextResponse.json({ error: "댓글은 1,000자 이내로 작성해주세요." }, { status: 400 });

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        content:  content.trim(),
        postId:   params.id,
        authorId: session.user.id,
        parentId: parentId ?? null,
      },
      include: {
        author:  { select: { id: true, nickname: true, handle: true } },
        replies: { include: { author: { select: { id: true, nickname: true, handle: true } } } },
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 2 } },
    }),
  ]);

  return NextResponse.json(comment, { status: 201 });
}
