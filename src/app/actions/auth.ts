"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies ,headers} from "next/headers";
import { redirect } from "next/navigation";
import { runQuery } from "../../lib/db";
import { checkLimit, recordFailure, clearFailures } from "../../lib/rateLimit";

export type AuthState = { error?: string } | undefined;

async function setSessionCookie(customerId: string, email: string) {
  const token = jwt.sign({ customerId, email }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function signupAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 6) {
    return { error: "كل الحقول مطلوبة، والباسورد 6 حروف على الأقل" };
  }

  let customerId: string;
  try {
    const existing = await runQuery(
      `MATCH (c:Customer {email: $email}) RETURN c`,
      { email }
    );
    if (existing.length > 0) {
      return { error: "الإيميل ده مسجل بالفعل" };
    }

    const hashed = await bcrypt.hash(password, 10);
    const records = await runQuery(
      `CREATE (c:Customer {name: $name, email: $email, password: $password})
       RETURN elementId(c) AS id`,
      { name, email, password: hashed }
    );
    customerId = records[0].get("id");
  } catch {
    return { error: "حصل خطأ، حاول تاني" };
  }

  await setSessionCookie(customerId, email);
  redirect("/");
}

const MAX_BY_EMAIL = 5;
const MAX_BY_IP = 20;

export async function loginAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "الإيميل والباسورد مطلوبين" };
  }

  // المفاتيح: الإيميل بحروف صغيرة عشان محدش يتحايل بتغيير الحالة
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const emailKey = `login:email:${email.toLowerCase()}`;
  const ipKey = `login:ip:${ip}`;

  // 1) هل محظور؟ (fail-open: لو الـ limiter نفسه وقع، منمنعش الـ login)
  try {
    const [byEmail, byIp] = await Promise.all([
      checkLimit(emailKey, MAX_BY_EMAIL),
      checkLimit(ipKey, MAX_BY_IP),
    ]);

    if (!byEmail.allowed || !byIp.allowed) {
      const wait = Math.max(byEmail.retryAfterSec, byIp.retryAfterSec);
      return { error: `محاولات كتير. حاول بعد ${Math.ceil(wait / 60)} دقيقة.` };
    }
  } catch (error) {
    console.error("Rate limit check failed:", error);
  }

  // 2) التحقق من الباسورد
  let customerId: string;
  try {
    const records = await runQuery(
      `MATCH (c:Customer {email: $email})
       RETURN elementId(c) AS id, c.password AS password`,
      { email }
    );

    const hashed = records[0]?.get("password");
    const valid = hashed ? await bcrypt.compare(password, hashed) : false;

    if (!valid) {
      // بنسجّل الفشل لأي إيميل، موجود أو لأ (عشان منكشفش مين مسجل)
      try {
        await Promise.all([recordFailure(emailKey), recordFailure(ipKey)]);
      } catch (error) {
        console.error("Recording login failure failed:", error);
      }
      return { error: "الإيميل أو الباسورد غلط" };
    }
    customerId = records[0].get("id");
  } catch {
    return { error: "حصل خطأ، حاول تاني" };
  }

  // 3) نجح: امسح عدّاد الإيميل (مش بتاع الـ IP)
  try {
    await clearFailures(emailKey);
  } catch (error) {
    console.error("Clearing login failures failed:", error);
  }

  await setSessionCookie(customerId, email);
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/");
}