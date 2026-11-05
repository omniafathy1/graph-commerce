import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { runInTransaction, toNum } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/auth";

class EmptyCartError extends Error {}

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "لازم تسجل دخول الأول" },
      { status: 401 }
    );
  }

  try {
    const orderId = await runInTransaction(async (tx) => {
      const params = { customerId: user.customerId };

      // 1) هل العربة فيها حاجة؟
      const count = await tx.run(
        `MATCH (c:Customer)-[:HAS_IN_CART]->(p:Product)
         WHERE elementId(c) = $customerId
         RETURN count(p) AS n`,
        params
      );
      if (toNum(count.records[0].get("n")) === 0) {
        throw new EmptyCartError();
      }

      // 2) إنشاء الأوردر وربط المنتجات
      const created = await tx.run(
        `
        MATCH (c:Customer) WHERE elementId(c) = $customerId
        CREATE (o:Order {createdAt: timestamp(), status: 'pending'})
        CREATE (c)-[:PLACED]->(o)
        WITH o, c
        MATCH (c)-[cart:HAS_IN_CART]->(p:Product)
        CREATE (o)-[:CONTAINS {quantity: cart.quantity, unitPrice: p.price}]->(p)
        RETURN elementId(o) AS orderId
        `,
        params
      );

      // 3) تفريغ العربة
      await tx.run(
        `MATCH (c:Customer)-[r:HAS_IN_CART]->(:Product)
         WHERE elementId(c) = $customerId
         DELETE r`,
        params
      );

      return created.records[0].get("orderId") as string;
    });

    // بعد الـ commit بس
    revalidateTag("stats", "max");

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    if (error instanceof EmptyCartError) {
      return NextResponse.json(
        { success: false, error: "العربة فاضية" },
        { status: 400 }
      );
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "حصل خطأ، حاول تاني" },
      { status: 500 }
    );
  }
}