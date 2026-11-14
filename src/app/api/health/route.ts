import { NextResponse } from "next/server";
import { runQuery } from "../../../lib/db";

export async function GET() {
  const started = Date.now();
  try {
    await runQuery("RETURN 1 AS ok");
    return NextResponse.json({
      status: "ok",
      database: "up",
      latencyMs: Date.now() - started,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "degraded", database: "down" },
      { status: 503 }
    );
  }
}