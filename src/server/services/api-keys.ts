import { createHash, randomBytes } from "node:crypto";
import { API_KEY_PREFIX, API_KEY_PREFIX_DISPLAY_LENGTH } from "@/lib/constants";
import type { ApiKey } from "@/types/db";

export function hashApiKey(
  rawKey: string,
  pepper: string = process.env.API_KEY_PEPPER ?? "",
): string {
  return createHash("sha256").update(`${pepper}:${rawKey}`).digest("hex");
}

export interface GeneratedApiKey {
  raw: string;
  prefix: string;
  hash: string;
}

export function generateApiKey(pepper: string = process.env.API_KEY_PEPPER ?? ""): GeneratedApiKey {
  const raw = `${API_KEY_PREFIX}${randomBytes(16).toString("hex")}`;
  const prefix = raw.slice(
    API_KEY_PREFIX.length,
    API_KEY_PREFIX.length + API_KEY_PREFIX_DISPLAY_LENGTH,
  );
  return { raw, prefix, hash: hashApiKey(raw, pepper) };
}

export function isApiKeyUsable(
  key: Pick<ApiKey, "revoked_at" | "expires_at">,
  now: Date = new Date(),
): boolean {
  if (key.revoked_at) return false;
  if (key.expires_at && new Date(key.expires_at).getTime() <= now.getTime()) return false;
  return true;
}

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(nados_[A-Za-z0-9]{8,})$/.exec(authorizationHeader.trim());
  return match?.[1] ?? null;
}
