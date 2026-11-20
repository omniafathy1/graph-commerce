import { cache } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import jwt from "jsonwebtoken";
import { runQuery } from "../lib/db";
import { logger } from "./logger";
import { toNum } from "./toNum";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type TokenPayload = { customerId: string; email: string; sid: string };
export type UserPayload = { customerId: string; email: string };

/** بيتحقق من التوقيع بس (من غير داتابيز). مفيش جلسة هنا. */
export async function readToken(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as Partial<TokenPayload>;
    // توكنز قديمة من غير sid = غير صالحة
    if (!payload.customerId || !payload.email || !payload.sid) return null;
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/** المستخدم الحالي: التوقيع سليم والجلسة لسه موجودة في الداتابيز */
export const getCurrentUser = cache(async (): Promise<UserPayload | null> => {
  const token = await readToken(); // لازم cookies() تتنادى قبل Date.now()

  if (!token) return null;

  try {
    const records = await runQuery(
      `MATCH (c:Customer)-[:HAS_SESSION]->(s:Session {id: $sid})
       WHERE elementId(c) = $customerId AND s.expiresAt > $now
       RETURN s.id AS id`,
      { sid: token.sid, customerId: token.customerId, now: Date.now() }
    );
    if (records.length === 0) return null;
    return { customerId: token.customerId, email: token.email };
  } catch (error) {
    // fail-closed: لو منقدرش نتأكد، مش مسجل دخول
    logger.error({ err: error }, "session lookup failed");
    return null;
  }
});

export async function createSession(customerId: string ,userAgent: string = ""): Promise<string> {
  const sid = crypto.randomUUID();
  const now = Date.now();

  // تنضيف الجلسات المنتهية لنفس العميل (من غير cron)
  await runQuery(
    `MATCH (c:Customer)-[:HAS_SESSION]->(s:Session)
     WHERE elementId(c) = $customerId AND s.expiresAt < $now
     DETACH DELETE s`,
    { customerId, now }
  );

  const records = await runQuery(
    `MATCH (c:Customer) WHERE elementId(c) = $customerId
     CREATE (s:Session {id: $sid, createdAt: $now, expiresAt: $expiresAt ,userAgent: $userAgent})
     CREATE (c)-[:HAS_SESSION]->(s)
     RETURN s.id AS id`,
    { customerId, sid, now, expiresAt: now + SESSION_TTL_MS, userAgent: userAgent.slice(0, 200) }
  );
  if (records.length === 0) throw new Error("Customer not found");

  return sid;
}

export async function revokeSession(sid: string): Promise<void> {
  await runQuery(`MATCH (s:Session {id: $sid}) DETACH DELETE s`, { sid });
}

export async function revokeAllSessions(customerId: string): Promise<void> {
  await runQuery(
    `MATCH (c:Customer)-[:HAS_SESSION]->(s:Session)
     WHERE elementId(c) = $customerId
     DETACH DELETE s`,
    { customerId }
  );
}

// cache = لو اتنادت أكتر من مرة في نفس الطلب (layout + page)، الكويري تتنفذ مرة واحدة
export const getAdminUser = cache(async (): Promise<UserPayload | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const records = await runQuery(
    `MATCH (c:Customer) WHERE elementId(c) = $id RETURN c.role AS role`,
    { id: user.customerId }
  );

  return records[0]?.get("role") === "admin" ? user : null;
});

export type SessionInfo = {
  id: string;
  createdAt: number;
  expiresAt: number;
  userAgent: string;
};

export async function listSessions(customerId: string): Promise<SessionInfo[]> {
  const records = await runQuery(
    `MATCH (c:Customer)-[:HAS_SESSION]->(s:Session)
     WHERE elementId(c) = $customerId AND s.expiresAt > $now
     RETURN s.id AS id, s.createdAt AS createdAt,
            s.expiresAt AS expiresAt, s.userAgent AS userAgent
     ORDER BY s.createdAt DESC`,
    { customerId, now: Date.now() }
  );

  return records.map((r) => ({
    id: r.get("id") as string,
    createdAt: toNum(r.get("createdAt")),
    expiresAt: toNum(r.get("expiresAt")),
    userAgent: (r.get("userAgent") ?? "") as string,
  }));
}

/** بيلغي جلسة بس لو بتاعت العميل ده (حماية من IDOR) */
export async function revokeSessionForCustomer(
  customerId: string,
  sid: string
): Promise<void> {
  await runQuery(
    `MATCH (c:Customer)-[:HAS_SESSION]->(s:Session {id: $sid})
     WHERE elementId(c) = $customerId
     DETACH DELETE s`,
    { customerId, sid }
  );
}

export async function revokeOtherSessions(
  customerId: string,
  keepSid: string
): Promise<void> {
  await runQuery(
    `MATCH (c:Customer)-[:HAS_SESSION]->(s:Session)
     WHERE elementId(c) = $customerId AND s.id <> $keepSid
     DETACH DELETE s`,
    { customerId, keepSid }
  );
}

// للصفحات: لو مش أدمن نعرض 404 (منكشفش إن /admin موجود أصلاً)
export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) notFound();
  return admin;
}