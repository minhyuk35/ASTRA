import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: announcementId, commentId } = await params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { content } = body as { content?: string };

  if (!content?.trim())
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  if (content.trim().length > 500)
    return NextResponse.json({ error: "답변은 500자 이내로 작성해주세요." }, { status: 400 });

  // fetch announcement and comment in parallel
  const [ann, comment] = await Promise.all([
    prisma.announcement.findUnique({ where: { id: announcementId }, select: { category: true } }),
    prisma.annComment.findUnique({ where: { id: commentId }, select: { id: true } }),
  ]);

  if (!ann) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  // cookie admin (ASTRA) — can reply to any category
  const isCookieAdmin = await isAdminAuthenticated();
  if (isCookieAdmin) {
    const reply = await prisma.annCommentReply.create({
      data: { commentId, adminId: null, label: "ASTRA 관리자", content: content.trim() },
    });
    return NextResponse.json(reply, { status: 201 });
  }

  // NextAuth manager — must have matching managerScope
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, managerScope: true, nickname: true, name: true },
  });

  if (!user || user.role !== "MANAGER")
    return NextResponse.json({ error: "관리자만 답변할 수 있어요." }, { status: 403 });

  if (user.managerScope !== ann.category)
    return NextResponse.json({ error: "담당 섹션에만 답변할 수 있어요." }, { status: 403 });

  const displayName = user.nickname ?? user.name ?? "관리자";
  const reply = await prisma.annCommentReply.create({
    data: {
      commentId,
      adminId: session.user.id,
      label: `${displayName} 관리자`,
      content: content.trim(),
    },
  });
  return NextResponse.json(reply, { status: 201 });
}
