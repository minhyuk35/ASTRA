import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NOTE_COST = 30;
const MAX_CHARS = 150;

export async function GET() {
  const notes = await prisma.spaceNote.findMany({
    select: { id: true, content: true, posX: true, posY: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim())
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  if (content.trim().length > MAX_CHARS)
    return NextResponse.json({ error: `${MAX_CHARS}자 이하로 작성해주세요.` }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { points: true },
  });
  if (!user) return NextResponse.json({ error: "유저를 찾을 수 없어요." }, { status: 404 });
  if (user.points < NOTE_COST)
    return NextResponse.json({ error: `포인트가 부족해요. (필요: ${NOTE_COST}pts)` }, { status: 400 });

  const posX = 4 + Math.random() * 92;
  const posY = Math.floor(400 + Math.random() * 18000);

  const [note] = await prisma.$transaction([
    prisma.spaceNote.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        posX,
        posY,
      },
      select: { id: true, content: true, posX: true, posY: true, createdAt: true },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { points: { decrement: NOTE_COST } },
    }),
  ]);

  return NextResponse.json(note, { status: 201 });
}
