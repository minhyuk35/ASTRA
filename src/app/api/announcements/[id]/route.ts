import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ann = await prisma.announcement.findUnique({ where: { id } });
  if (!ann) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ann);
}
