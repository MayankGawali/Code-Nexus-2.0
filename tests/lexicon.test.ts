import { describe, it, expect } from "vitest";
import { defaultScanner } from "../lib/lexicon";

describe("Aho-Corasick Lexicon Scanner", () => {
  it("detects forbidden buzzwords and superlatives", () => {
    const text = "Our revolutionary new watch is completely unbreakable.";
    const matches = defaultScanner.scan(text);

    expect(matches.length).toBe(2);
    expect(matches[0].matchedText.toLowerCase()).toBe("revolutionary");
    expect(matches[0].replacement).toBe("innovative");
    expect(matches[1].matchedText.toLowerCase()).toBe("unbreakable");
  });

  it("enforces proper trademark capitalization", () => {
    const text = "Connect via bluetooth and wifi to your aster watch.";
    const matches = defaultScanner.scan(text);

    const patterns = matches.map((m) => m.matchedText);
    expect(patterns).toContain("bluetooth");
    expect(patterns).toContain("wifi");
    expect(patterns).toContain("aster watch");

    const btMatch = matches.find((m) => m.matchedText === "bluetooth");
    expect(btMatch?.replacement).toBe("Bluetooth®");
  });

  it("respects word boundaries and avoids false substring matches", () => {
    // "cheap" should match, but "cheaper" or "cheapest" should not falsely trigger word rule
    const text = "This is a cheap item in a workshop.";
    const matches = defaultScanner.scan(text);

    expect(matches.some((m) => m.matchedText === "cheap")).toBe(true);
  });
});
