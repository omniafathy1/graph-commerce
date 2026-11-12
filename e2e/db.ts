import neo4j from "neo4j-driver";

function driver() {
  const uri = process.env.COGNO_URI;
  const user = process.env.COGNO_USERNAME;
  const pass = process.env.COGNO_PASSWORD;
  if (!uri || !user || !pass) {
    throw new Error("Missing COGNO_* variables. Check .env.local");
  }
  return neo4j.driver(uri, neo4j.auth.basic(user, pass));
}

export async function run<T = unknown>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const d = driver();
  const session = d.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r) => r.toObject() as T);
  } finally {
    await session.close();
    await d.close();
  }
}

/** ينشئ منتج اختبار بمخزون محدد، ويرجّع الـ id */
export async function createTestProduct(stock: number | null): Promise<string> {
  const name = `E2E Product ${Date.now()}`;
  const rows = await run<{ id: string }>(
    `MATCH (c:Category) WITH c LIMIT 1
     CREATE (p:Product {name: $name, description: 'e2e', price: 100, active: true, stock: $stock})
     CREATE (p)-[:BELONGS_TO]->(c)
     RETURN elementId(p) AS id`,
    { name, stock }
  );
  return rows[0].id;
}

export async function getStock(productId: string): Promise<number | null> {
  const rows = await run<{ stock: unknown }>(
    `MATCH (p:Product) WHERE elementId(p) = $id RETURN p.stock AS stock`,
    { id: productId }
  );
  const s = rows[0]?.stock;
  if (s === null || s === undefined) return null;
  return neo4j.isInt(s) ? (s as { toNumber(): number }).toNumber() : Number(s);
}

/** ينضّف بيانات الاختبار بس (إيميل e2e- ومنتجات E2E) */
export async function cleanup(): Promise<void> {
  await run(
    `MATCH (o:Order)<-[:PLACED]-(c:Customer)
     WHERE c.email STARTS WITH 'e2e-' AND c.email ENDS WITH '@test.local'
     DETACH DELETE o`
  );
  await run(
    `MATCH (c:Customer)
     WHERE c.email STARTS WITH 'e2e-' AND c.email ENDS WITH '@test.local'
     DETACH DELETE c`
  );
  await run(
    `MATCH (p:Product) WHERE p.name STARTS WITH 'E2E Product' DETACH DELETE p`
  );
  await run(
    `MATCH (a:LoginAttempt)
     WHERE a.key CONTAINS 'e2e-' AND a.key CONTAINS '@test.local'
     DETACH DELETE a`
  );
}