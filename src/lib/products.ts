import { cacheLife, cacheTag } from "next/cache";
import { runQuery } from "../lib/db";

export async function getCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const records = await runQuery(
    `MATCH (c:Category) RETURN c.name AS name ORDER BY name`
  );
  return records.map((r) => r.get("name") as string);
}

export async function getProducts(category: string | null) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const records = await runQuery(
    `
    MATCH (p:Product)-[:BELONGS_TO]->(c:Category)
    WHERE ($category IS NULL OR c.name = $category) AND coalesce(p.active, true)
    RETURN elementId(p) AS id, p.name AS name, p.price AS price,
           p.description AS description, c.name AS category
    `,
    { category }
  );

  return records.map((r) => ({
    id: r.get("id") as string,
    name: r.get("name") as string,
    price: r.get("price").toNumber() as number,
    description: (r.get("description") ?? "") as string,
    category: r.get("category") as string,
  }));
}

export async function getProduct(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`product-${id}`);

  const records = await runQuery(
    `
    MATCH (p:Product)-[:BELONGS_TO]->(c:Category)
    WHERE elementId(p) = $id AND coalesce(p.active, true)
    RETURN elementId(p) AS id, p.name AS name, p.price AS price,
           p.description AS description, c.name AS category
    `,
    { id }
  );

  if (records.length === 0) return null;

  const r = records[0];
  return {
    id: r.get("id") as string,
    name: r.get("name") as string,
    price: r.get("price").toNumber() as number,
    description: (r.get("description") ?? "") as string,
    category: r.get("category") as string,
  };
}

export async function getRelatedProducts(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const records = await runQuery(
    `
    MATCH (p:Product)-[:RELATED_TO]->(related:Product)
    WHERE elementId(p) = $id AND coalesce(related.active, true)
    RETURN elementId(related) AS id, related.name AS name, related.price AS price
    `,
    { id }
  );

  return records.map((r) => ({
    id: r.get("id") as string,
    name: r.get("name") as string,
    price: r.get("price").toNumber() as number,
  }));
}

// عمدًا من غير كاش: الأدمن لازم يعدّل على الداتا الحية
export async function getProductForAdmin(id: string) {
  const records = await runQuery(
    `
    MATCH (p:Product)-[:BELONGS_TO]->(c:Category)
    WHERE elementId(p) = $id
    RETURN p.name AS name, p.description AS description,
           p.price AS price, c.name AS category
    `,
    { id }
  );

  if (records.length === 0) return null;

  const r = records[0];
  return {
    name: r.get("name") as string,
    description: (r.get("description") ?? "") as string,
    price: r.get("price").toNumber() as number,
    category: r.get("category") as string,
  };
}