import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ตรวจสอบและนับจำนวนคำขอต่อคีย์แบบ atomic บน Supabase (ใช้แทน in-memory Map)
 */
export async function checkRateLimit(
  key: string,
  limit = 5,
  windowSeconds = 15 * 60
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[rate-limit] rpc error:", error.message);
    return { allowed: false, retryAfterSeconds: windowSeconds };
  }

  const allowed = Boolean(data);
  return {
    allowed,
    retryAfterSeconds: allowed ? 0 : windowSeconds,
  };
}
