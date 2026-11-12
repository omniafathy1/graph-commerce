import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";

// الاختبار بيتصل بالداتابيز مباشرة، فيحتاج نفس المتغيرات
dotenv.config({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // الاختبارات بتكتب في نفس الداتابيز
  workers: 1,
  timeout: 60_000,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});