import {
  CONTACT_RATE_LIMIT_MAX_REQUESTS,
  CONTACT_RATE_LIMIT_WINDOW_SECONDS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/constants";
import { getAdminSupabase } from "@/server/supabase/admin";

export async function consumeRateLimit(
  bucketKey: string,
  windowSeconds: number,
  max: number,
): Promise<boolean> {
  const { data, error } = await getAdminSupabase().rpc("check_rate_limit", {
    p_bucket: bucketKey,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) return true;
  return data === true;
}

export async function consumeChatRateLimit(userId: string): Promise<boolean> {
  return consumeRateLimit(`chat:${userId}`, RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_MAX_REQUESTS);
}

export async function consumeContactRateLimit(ipHash: string): Promise<boolean> {
  return consumeRateLimit(
    `contact:${ipHash}`,
    CONTACT_RATE_LIMIT_WINDOW_SECONDS,
    CONTACT_RATE_LIMIT_MAX_REQUESTS,
  );
}
