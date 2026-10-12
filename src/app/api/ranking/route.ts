import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, nickname: true, handle: true, image: true, points: true, role: true },
    orderBy: { points: "desc" },
    take: 5,
  });
  return NextResponse.json(users);
}
