import neo4j from "neo4j-driver";

export function toNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return neo4j.isInt(value) ? value.toNumber() : Number(value);
}