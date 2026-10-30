import { NextResponse } from "next/server";
import { runQuery } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [], count: 0 });
  }

  const records = await runQuery(
    `MATCH (c:Customer)-[r:HAS_IN_CART]->(p:Product)
     WHERE elementId(c) = $customerId
     RETURN elementId(p) AS id, p.name AS name, p.price AS price, r.quantity AS quantity`,
    { customerId: user.customerId }
  );

  const items = records.map((r) => ({
    id: r.get("id"),
    name: r.get("name"),
    price: r.get("price").toNumber(),
    quantity: r.get("quantity").toNumber(),
  }));

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return NextResponse.json({ items, count });
}