"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runQuery } from "../../lib/db";
import { getAdminUser } from "../../lib/auth";
import { updateTag } from "next/cache";

export type ProductFormState =
  | { error?: string; values?: Record<string, string> }
  | undefined;

type Parsed =
  | { ok: false; error: string; values: Record<string, string> }
  | {
      ok: true;
      data: { name: string; description: string; category: string; price: number };
    };

// دالة مساعدة مش exported: ملف "use server" مينفعش يصدّر غير دوال async
function parseProductForm(formData: FormData): Parsed {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const rawPrice = String(formData.get("price") ?? "");
  const price = Number(rawPrice);

  const values = { name, description, category, price: rawPrice };

  if (!name || name.length > 100) {
    return { ok: false, error: "اسم المنتج مطلوب (100 حرف كحد أقصى)", values };
  }
  if (description.length > 1000) {
    return { ok: false, error: "الوصف طويل أوي (1000 حرف كحد أقصى)", values };
  }
  if (!Number.isInteger(price) || price <= 0) {
    return { ok: false, error: "السعر لازم يكون رقم صحيح أكبر من صفر", values };
  }
  if (!category) {
    return { ok: false, error: "اختار تصنيف", values };
  }

  return { ok: true, data: { name, description, category, price } };
}

export async function createProductAction(
  prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  if (!(await getAdminUser())) return { error: "غير مسموح" };

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return { error: parsed.error, values: parsed.values };
  const { name, description, category, price } = parsed.data;

  try {
    const records = await runQuery(
      `
      MATCH (c:Category {name: $category})
      CREATE (p:Product {
        name: $name,
        description: $description,
        price: toInteger($price),
        active: true
      })
      CREATE (p)-[:BELONGS_TO]->(c)
      RETURN elementId(p) AS id
      `,
      { category, name, description, price }
    );

    if (records.length === 0) {
      return { error: "التصنيف مش موجود", values: formData2values(parsed.data) };
    }
  } catch {
    return { error: "حصل خطأ، حاول تاني", values: formData2values(parsed.data) };
  }

// createProductAction
updateTag("products");
redirect("/admin");
}

// الـ id أول argument لأنه جاي من .bind(null, id)
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

  try {
    const records = await runQuery(
      `
        MATCH (p:Product) WHERE elementId(p) = $id
        MATCH (c:Category {name: $category})
        SET p.name = $name,
            p.description = $description,
            p.price = toInteger($price)
        MERGE (p)-[:BELONGS_TO]->(c)
        WITH p, c
        OPTIONAL MATCH (p)-[old:BELONGS_TO]->(oc:Category)
        WHERE elementId(oc) <> elementId(c)
        DELETE old
        RETURN elementId(p) AS id
      `,
      { id, category, name, description, price }
    );

    if (records.length === 0) {
      return {
        error: "المنتج أو التصنيف مش موجود",
        values: formData2values(parsed.data),
      };
    }
  } catch {
    return { error: "حصل خطأ، حاول تاني", values: formData2values(parsed.data) };
  }

// updateProductAction
updateTag("products");
updateTag(`product-${id}`);
updateTag("stats");   // الاسم والتصنيف بيظهروا في الإحصائيات
redirect("/admin");
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  if (!(await getAdminUser())) throw new Error("غير مسموح");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await runQuery(
    `MATCH (p:Product) WHERE elementId(p) = $id
     SET p.active = NOT coalesce(p.active, true)`,
    { id }
  );

updateTag("products");
updateTag(`product-${id}`);
updateTag("stats");
}

function formData2values(d: {
  name: string;
  description: string;
  category: string;
  price: number;
}): Record<string, string> {
  return { ...d, price: String(d.price) };
}