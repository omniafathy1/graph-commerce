import { NextResponse } from "next/server";
import { runQuery } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/auth";
import { revalidateTag } from "next/cache";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "لازم تسجل دخول الأول" },
      { status: 401 }
    );
  }

  try {
    const result = await runQuery(
      `
      MATCH (c:Customer)
      WHERE elementId(c) = $customerId
      MATCH (c)-[cart:HAS_IN_CART]->(p:Product)
      WITH c, collect({productId: elementId(p), quantity: cart.quantity, unitPrice: p.price}) AS items, collect(cart) AS cartRelationships
      CREATE (o:Order {createdAt: timestamp(), status: "pending"})
      CREATE (c)-[:PLACED]->(o)
      WITH o, items, cartRelationships
      UNWIND items AS item
      MATCH (p:Product)
      WHERE elementId(p) = item.productId
      CREATE (o)-[:CONTAINS {quantity: item.quantity, unitPrice: item.unitPrice}]->(p)
      WITH DISTINCT o, cartRelationships
      FOREACH (cart IN cartRelationships | DELETE cart)
      RETURN elementId(o) AS orderId
      `,
      { customerId: user.customerId }
    );

    if (!result[0]) {
      return NextResponse.json(
        { success: false, error: "العربة فاضية" },
        { status: 400 }
      );
    }

    const orderId = result[0].get("orderId") as string;

    revalidateTag("stats", "max");
    return NextResponse.json({ success: true, orderId });

  } catch (error: unknown) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "حدث خطأ أثناء إتمام الطلب",
      },
      { status: 500 }
    );
  }
}