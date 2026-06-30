import { createHmac } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "astra_admin";

export function getAdminToken(): string {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "fallback_secret")
    .update("astra:1928:admin_authorized")
    .digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return token === getAdminToken();
}
