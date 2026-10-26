"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { runQuery } from "../../lib/db";

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

export async function loginAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "الإيميل والباسورد مطلوبين" };
  }

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
      return { error: "الإيميل أو الباسورد غلط" };
    }
    customerId = records[0].get("id");
  } catch {
    return { error: "حصل خطأ، حاول تاني" };
  }

  await setSessionCookie(customerId, email);
  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/");
}