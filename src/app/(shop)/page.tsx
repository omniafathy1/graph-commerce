import { Suspense } from "react";
import Link from "next/link";
import CategoryFilter from "./CategoryFilter";
import { getCategories, getProducts } from "../../lib/products";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category: raw } = await searchParams;
  const category = typeof raw === "string" ? raw : null;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(category),
  ]);

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">المتجر</h1>
      <CategoryFilter categories={categories} active={category} />

      {products.length === 0 ? (
        <p className="text-gray-600">مفيش منتجات في التصنيف ده.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              href={`/product/${product.id}`}
              key={product.id}
              className="border rounded-lg p-4 shadow-sm hover:bg-gray-50"
            >
              <span className="text-xs text-gray-500">{product.category}</span>
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
              <p className="font-bold">{product.price} جنيه</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}