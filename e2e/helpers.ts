import { expect, type Page } from "@playwright/test";

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.local`;
}

export async function signup(page: Page, email: string) {
  await page.goto("/signup");
  await page.getByPlaceholder("الاسم").fill("E2E User");
  await page.getByPlaceholder("الإيميل").fill(email);
  await page.getByPlaceholder("الباسورد (6 حروف على الأقل)").fill("123456");
  await page.getByRole("button", { name: "إنشاء حساب" }).click();
  await expect(page).toHaveURL("/");
}

/** يضيف منتج للعربة عن طريق الـ API (أسرع من الواجهة) */
export async function addToCart(page: Page, productId: string, times = 1) {
  for (let i = 0; i < times; i++) {
    const res = await page.request.post("/api/cart/add", {
      data: { productId },
    });
    expect(res.ok()).toBeTruthy();
  }
}

/** يعمل checkout ويرجّع الـ status والرد */
export async function checkout(page: Page) {
  const res = await page.request.post("/api/checkout", {
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  return { status: res.status(), body: await res.json() };
}