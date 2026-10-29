import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts } from "../../../../lib/products";
import AddToCartButton from "./AddToCartButton";

async function RelatedProducts({ id }: { id: string }) {
  
  const related = await getRelatedProducts(id);

  if (related.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">منتجات مشابهة</h2>
      <div className="grid grid-cols-2 gap-4">
        {related.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="border rounded-lg p-3 hover:bg-gray-50"
          >
            <p className="font-medium">{p.name}</p>
            <p className="text-sm text-gray-600">{p.price} جنيه</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RelatedSkeleton() {
  return (
    <div>
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-3" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-[66px] bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <ProductPageContent params={params} />
    </Suspense>
  );
}

async function ProductPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // الضروري: بنستناه، ولو مش موجود 404 حقيقي (قبل أي streaming)
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <span className="text-xs text-gray-500">{product.category}</span>
      <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
      <p className="text-gray-600 mb-4">{product.description}</p>
      <p className="text-xl font-bold mb-4">{product.price} جنيه</p>
      <AddToCartButton id={product.id} />

      <div className="mt-8">
        {/* الإضافي: بيتحمل بعدين من غير ما يعطّل باقي الصفحة */}
        <Suspense fallback={<RelatedSkeleton />}>
          <RelatedProducts id={id} />
        </Suspense>
      </div>
    </main>
  );
}