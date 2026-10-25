import neo4j, { Driver } from "neo4j-driver";

let driver: Driver;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      process.env.COGNO_URI!,
      neo4j.auth.basic(
        process.env.COGNO_USERNAME!,
        process.env.COGNO_PASSWORD!
      )
    );
  }
  return driver;
}

export async function runQuery(cypher: string, params: Record<string, any> = {}) {
  const session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

export function toNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return neo4j.isInt(value) ? value.toNumber() : Number(value);
}