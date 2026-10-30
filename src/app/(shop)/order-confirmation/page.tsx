import { Suspense } from "react";

export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <OrderConfirmationContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderConfirmationContent({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-2">تم الطلب بنجاح! 🎉</h1>
      <p className="text-gray-600">رقم الطلب: {orderId}</p>
    </main>
  );
}