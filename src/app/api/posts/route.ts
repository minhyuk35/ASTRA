import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
type PostCategory = "FREE" | "QUESTION" | "NOTICE" | "REVIEW";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId   = searchParams.get("userId");
  const category = searchParams.get("category");
  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "15", 10)));
  const skip     = (page - 1) * limit;

  const where: { authorId?: string; category?: PostCategory } = {};
  if (userId)                          where.authorId = userId;
  if (category && category !== "ALL") where.category  = category as PostCategory;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id:        true,
        category:  true,
        title:     true,
        content:   true,
        createdAt: true,
        author:    { select: { id: true, nickname: true, handle: true } },
        _count:    { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { title, content, category } = body as { title?: string; content?: string; category?: string };

  if (!title?.trim() || !content?.trim())
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });

  if (title.trim().length > 100)
    return NextResponse.json({ error: "제목은 100자 이내로 입력해주세요." }, { status: 400 });

  if (content.trim().length > 10000)
    return NextResponse.json({ error: "내용은 10,000자 이내로 입력해주세요." }, { status: 400 });

  if (!["FREE", "QUESTION", "REVIEW"].includes(category ?? ""))
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });

  const validCategory = category as "FREE" | "QUESTION" | "REVIEW";

  const [post] = await prisma.$transaction([
    prisma.post.create({
      data: { title: title.trim(), content: content.trim(), category: validCategory, authorId: session.user.id },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { points: { increment: 5 } },
    }),
  ]);

  return NextResponse.json(post, { status: 201 });
}
