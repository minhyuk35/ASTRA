import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:           string;
      role:         string;
      nickname:     string | null;
      handle:       string | null;
      managerScope: string | null;
    } & DefaultSession["user"];
  }
}
