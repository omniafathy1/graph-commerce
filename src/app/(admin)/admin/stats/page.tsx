import { Suspense } from "react";
import { requireAdmin } from "../../../../lib/auth";
import { getTotals, getTopProducts, getRevenueByCategory } from "../../../../lib/stats";

const money = (n: number) => `${n.toLocaleString("en-US")} جنيه`;

/* ---------- Skeletons (approximately the same size as the content) ---------- */

function Block({ className }: { className: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Block key={i} className="h-[90px]" />
      ))}
    </div>
  );
}

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Block key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}

/* ---------- Sections: each is async and fetches its own data ---------- */

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

async function TotalsSection() {
  const totals = await getTotals();

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card label="عدد الطلبات" value={String(totals.orders)} />
      <Card label="إجمالي الإيرادات" value={money(totals.revenue)} />
      <Card label="عدد العملاء" value={String(totals.customers)} />
    </section>
  );
}

async function TopProductsTable() {
  const products = await getTopProducts();

  if (products.length === 0) {
    return <p className="text-gray-600 text-sm">لسه مفيش مبيعات.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="p-2 text-start">المنتج</th>
          <th className="p-2 text-start">الكمية المباعة</th>
          <th className="p-2 text-start">الإيراد</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id} className="border-b">
            <td className="p-2">{p.name}</td>
            <td className="p-2">{p.sold}</td>
            <td className="p-2">{money(p.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function CategoryBars() {
  const categories = await getRevenueByCategory();
  if (categories.length === 0) {
    return <p className="text-gray-600 text-sm">لسه مفيش مبيعات.</p>;
  }

  const maxRevenue = Math.max(1, ...categories.map((c) => c.revenue));

  return (
    <div className="space-y-3">
      {categories.map((c) => (
        <div key={c.category}>
          <div className="flex justify-between text-sm mb-1">
            <span>{c.category}</span>
            <span>{money(c.revenue)}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-600 rounded"
              style={{ width: `${(c.revenue / maxRevenue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Page: checks admin access first, then renders the sections ---------- */

export default function StatsPage() {
  return (
    <Suspense fallback={<CardsSkeleton />}>
      <StatsContent />
    </Suspense>
  );
}

async function StatsContent() {
  await requireAdmin(); // Before any streaming

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold">الإحصائيات</h1>

      <Suspense fallback={<CardsSkeleton />}>
        <TotalsSection />
      </Suspense>

      <section>
        <h2 className="text-lg font-semibold mb-3">أكتر المنتجات مبيعًا</h2>
        <Suspense fallback={<RowsSkeleton rows={5} />}>
          <TopProductsTable />
        </Suspense>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">الإيراد حسب التصنيف</h2>
        <Suspense fallback={<RowsSkeleton rows={3} />}>
          <CategoryBars />
        </Suspense>
      </section>
    </main>
  );
}