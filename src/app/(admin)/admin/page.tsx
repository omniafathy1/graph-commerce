import { Suspense } from "react";
import Link from "next/link";
import { runQuery } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";
import { toggleProductAction } from "../../actions/product";

async function getAllProducts() {
  const records = await runQuery(`
    MATCH (p:Product)-[:BELONGS_TO]->(c:Category)
    RETURN elementId(p) AS id, p.name AS name, p.price AS price,
           c.name AS category, coalesce(p.active, true) AS active
    ORDER BY c.name, p.name
  `);

  return records.map((r) => ({
    id: r.get("id") as string,
    name: r.get("name") as string,
    price: r.get("price").toNumber() as number,
    category: r.get("category") as string,
    active: r.get("active") as boolean,
  }));
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <AdminProductsContent />
    </Suspense>
  );
}

async function AdminProductsContent() {
  await requireAdmin();
  const products = await getAllProducts();

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">المنتجات ({products.length})</h1>
        <Link href="/admin/new" className="bg-black text-white px-4 py-2 rounded text-sm border">
          + منتج جديد
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-start">
              <th className="p-2 text-start">المنتج</th>
              <th className="p-2 text-start">التصنيف</th>
              <th className="p-2 text-start">السعر</th>
              <th className="p-2 text-start">الحالة</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={`border-b ${p.active ? "" : "opacity-50"}`}>
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.category}</td>
                <td className="p-2">{p.price} جنيه</td>
                <td className="p-2">{p.active ? "ظاهر" : "مخفي"}</td>
                <td className="p-2 flex gap-4">
                <Link href={`/admin/${p.id}/edit`} className="text-blue-600 underline">
                    تعديل
                </Link>
                <form action={toggleProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-blue-600 underline">
                    {p.active ? "إخفاء" : "إظهار"}
                    </button>
                </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}