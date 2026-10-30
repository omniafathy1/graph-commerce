import { NextResponse } from "next/server";
import { runQuery } from "../../../../lib/db";
import { getCurrentUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "لازم تسجل دخول الأول" },
      { status: 401 }
    );
  }

  const { productId } = await request.json();

  await runQuery(
    `
    MATCH (c:Customer), (p:Product)
    WHERE elementId(c) = $customerId AND elementId(p) = $productId
    MERGE (c)-[r:HAS_IN_CART]->(p)
    ON CREATE SET r.quantity = 1
    ON MATCH SET r.quantity = r.quantity + 1
    `,
    { customerId: user.customerId, productId }
  );

  return NextResponse.json({ success: true });
}