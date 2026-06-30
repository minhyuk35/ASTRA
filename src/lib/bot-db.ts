import { Pool } from "pg";

const GUILD_ID = "1232514888841166859";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DISCORD_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function getDiscordPoints(discordUserId: string): Promise<number> {
  try {
    const client = await getPool().connect();
    try {
      const res = await client.query(
        "SELECT points FROM points WHERE guild_id = $1 AND user_id = $2",
        [GUILD_ID, discordUserId],
      );
      return parseInt(res.rows[0]?.points ?? "0", 10);
    } finally {
      client.release();
    }
  } catch {
    return 0;
  }
}

export async function deductDiscordPoints(discordUserId: string, amount: number): Promise<boolean> {
  try {
    const client = await getPool().connect();
    try {
      const res = await client.query(
        "UPDATE points SET points = points - $1 WHERE guild_id = $2 AND user_id = $3 AND points >= $1 RETURNING points",
        [amount, GUILD_ID, discordUserId],
      );
      return res.rowCount === 1;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
}

// ─── 디스코드 역할 상점 (봇 guild_point_shop_items 공유) ──────────────────────
// 봇은 price를 디코 포인트로 저장. 사이트는 환전율 100:1 로 ÷100 하여 사이트 포인트로 판매.
export type DiscordRoleItem = {
  itemOrder: number;
  name: string;
  roleId: string;
  sitePrice: number;   // 사이트 포인트 가격
  description: string;
};

export async function getDiscordRoleShop(): Promise<DiscordRoleItem[]> {
  try {
    const client = await getPool().connect();
    try {
      const res = await client.query(
        "SELECT item_order, item_name, role_id, price, description FROM guild_point_shop_items WHERE guild_id = $1 ORDER BY item_order ASC",
        [GUILD_ID],
      );
      return res.rows
        .map((r) => ({
          itemOrder: Number(r.item_order),
          name: String(r.item_name ?? ""),
          roleId: String(r.role_id ?? ""),
          sitePrice: Math.ceil(Number(r.price ?? 0) / 100),
          description: String(r.description ?? ""),
        }))
        .filter((it) => it.roleId);
    } finally {
      client.release();
    }
  } catch {
    return [];
  }
}

// 보유(done)/대기(pending) 역할 id 목록
export async function getRoleStatuses(discordUserId: string): Promise<{ owned: string[]; pending: string[] }> {
  try {
    const client = await getPool().connect();
    try {
      const res = await client.query(
        "SELECT role_id, status FROM shop_role_grants WHERE discord_user_id = $1 AND status IN ('done','pending')",
        [discordUserId],
      );
      const owned: string[] = [];
      const pending: string[] = [];
      for (const r of res.rows) {
        if (r.status === "done") owned.push(String(r.role_id));
        else pending.push(String(r.role_id));
      }
      return { owned, pending };
    } finally {
      client.release();
    }
  } catch {
    return { owned: [], pending: [] };
  }
}

// 사이트 구매 → 봇 지급 큐에 적재. refundPoints = 사이트 포인트(실패 시 환불액).
export async function queueRoleGrant(args: {
  discordUserId: string;
  roleId: string;
  siteUserId: string;
  refundPoints: number;
}): Promise<boolean> {
  const grantId = `site_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    const client = await getPool().connect();
    try {
      await client.query(
        "INSERT INTO shop_role_grants (grant_id, guild_id, discord_user_id, role_id, site_user_id, refund_points, status, created_at) " +
          "VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)",
        [grantId, GUILD_ID, args.discordUserId, args.roleId, args.siteUserId, args.refundPoints, new Date().toISOString()],
      );
      return true;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
}
