import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const cat = req.nextUrl.searchParams.get("category");

  const announcements = await prisma.announcement.findMany({
    where: cat && cat !== "ALL" ? { category: cat as "NOTICE" | "EVENT" | "UPDATE" } : undefined,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, category: true, title: true, summary: true,
      pinned: true, createdAt: true,
    },
  });

  return NextResponse.json(announcements, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
