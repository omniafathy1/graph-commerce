import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "../../lib/auth";

async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-4 bg-gray-900 text-white">
        <span className="font-bold">لوحة التحكم</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin">المنتجات</Link>
          <Link href="/admin/new">منتج جديد</Link>
          <Link href="/">رجوع للمتجر</Link>
          <Link href="/admin/stats">الإحصائيات</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}