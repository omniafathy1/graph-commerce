import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/auth";
import { getCategories, getProductForAdmin } from "../../../../../lib/products";
import { updateProductAction } from "../../../../actions/product";
import ProductForm from "../../ProductForm";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <EditProductContent params={params} />
    </Suspense>
  );
}

async function EditProductContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getProductForAdmin(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">تعديل: {product.name}</h1>
      <ProductForm
        categories={categories}
        action={updateProductAction.bind(null, id)}
        initial={product}
        submitLabel="حفظ التعديلات"
      />
    </main>
  );
}