import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const MIN_SEPARATION = 55;

function generateAngle(existing: number[]): number {
  for (let attempt = 0; attempt < 80; attempt++) {
    const candidate = Math.random() * 360;
    const ok = existing.every((a) => {
      const diff = Math.abs(candidate - a) % 360;
      return Math.min(diff, 360 - diff) >= MIN_SEPARATION;
    });
    if (ok) return candidate;
  }
  let bestAngle = 0, bestDist = -1;
  for (let a = 0; a < 360; a += 5) {
    const minDist = existing.length === 0
      ? 360
      : Math.min(...existing.map((e) => { const d = Math.abs(a - e) % 360; return Math.min(d, 360 - d); }));
    if (minDist > bestDist) { bestDist = minDist; bestAngle = a; }
  }
  return bestAngle;
}

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const nodes = await prisma.planetNode.findMany({ orderBy: [{ planetId: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json(nodes);
}

export async function POST(req: Request) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { planetId, title, role, year, stack, desc, url } = body;
  if (!planetId || !title || !role || !year || !stack || !desc) {
    return NextResponse.json({ error: "필드를 모두 입력해주세요." }, { status: 400 });
  }
  const existing = await prisma.planetNode.findMany({ where: { planetId: Number(planetId) }, select: { angle: true } });
  const angle = generateAngle(existing.map((n) => n.angle));
  const node = await prisma.planetNode.create({
    data: { planetId: Number(planetId), title, role, year, stack, desc, url: url || null, angle },
  });
  return NextResponse.json(node, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.planetNode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
