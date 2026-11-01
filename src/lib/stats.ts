import { cacheLife, cacheTag } from "next/cache";
import { runQuery, toNum } from "../lib/db";

export async function getTotals() {
  "use cache";
  cacheLife("minutes");
  cacheTag("stats");

  const [orders, customers, revenue] = await Promise.all([
    runQuery(`MATCH (o:Order) RETURN count(o) AS n`),
    runQuery(`MATCH (c:Customer) RETURN count(c) AS n`),
    runQuery(`
      MATCH (:Order)-[r:CONTAINS]->(p:Product)
      RETURN sum(r.quantity * coalesce(r.unitPrice, p.price)) AS total
    `),
  ]);

  return {
    orders: toNum(orders[0]?.get("n")),
    customers: toNum(customers[0]?.get("n")),
    revenue: toNum(revenue[0]?.get("total")),
  };
}

export async function getTopProducts() {
  "use cache";
  cacheLife("minutes");
  cacheTag("stats");

  const records = await runQuery(`
    MATCH (:Order)-[r:CONTAINS]->(p:Product)
    RETURN elementId(p) AS id, p.name AS name,
           sum(r.quantity) AS sold,
           sum(r.quantity * coalesce(r.unitPrice, p.price)) AS revenue
    ORDER BY sold DESC
    LIMIT 5
  `);

  return records.map((r) => ({
    id: r.get("id") as string,
    name: r.get("name") as string,
    sold: toNum(r.get("sold")),
    revenue: toNum(r.get("revenue")),
  }));
}

export async function getRevenueByCategory() {
  "use cache";
  cacheLife("minutes");
  cacheTag("stats");

  const records = await runQuery(`
    MATCH (:Order)-[r:CONTAINS]->(p:Product)-[:BELONGS_TO]->(c:Category)
    RETURN c.name AS category,
           sum(r.quantity * coalesce(r.unitPrice, p.price)) AS revenue
    ORDER BY revenue DESC
  `);

  return records.map((r) => ({
    category: r.get("category") as string,
    revenue: toNum(r.get("revenue")),
  }));
}