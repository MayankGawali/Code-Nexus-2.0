import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "prometheus-browser-"));
const surfaces = [
  {
    name: "desktop",
    port: 3198,
    mode: "production",
    seeded: false,
    testMatch: "review.spec.ts",
    viewport: { width: 1440, height: 1050 },
  },
  {
    name: "mobile",
    port: 3199,
    mode: "production",
    seeded: false,
    testMatch: "review.spec.ts",
    viewport: { width: 390, height: 844 },
  },
  {
    name: "judge",
    port: 3200,
    mode: "production",
    seeded: true,
    testMatch: "judge.spec.ts",
    viewport: { width: 1440, height: 1050 },
  },
  {
    name: "dev-startup",
    port: 3000,
    mode: "dev",
    seeded: true,
    testMatch: "startup.spec.ts",
    viewport: { width: 1280, height: 900 },
  },
];
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  projects: surfaces.map((p) => ({
    name: p.name,
    testMatch: p.testMatch,
    use: {
      viewport: p.viewport,
      baseURL: "http://127.0.0.1:" + p.port,
      ...(p.name === "mobile" ? { isMobile: true, hasTouch: true } : {}),
    },
  })),
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: surfaces.map((p) => ({
    command:
      (p.seeded
        ? "npm run db:migrate && npm run db:seed && npm run db:seed && "
        : "") +
      (p.mode === "dev" ? "npm run dev" : "npm start -- --port " + p.port),
    url: "http://127.0.0.1:" + p.port,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      PROMETHEUS_DB: join(dir, p.name + ".sqlite"),
      NEXT_TELEMETRY_DISABLED: "1",
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "",
    },
  })),
});
