import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const CAT_COLORS: Record<string, number> = {
  NOTICE: 0xfbbf24,
  EVENT:  0x6ee7b7,
  UPDATE: 0x50a5ff,
};

const WEBHOOKS: Record<string, string> = {
  NOTICE: process.env.DISCORD_ANNOUNCEMENT_WEBHOOK ?? "",
  EVENT:  "https://discord.com/api/webhooks/1511265615673819218/Jo9OdBbSCOIGPcszmY1RIUfQ9fI3WTJDKn34N9xAEu9Lw6TvQbeQDYy_e_f2iL8bqXaL",
  UPDATE: "https://discord.com/api/webhooks/1511265837149982761/pn378CNDItPDiwXGZGtcSADYYsTSTvNMaJzD539hHZ9YCe5nhQQRWXLMq2Ig_VCpKxBg",
};

async function sendDiscordWebhook(ann: {
  id: string; category: string; title: string; summary: string;
  authorName: string; createdAt: Date;
}) {
  const url = WEBHOOKS[ann.category];
  if (!url) return;

  const siteUrl = "https://www.sign-company.co.kr";
  const color = CAT_COLORS[ann.category] ?? 0x50a5ff;

  const isEvent = ann.category === "EVENT";

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(isEvent && {
        content: "|| @everyone ||",
        allowed_mentions: { parse: ["everyone"] },
      }),
      embeds: [{
        color,
        title: ann.title,
        description: ann.summary,
        url: `${siteUrl}/announcements/${ann.id}`,
        footer: { text: ann.authorName },
        timestamp: ann.createdAt.toISOString(),
        fields: [{ name: "카테고리", value: ann.category, inline: true }],
      }],
    }),
  }).catch(() => {});
}

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, summary, content, category, pinned, authorName, startsAt, endsAt } = await req.json();
  if (!title || !summary || !content)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const ann = await prisma.announcement.create({
    data: {
      title, summary, content,
      category: category ?? "NOTICE",
      pinned: pinned ?? false,
      authorName: authorName ?? "ASTRA 운영팀",
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt:   endsAt   ? new Date(endsAt)   : null,
    },
  });

  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length > 0) {
    await prisma.message.createMany({
      data: users.map((user) => ({
        type: "ANNOUNCEMENT",
        title: ann.title,
        preview: ann.summary,
        recipientId: user.id,
        announcementId: ann.id,
      })),
    });
  }

  await sendDiscordWebhook(ann);

  return NextResponse.json(ann, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, summary, content, category, pinned, authorName, startsAt, endsAt } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const ann = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title      !== undefined && { title }),
        ...(summary    !== undefined && { summary }),
        ...(content    !== undefined && { content }),
        ...(category   !== undefined && { category }),
        ...(typeof pinned === "boolean" && { pinned }),
        ...(authorName !== undefined && { authorName }),
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt:   endsAt   ? new Date(endsAt)   : null,
      },
    });
    return NextResponse.json(ann);
  } catch (err) {
    console.error("PATCH announcement error:", err);
    return NextResponse.json({ error: "수정 중 오류가 발생했어요." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
