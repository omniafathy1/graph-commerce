import { Suspense } from "react";
import { notFound } from "next/navigation";
import Modal from "../../../../../app/Modal";
import AddToCartButton from "../../../../../app/(shop)/product/[id]/AddToCartButton";
import { getProduct } from "../../../../../lib/products";

export default function ProductModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <ProductModalContent params={params} />
    </Suspense>
  );
}

async function ProductModalContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  return (
    <Modal>
      <span className="text-xs text-gray-500">{product.category}</span>
      <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
      <p className="text-gray-600 mb-4">{product.description}</p>
      <p className="text-xl font-bold mb-4">{product.price} جنيه</p>
      <div className="flex items-center gap-4">
        <AddToCartButton id={product.id} />
        {/* <a> عادية عن قصد: تعمل hard navigation فتتخطى الـ intercept وتفتح الصفحة الكاملة */}
        <a href={`/product/${product.id}`} className="text-sm text-blue-600 underline">
          الصفحة الكاملة
        </a>
      </div>
    </Modal>
  );
}