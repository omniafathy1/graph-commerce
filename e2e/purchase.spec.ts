import { test, expect , type Page } from "@playwright/test";
import { cleanup, createTestProduct, getStock, resetLocalSignupLimit } from "./db";
import { addToCart, checkout, signup, uniqueEmail , login} from "./helpers";

test.afterAll(async () => {
  await cleanup();
});

test("a customer can sign up, add to cart and check out", async ({ page }) => {
  const productId = await createTestProduct(null); // مخزون غير محدود
  await signup(page, uniqueEmail());

  await addToCart(page, productId);
  await page.goto("/cart");
  await expect(page.getByText("E2E Product")).toBeVisible();

  await page.getByRole("button", { name: "إتمام الطلب" }).click();
  await expect(page).toHaveURL(/order-confirmation/);
  await expect(page.getByRole('heading', { name: /تم الطلب بنجاح/ })).toBeVisible();
  // العربة بقت فاضية
  await page.goto("/cart");
  await expect(page.getByText("العربة فاضية")).toBeVisible();
});

test("checkout is rejected when stock is not enough", async ({ page }) => {
  const productId = await createTestProduct(1);
  await signup(page, uniqueEmail());
  await addToCart(page, productId, 2); // كمية 2 والمخزون 1

  const { status } = await checkout(page);
  expect(status).toBe(409);
  expect(await getStock(productId)).toBe(1); // ما اتخصمش
});

test("two buyers cannot oversell: stock never goes negative", async ({ browser }) => {
  const productId = await createTestProduct(3);

  // مستخدمين منفصلين = سياقين منفصلين (كوكيز منفصلة)
  const ctxA = await browser.newContext({ baseURL: "http://localhost:3000" });
  const ctxB = await browser.newContext({ baseURL: "http://localhost:3000" });
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  await signup(pageA, uniqueEmail());
  await signup(pageB, uniqueEmail());
  await addToCart(pageA, productId, 2);
  await addToCart(pageB, productId, 2);

  // الاتنين يضغطوا في نفس اللحظة
  const [a, b] = await Promise.all([checkout(pageA), checkout(pageB)]);

  const statuses = [a.status, b.status].sort();
  expect(statuses).toEqual([200, 409]); // واحد نجح والتاني اترفض
  expect(await getStock(productId)).toBe(1); // 3 - 2، ومش سالب

  await ctxA.close();
  await ctxB.close();
});

test("logging out revokes the session even if the token was copied", async ({ browser }) => {
  const baseURL = "http://localhost:3000";
  const ctx = await browser.newContext({ baseURL });
  const page = await ctx.newPage();
  await signup(page, uniqueEmail());

  const tokenCookie = (await ctx.cookies()).find((c) => c.name === "token");
  expect(tokenCookie).toBeTruthy();

  // checkout على عربة فاضية: 400 = مسجل دخول، 401 = لأ
  const probe = (request: { post: typeof page.request.post }) =>
    request.post("/api/checkout", {
      headers: { "Idempotency-Key": crypto.randomUUID() },
    });

  expect((await probe(page.request)).status()).toBe(400);

  await page.getByRole("button", { name: "خروج" }).click();
  await expect
    .poll(async () => (await ctx.cookies()).some((c) => c.name === "token"))
    .toBe(false);

  // حد نسخ التوكن قبل الخروج، وبيحاول يستخدمه بعد الخروج
  const stolen = await browser.newContext({ baseURL });
  await stolen.addCookies([tokenCookie!]);
  expect((await probe(stolen.request)).status()).toBe(401);

  await ctx.close();
  await stolen.close();
});

test("logging out of other devices ends only the other sessions", async ({ browser }) => {
  const baseURL = "http://localhost:3000";
  const email = uniqueEmail();

  const ctxA = await browser.newContext({ baseURL });
  const pageA = await ctxA.newPage();
  await signup(pageA, email);

  const ctxB = await browser.newContext({ baseURL });
  const pageB = await ctxB.newPage();
  await login(pageB, email);

  // checkout على عربة فاضية: 400 = مسجل دخول، 401 = لأ
  const probe = (page: Page) =>
    page.request.post("/api/checkout", {
      headers: { "Idempotency-Key": crypto.randomUUID() },
    });

  expect((await probe(pageA)).status()).toBe(400);
  expect((await probe(pageB)).status()).toBe(400);

  await pageA.goto("/account");
  await pageA.getByRole("button", { name: "تسجيل الخروج من الأجهزة الأخرى" }).click();
  await expect(pageA.getByText("الأجهزة المسجّلة (1)")).toBeVisible();

  await expect.poll(async () => (await probe(pageB)).status()).toBe(401);
  expect((await probe(pageA)).status()).toBe(400); // جهاز A لسه شغال

  await ctxA.close();
  await ctxB.close();
});

test.beforeEach(async () => {
  await resetLocalSignupLimit();
});