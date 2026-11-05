import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "prometheus-e2e-"));
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3198" },
  webServer: {
    command:
      "npm run db:migrate && npm run db:seed && npm run start -- --port 3198",
    url: "http://127.0.0.1:3198",
    reuseExistingServer: false,
    env: {
      PROMETHEUS_DB: join(dir, "test.sqlite"),
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
