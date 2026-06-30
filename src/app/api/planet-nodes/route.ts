import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const nodes = await prisma.planetNode.findMany({
    orderBy: [{ planetId: "asc" }, { createdAt: "asc" }],
    select: { id: true, planetId: true, title: true, role: true, year: true, stack: true, desc: true, url: true, angle: true },
  });
  return NextResponse.json(nodes);
}
