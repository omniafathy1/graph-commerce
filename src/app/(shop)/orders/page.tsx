import { Suspense } from "react";
import { runQuery, toNum } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/auth";

type OrderItem = { name: string; price: number; quantity: number };
type OrderRecordItem = { name: string; price: unknown; quantity: unknown };
type Order = { id: string; createdAt: number; status: string; items: OrderItem[] };

async function getOrders(customerId: string): Promise<Order[]> {
  const records = await runQuery(
    `
    MATCH (c:Customer)-[:PLACED]->(o:Order)
    WHERE elementId(c) = $customerId
    OPTIONAL MATCH (o)-[r:CONTAINS]->(p:Product)
    WITH o, collect({name: p.name, price: coalesce(r.unitPrice, p.price), quantity: r.quantity}) AS items
    RETURN elementId(o) AS id, o.createdAt AS createdAt, o.status AS status, items
    ORDER BY o.createdAt DESC
    `,
    { customerId }
  );

  return records.map((r) => ({
    id: r.get("id") as string,
    createdAt: toNum(r.get("createdAt")),
    status: r.get("status") as string,
    items: (r.get("items") as OrderRecordItem[]).map((item) => ({
      name: item.name,
      price: toNum(item.price),
      quantity: toNum(item.quantity),
    })),
  }));
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">جاري التحميل...</p>}>
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  const user = await getCurrentUser();
  const orders = user ? await getOrders(user.customerId) : [];

  if (orders.length === 0) {
    return <main className="p-8">لسه معملتش أي طلب.</main>;
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">طلباتي</h1>
      <div className="space-y-6">
        {orders.map((order) => {
          const total = order.items.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );
          return (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {order.status}
                </span>
              </div>
              <div className="space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{item.price * item.quantity} جنيه</span>
                  </div>
                ))}
              </div>
              <p className="font-bold mt-3 pt-2 border-t">
                الإجمالي: {total} جنيه
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}