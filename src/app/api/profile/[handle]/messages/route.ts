import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MESSAGE_COST = 10;
const MAX_CHARS    = 200;

export async function GET(
  _req: NextRequest,
  { params }: { params: { handle: string } },
) {
  const target = await prisma.user.findUnique({
    where: { handle: params.handle },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.profileMessage.findMany({
    where: { targetUserId: target.id },
    select: {
      id: true, content: true, createdAt: true,
      author: { select: { nickname: true, handle: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { handle: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim())
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  if (content.trim().length > MAX_CHARS)
    return NextResponse.json({ error: `${MAX_CHARS}자 이하로 작성해주세요.` }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { handle: params.handle },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "유저를 찾을 수 없어요." }, { status: 404 });
  if (target.id === session.user.id)
    return NextResponse.json({ error: "자신의 프로필에는 방명록을 남길 수 없어요." }, { status: 400 });

  const author = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { points: true, nickname: true, name: true },
  });
  if (!author || author.points < MESSAGE_COST)
    return NextResponse.json({ error: `포인트가 부족해요. (필요: ${MESSAGE_COST}pts)` }, { status: 400 });

  const authorDisplay = author.nickname ?? author.name ?? "누군가";
  const trimmed = content.trim();

  const [message] = await prisma.$transaction([
    prisma.profileMessage.create({
      data: {
        content:      trimmed,
        authorId:     session.user.id,
        targetUserId: target.id,
      },
      select: {
        id: true, content: true, createdAt: true,
        author: { select: { nickname: true, handle: true, image: true } },
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { points: { decrement: MESSAGE_COST } },
    }),
    prisma.user.update({
      where: { id: target.id },
      data: { points: { increment: MESSAGE_COST } },
    }),
    prisma.message.create({
      data: {
        type:        "SYSTEM",
        title:       "새 방명록",
        preview:     `${authorDisplay}: ${trimmed.slice(0, 60)}${trimmed.length > 60 ? "…" : ""}`,
        recipientId: target.id,
        senderId:    session.user.id,
      },
    }),
  ]);

  return NextResponse.json(message, { status: 201 });
}
