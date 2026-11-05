import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

export function connect(
  path = process.env.PROMETHEUS_DB || "data/prometheus.sqlite",
) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 5000 });
  db.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL");
  return db;
}
export type DB = ReturnType<typeof connect>;
export function transaction<T>(db: DB, work: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = work();
    db.exec("COMMIT");
    return value;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function migrate(db: DB) {
  const dir = join(process.cwd(), "migrations");
  db.exec(
    "CREATE TABLE IF NOT EXISTS migrations(name TEXT PRIMARY KEY) STRICT",
  );
  for (const name of readdirSync(dir)
    .filter((n) => n.endsWith(".sql"))
    .sort())
    transaction(db, () => {
      if (db.prepare("SELECT 1 FROM migrations WHERE name=?").get(name)) return;
      db.exec(readFileSync(join(dir, name), "utf8"));
      db.prepare("INSERT INTO migrations VALUES(?)").run(name);
    });
}
export function rows<S extends z.ZodType>(
  db: DB,
  schema: S,
  sql: string,
  ...args: SQLInputValue[]
): z.output<S>[] {
  return db
    .prepare(sql)
    .all(...args)
    .map((row) => schema.parse(row));
}
export function insert(db: DB, sql: string, ...args: SQLInputValue[]) {
  return Number(db.prepare(sql).run(...args).lastInsertRowid);
}
let instance: DB | undefined;
export const database = () => (instance ??= connect());
