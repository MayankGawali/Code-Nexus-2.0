import { mkdirSync, openSync, closeSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import { connect, migrate } from "./db";
import { seed } from "./seed";
export function createFreshDemo(name: string, root = process.cwd()) {
  const safe = z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{0,63}$/,
      "Use a demo name containing only lower-case letters, numbers and hyphens.",
    )
    .parse(name);
  const dir = resolve(root, "data");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "demo-" + safe + ".sqlite");
  try {
    closeSync(openSync(path, "wx"));
  } catch {
    throw Error(
      "Refusing to overwrite an existing demo. Choose a new name; no data was reset.",
    );
  }
  const db = connect(path);
  try {
    migrate(db);
    db.exec(
      "CREATE TABLE demo_workspace(id TEXT PRIMARY KEY CHECK(id='prometheus-fictional-demo'),created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP) STRICT; INSERT INTO demo_workspace(id) VALUES('prometheus-fictional-demo')",
    );
    seed(db);
  } finally {
    db.close();
  }
  return path;
}
