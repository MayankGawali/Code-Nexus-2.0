import { it, expect } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { createFreshDemo } from "../lib/demo";
import { connect } from "../lib/db";
it("creates only explicitly named fresh demo files and refuses overwrites or traversal", () => {
  const root = mkdtempSync(join(tmpdir(), "prometheus-release-"));
  expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
  try {
    const path = createFreshDemo("judge-one", root),
      original = readFileSync(path);
    expect(path).toBe(join(root, "data", "demo-judge-one.sqlite"));
    expect(() => createFreshDemo("judge-one", root)).toThrow(
      /Refusing to overwrite/,
    );
    expect(readFileSync(path)).toEqual(original);
    expect(() => createFreshDemo("../private", root)).toThrow();
    const db = connect(path);
    try {
      expect(db.prepare("SELECT count(*) n FROM campaign").get()!.n).toBe(1);
      expect(db.prepare("SELECT count(*) n FROM decision").get()!.n).toBe(3);
    } finally {
      db.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
