import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const role = searchParams.get("role") ?? "";

  const users = await prisma.user.findMany({
    where: {
      ...(q && {
        OR: [
          { nickname: { contains: q, mode: "insensitive" } },
          { handle:   { contains: q, mode: "insensitive" } },
          { email:    { contains: q, mode: "insensitive" } },
          { name:     { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(role && { role: role as "ADMIN" | "MANAGER" | "USER" }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      nickname: true,
      handle: true,
      role: true,
      points: true,
      createdAt: true,
      image: true,
      guild: { select: { guild: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, role, managerScope, points, nickname, handle, bio } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  if (nickname) {
    const existing = await prisma.user.findFirst({ where: { nickname, NOT: { id } } });
    if (existing) return NextResponse.json({ error: "이미 사용 중인 닉네임이에요." }, { status: 400 });
  }
  if (handle) {
    const existing = await prisma.user.findFirst({ where: { handle, NOT: { id } } });
    if (existing) return NextResponse.json({ error: "이미 사용 중인 핸들이에요." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(role         !== undefined && { role }),
      ...(managerScope !== undefined && { managerScope: managerScope || null }),
      ...(points       !== undefined && { points: Number(points) }),
      ...(nickname     !== undefined && { nickname: nickname || null }),
      ...(handle       !== undefined && { handle:   handle   || null }),
      ...(bio          !== undefined && { bio:      bio      || null }),
    },
    select: {
      id: true, name: true, email: true, nickname: true,
      handle: true, role: true, managerScope: true, points: true, createdAt: true, image: true,
    },
  });

  return NextResponse.json(updated);
}
