import { cache } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import jwt from "jsonwebtoken";
import { runQuery } from "../lib/db";

type UserPayload = {
  customerId: string;
  email: string;
};

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
  } catch {
    return null;
  }
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

// للصفحات: لو مش أدمن نعرض 404 (منكشفش إن /admin موجود أصلاً)
export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) notFound();
  return admin;
}