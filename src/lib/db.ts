import neo4j, { Driver, ManagedTransaction } from "neo4j-driver";
import { logger } from "./logger";

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
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runQuery(cypher: string, params: Record<string, any> = {}) {
  const session = getDriver().session();
  const SLOW_QUERY_MS = 1;
  const started = performance.now();


  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
    
    const ms = Math.round(performance.now() - started);
  if (ms > SLOW_QUERY_MS) {
    // أول سطر من الكويري بس، ومن غير params عمدًا (ممكن فيها hash باسورد)
    logger.warn({ ms, query: cypher.trim().split("\n")[0] }, "slow query");
  }
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