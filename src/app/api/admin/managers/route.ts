import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const managers = await prisma.user.findMany({
    where: { role: "MANAGER" },
    select: {
      id: true, nickname: true, handle: true, name: true,
      email: true, image: true, managerScope: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(managers);
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, managerScope } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const validScopes = ["NOTICE", "EVENT", "UPDATE", null];
  if (!validScopes.includes(managerScope))
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id },
    data: {
      role: "MANAGER",
      managerScope: managerScope ?? null,
    },
    select: { id: true, nickname: true, handle: true, name: true, email: true, managerScope: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id },
    data: { role: "USER", managerScope: null },
    select: { id: true },
  });

  return NextResponse.json(user);
}
