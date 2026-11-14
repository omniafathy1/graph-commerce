import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { runInTransaction, runQuery, toNum } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/auth";
import { logger } from "@/src/lib/logger";
import error from "../../(shop)/error";

class EmptyCartError extends Error {}
class OutOfStockError extends Error {
  constructor(public productName: string) {
    super("OUT_OF_STOCK");
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findOrderByKey(scopedKey: string): Promise<string | null> {
  const records = await runQuery(
    `MATCH (o:Order {idempotencyKey: $scopedKey}) RETURN elementId(o) AS orderId`,
    { scopedKey }
  );
  return records.length > 0 ? (records[0].get("orderId") as string) : null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "لازم تسجل دخول الأول" },
      { status: 401 }
    );
  }
  const log = logger.child({
  route: "checkout",
  requestId: request.headers.get("x-vercel-id") ?? crypto.randomUUID(),
  customerId: user.customerId,
});

  const key = request.headers.get("Idempotency-Key");
  if (!key || !UUID_RE.test(key)) {
    return NextResponse.json(
      { success: false, error: "طلب غير صالح" },
      { status: 400 }
    );
  }

  // المفتاح متربط بالعميل، فمحدش يوصل لأوردر حد تاني بتخمين مفتاح
  const scopedKey = `${user.customerId}|${key}`;

  try {
    const { orderId, replayed } = await runInTransaction(async (tx) => {
      const params = { customerId: user.customerId, scopedKey };

      // 1) المحاولة دي اتنفذت قبل كده؟
      const existing = await tx.run(
        `MATCH (o:Order {idempotencyKey: $scopedKey}) RETURN elementId(o) AS orderId`,
        params
      );
      if (existing.records.length > 0) {
        return {
          orderId: existing.records[0].get("orderId") as string,
          replayed: true,
        };
      }

      // 2) العربة فيها حاجة؟
      const count = await tx.run(
        `MATCH (c:Customer)-[:HAS_IN_CART]->(p:Product)
         WHERE elementId(c) = $customerId
         RETURN count(p) AS n`,
        params
      );
      if (toNum(count.records[0].get("n")) === 0) {
        throw new EmptyCartError();
      }

            // 2.5) خصم المخزون: لكل منتج، بترتيب ثابت (لتجنب deadlock)
      const items = await tx.run(
        `MATCH (c:Customer)-[cart:HAS_IN_CART]->(p:Product)
         WHERE elementId(c) = $customerId
         RETURN elementId(p) AS id, p.name AS name, cart.quantity AS qty
         ORDER BY elementId(p)`,
        params
      );

      for (const row of items.records) {
        const deducted = await tx.run(
          `MATCH (p:Product) WHERE elementId(p) = $id
             AND (p.stock IS NULL OR p.stock >= $qty)
           SET p.stock = CASE WHEN p.stock IS NULL THEN null ELSE p.stock - $qty END
           RETURN elementId(p) AS id`,
          { id: row.get("id"), qty: toNum(row.get("qty")) }
        );
        if (deducted.records.length === 0) {
          throw new OutOfStockError(row.get("name") as string);
        }
      }

      // 3) إنشاء الأوردر (ومعاه المفتاح) وربط المنتجات
      const created = await tx.run(
        `
        MATCH (c:Customer) WHERE elementId(c) = $customerId
        CREATE (o:Order {createdAt: timestamp(), status: 'pending', idempotencyKey: $scopedKey})
        CREATE (c)-[:PLACED]->(o)
        WITH o, c
        MATCH (c)-[cart:HAS_IN_CART]->(p:Product)
        CREATE (o)-[:CONTAINS {quantity: cart.quantity, unitPrice: p.price}]->(p)
        RETURN elementId(o) AS orderId
        `,
        params
      );

      // 4) تفريغ العربة
      await tx.run(
        `MATCH (c:Customer)-[r:HAS_IN_CART]->(:Product)
         WHERE elementId(c) = $customerId
         DELETE r`,
        params
      );

      return {
        orderId: created.records[0].get("orderId") as string,
        replayed: false,
      };
    });

    // بعد الـ commit، ومش بنعمله لو الأوردر قديم
    if (!replayed) revalidateTag("stats", "max");
    
    log.info({ orderId, replayed }, "checkout completed");

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    // أي فشل: ممكن طلب موازي بنفس المفتاح يكون نجح، فنسأل قبل ما نرجّع خطأ
    try {
      const existingOrderId = await findOrderByKey(scopedKey);
      if (existingOrderId) {
        return NextResponse.json({ success: true, orderId: existingOrderId });
      }
    } catch {
      // نكمّل للرد بالخطأ تحت
    }

        if (error instanceof OutOfStockError) {
        log.warn({ product: error.productName }, "checkout rejected: out of stock");

      return NextResponse.json(
        {
          success: false,
          error: `الكمية المطلوبة من "${error.productName}" غير متوفرة`,
        },
        { status: 409 }
      );
    }

    if (error instanceof EmptyCartError) {
      return NextResponse.json(
        { success: false, error: "العربة فاضية" },
        { status: 400 }
      );
    }
log.error({ err: error }, "checkout failed");
logger.error({ err: error, customerId: user.customerId, route: "checkout" }, "checkout failed");
    return NextResponse.json(
      { success: false, error: "حصل خطأ، حاول تاني" },
      { status: 500 }
    );
  }
}