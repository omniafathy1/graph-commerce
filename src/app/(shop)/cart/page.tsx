"use client";

import Link from "next/link";
import { useCart } from "../../../hooks/useCart";
import CheckoutButton from "./CheckoutButton";

export default function CartPage() {
  const { data, isLoading } = useCart();
  const items = data?.items ?? [];

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="animate-pulse rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-[var(--muted)]">
          جاري تجهيز العربة...
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
        <section className="mx-auto max-w-xl rounded-3xl border border-[var(--line)] bg-[var(--surface)] px-6 py-14 text-center shadow-[0_18px_50px_rgba(41,35,26,0.06)] sm:px-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ink-soft)] text-2xl">＋</div>
          <p className="mb-2 text-2xl font-bold">العربة فاضية</p>
          <p className="mb-8 text-[var(--muted)]">اختار حاجاتك المفضلة وارجع هنا لما تكون جاهز.</p>
          <Link href="/" className="inline-flex rounded-full bg-[var(--foreground)] px-6 py-3 font-medium text-white hover:-translate-y-0.5 hover:bg-[var(--accent-dark)]">
            تصفح المنتجات
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="mb-10">
        <p className="mb-2 text-sm font-medium text-[var(--accent-dark)]">خطوتك الأخيرة قبل الطلب</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">عربة الشراء</h1>
        <p className="mt-2 text-[var(--muted)]">راجع اختياراتك وتأكد أن كل شيء على ما يرام.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(41,35,26,0.05)] sm:p-7">
          <div className="mb-5 flex items-center justify-between border-b border-[var(--line)] pb-4">
            <h2 className="font-bold">المنتجات</h2>
            <span className="text-sm text-[var(--muted)]">{items.length} منتجات</span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-5 first:pt-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{item.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">الكمية: {item.quantity}</p>
                </div>
                <p className="shrink-0 font-bold">{item.price * item.quantity} جنيه</p>
              </div>
            ))}
          </div>
        </section>
        <aside className="rounded-3xl bg-[var(--foreground)] p-6 text-white shadow-[0_18px_50px_rgba(23,33,43,0.16)] sm:p-7">
          <p className="text-sm text-white/60">ملخص الطلب</p>
          <div className="mt-6 flex items-end justify-between border-b border-white/15 pb-5">
            <span className="text-white/70">الإجمالي</span>
            <span className="text-2xl font-bold">{total} جنيه</span>
          </div>
          <CheckoutButton />
          <Link href="/" className="mt-4 block text-center text-sm text-white/65 hover:text-white">العودة للتسوق</Link>
        </aside>
      </div>
    </main>
  );
}