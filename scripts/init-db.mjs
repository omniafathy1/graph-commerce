import neo4j from "neo4j-driver";

const statements = [
  "CREATE CONSTRAINT customer_email_unique IF NOT EXISTS FOR (c:Customer) REQUIRE c.email IS UNIQUE",
  "CREATE CONSTRAINT order_idempotency_unique IF NOT EXISTS FOR (o:Order) REQUIRE o.idempotencyKey IS UNIQUE",
  "CREATE CONSTRAINT product_idempotency_unique IF NOT EXISTS FOR (p:Product) REQUIRE p.idempotencyKey IS UNIQUE",
  "CREATE CONSTRAINT session_id_unique IF NOT EXISTS FOR (s:Session) REQUIRE s.id IS UNIQUE",
  "CREATE CONSTRAINT login_attempt_key_unique IF NOT EXISTS FOR (a:LoginAttempt) REQUIRE a.key IS UNIQUE",
  "MERGE (:Category {name: 'Electronics'})",
  "MERGE (:Category {name: 'Clothing'})",
];

const { COGNO_URI, COGNO_USERNAME, COGNO_PASSWORD } = process.env;
if (!COGNO_URI || !COGNO_USERNAME || !COGNO_PASSWORD) {
  console.error("Missing COGNO_URI, COGNO_USERNAME or COGNO_PASSWORD");
  process.exit(1);
}

const driver = neo4j.driver(COGNO_URI, neo4j.auth.basic(COGNO_USERNAME, COGNO_PASSWORD));

try {
  await driver.verifyConnectivity();
  for (const statement of statements) {
    const session = driver.session();
    try {
      await session.run(statement);
      console.log("ok:", statement.slice(0, 80));
    } finally {
      await session.close();
    }
  }
} finally {
  await driver.close();
}