export type ParsedProduct =
  | { ok: false; error: string; values: Record<string, string> }
  | {
      ok: true;
      data: { name: string; description: string; category: string; price: number ;stock: number | null;};
    };

export function parseProductForm(formData: FormData): ParsedProduct {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const rawPrice = String(formData.get("price") ?? "");
  const price = Number(rawPrice);
  const rawStock = String(formData.get("stock") ?? "").trim();
  const stock = rawStock === "" ? null : Number(rawStock);

  const values = { name, description, category, price: rawPrice, stock: rawStock };

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
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
    return { ok: false, error: "المخزون لازم يكون رقم صحيح (0 أو أكتر)", values };
  }

  return { ok: true, data: { name, description, category, price, stock } };

}