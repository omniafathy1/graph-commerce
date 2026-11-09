export type ParsedProduct =
  | { ok: false; error: string; values: Record<string, string> }
  | {
      ok: true;
      data: { name: string; description: string; category: string; price: number };
    };

export function parseProductForm(formData: FormData): ParsedProduct {
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