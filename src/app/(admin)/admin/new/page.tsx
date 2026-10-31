import { Suspense } from "react";
import { requireAdmin } from "../../../../lib/auth";
import { getCategories } from "../../../../lib/products";
import { createProductAction } from "../../../actions/product";
import ProductForm from "../ProductForm";

export default function NewProductPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <NewProductContent />
    </Suspense>
  );
}

async function NewProductContent() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">منتج جديد</h1>
      <ProductForm
        categories={categories}
        action={createProductAction}
        submitLabel="حفظ المنتج"
      />
    </main>
  );
}