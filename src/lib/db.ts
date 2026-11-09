import neo4j, { Driver, ManagedTransaction } from "neo4j-driver";

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

// db.ts
export async function runInTransaction<T>(work: (tx: ManagedTransaction) => Promise<T>) {
  const session = getDriver().session();
  try {
    return await session.executeWrite(work);
  } finally {
    await session.close();
  }
}

export { toNum } from "./toNum";