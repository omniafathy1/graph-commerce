"use server";

import { redirect } from "next/navigation";
import {
  getCurrentUser,
  readToken,
  revokeOtherSessions,
  revokeSessionForCustomer,
} from "../../lib/auth";
import { connection } from "next/server";
import { revalidatePath } from "next/cache";

export async function revokeSessionAction(formData: FormData): Promise<void> {
  await connection();
  const user = await getCurrentUser();
  const token = await readToken();
  if (!user || !token) redirect("/login");

  const sid = String(formData.get("sessionId") ?? "");
  // الجلسة الحالية بتتقفل بالـ logout مش من هنا
  if (!sid || sid === token.sid) return;

  await revokeSessionForCustomer(user.customerId, sid);
  revalidatePath("/account");
}

export async function logoutOthersAction(): Promise<void> {
  await connection();
  const user = await getCurrentUser();
  const token = await readToken();
  if (!user || !token) redirect("/login");

  await revokeOtherSessions(user.customerId, token.sid);
  revalidatePath("/account");
}