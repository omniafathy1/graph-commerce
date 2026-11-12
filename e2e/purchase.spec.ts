import { test, expect } from "@playwright/test";
import { cleanup, createTestProduct, getStock } from "./db";
import { addToCart, checkout, signup, uniqueEmail } from "./helpers";

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