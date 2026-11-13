"use server";

import { redirect } from "next/navigation";
import { runQuery } from "../../lib/db";
import { getAdminUser } from "../../lib/auth";
import { updateTag } from "next/cache";
import { parseProductForm } from "../../lib/productForm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProductFormState =
  | { error?: string; values?: Record<string, string> }
  | undefined;

export async function createProductAction(
  prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  if (!(await getAdminUser())) return { error: "غير مسموح" };

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return { error: parsed.error, values: parsed.values };
  const { name, description, category, price } = parsed.data;

  const key = String(formData.get("idempotencyKey") ?? "");
  if (!UUID_RE.test(key)) {
    return { error: "طلب غير صالح", values: formData2values(parsed.data) };
  }

  try {
    const records = await runQuery(
      `
      MATCH (c:Category {name: $category})
      MERGE (p:Product {idempotencyKey: $key})
      ON CREATE SET p.name = $name,
                    p.description = $description,
                    p.price = toInteger($price),
                    p.active = true,
                    p.stock = $stock
      MERGE (p)-[:BELONGS_TO]->(c)
      RETURN elementId(p) AS id
      `,
      { category, name, description, price, key , stock: parsed.data.stock}
    );

    if (records.length === 0) {
      return { error: "التصنيف مش موجود", values: formData2values(parsed.data) };
    }
  } catch {
    return { error: "حصل خطأ، حاول تاني", values: formData2values(parsed.data) };
  }

  updateTag("products");
  redirect("/admin");
}

export async function updateProductAction(
  id: string,
  prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  if (!(await getAdminUser())) return { error: "غير مسموح" };
  if (!id) return { error: "منتج غير صحيح" };

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return { error: parsed.error, values: parsed.values };
  const { name, description, category, price } = parsed.data;

  const version = Number(formData.get("version"));
  if (!Number.isInteger(version) || version < 0) {
    return { error: "طلب غير صالح", values: formData2values(parsed.data) };
  }

  try {
    const records = await runQuery(
      `
      MATCH (p:Product) WHERE elementId(p) = $id
      MATCH (c:Category {name: $category})
      WITH p, c, coalesce(p.version, 0) AS current
      WHERE current = $version
      SET p.name = $name,
          p.description = $description,
          p.price = toInteger($price),
          p.version = current + 1,
          p.stock = $stock
      MERGE (p)-[:BELONGS_TO]->(c)
      WITH p, c
      OPTIONAL MATCH (p)-[old:BELONGS_TO]->(oc:Category)
      WHERE elementId(oc) <> elementId(c)
      DELETE old
      RETURN elementId(p) AS id
      `,
      { id, category, name, description, price, version, stock: parsed.data.stock }
    );

    if (records.length === 0) {
      // مش عارفين السبب: إما اتعدّل من حد تاني أو المنتج/التصنيف اتمسح
      return {
        error:
          "المنتج اتعدّل من حد تاني أو لم يعد موجودًا. حدّثي الصفحة وحاولي تاني.",
        values: formData2values(parsed.data),
      };
    }
  } catch {
    return { error: "حصل خطأ، حاول تاني", values: formData2values(parsed.data) };
  }

  updateTag("products");
  updateTag(`product-${id}`);
  updateTag("stats");
  redirect("/admin");
}

export async function setProductActiveAction(formData: FormData): Promise<void> {
  if (!(await getAdminUser())) throw new Error("غير مسموح");

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "");

  // مبنثقش في الفورم: القيمة لازم تكون true أو false بالظبط
  if (!id || (active !== "true" && active !== "false")) return;

  await runQuery(
    `MATCH (p:Product) WHERE elementId(p) = $id
     SET p.active = $active`,
    { id, active: active === "true" }
  );

  updateTag("products");
  updateTag(`product-${id}`);
}

function formData2values(d: {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number | null;
}): Record<string, string> {
  return { ...d, price: String(d.price), stock: d.stock !== null ? String(d.stock) : "" };
}