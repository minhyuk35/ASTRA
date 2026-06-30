import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const comments = await prisma.annComment.findMany({
    where: { announcementId: id },
    orderBy: { createdAt: "asc" },
    include: {
      replies: {
        orderBy: { createdAt: "asc" },
        select: { id: true, label: true, content: true, createdAt: true },
      },
    },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { content, authorNick } = body as { content?: string; authorNick?: string };

  if (!content?.trim() || !authorNick?.trim())
    return NextResponse.json({ error: "내용과 닉네임을 입력해주세요." }, { status: 400 });
  if (content.trim().length > 500)
    return NextResponse.json({ error: "댓글은 500자 이내로 작성해주세요." }, { status: 400 });
  if (authorNick.trim().length > 30)
    return NextResponse.json({ error: "닉네임은 30자 이내로 입력해주세요." }, { status: 400 });

  const ann = await prisma.announcement.findUnique({
    where: { id },
    select: { id: true, category: true, title: true },
  });
  if (!ann) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.annComment.create({
    data: {
      announcementId: id,
      content: content.trim(),
      authorNick: authorNick.trim(),
    },
    include: { replies: true },
  });

  // notify managers of this category in background
  prisma.user.findMany({
    where: { role: "MANAGER", managerScope: ann.category },
    select: { id: true },
  }).then((managers) => {
    if (managers.length === 0) return;
    return prisma.message.createMany({
      data: managers.map((m) => ({
        type: "SYSTEM" as const,
        title: `새 댓글 — ${ann.title}`,
        preview: `${authorNick.trim()}: ${content.trim().slice(0, 60)}`,
        recipientId: m.id,
      })),
    });
  }).catch(() => {});

  return NextResponse.json(comment, { status: 201 });
}
