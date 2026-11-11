import { runQuery } from "./db";
import { toNum } from "./toNum";

export const WINDOW_MS = 15 * 60 * 1000;

/** الانتظار المتبقي بالثواني (دالة نقية، متختبرة) */
export function retryAfterSeconds(
  windowStart: number,
  now: number,
  windowMs: number = WINDOW_MS
): number {
  return Math.max(0, Math.ceil((windowStart + windowMs - now) / 1000));
}

export type LimitResult = { allowed: boolean; retryAfterSec: number };

/** هل المفتاح تجاوز الحد؟ (قراءة بس، مش بتزوّد) */
export async function checkLimit(key: string, max: number): Promise<LimitResult> {
  const now = Date.now();
  const records = await runQuery(
    `MATCH (a:LoginAttempt {key: $key})
     WHERE a.windowStart > $cutoff
     RETURN a.count AS count, a.windowStart AS windowStart`,
    { key, cutoff: now - WINDOW_MS }
  );

  if (records.length === 0) return { allowed: true, retryAfterSec: 0 };

  const count = toNum(records[0].get("count"));
  const windowStart = toNum(records[0].get("windowStart"));
  if (count < max) return { allowed: true, retryAfterSec: 0 };

  return { allowed: false, retryAfterSec: retryAfterSeconds(windowStart, now) };
}

/** سجّل محاولة فاشلة: نافذة جديدة أو زيادة الحالية (atomic) */
export async function recordFailure(key: string): Promise<void> {
  const now = Date.now();
  await runQuery(
    `MERGE (a:LoginAttempt {key: $key})
     ON CREATE SET a.count = 1, a.windowStart = $now
     ON MATCH SET
       a.count = CASE WHEN a.windowStart > $cutoff THEN a.count + 1 ELSE 1 END,
       a.windowStart = CASE WHEN a.windowStart > $cutoff THEN a.windowStart ELSE $now END`,
    { key, now, cutoff: now - WINDOW_MS }
  );
}

/** امسح العدّاد بعد نجاح الدخول */
export async function clearFailures(key: string): Promise<void> {
  await runQuery(`MATCH (a:LoginAttempt {key: $key}) DETACH DELETE a`, { key });
}