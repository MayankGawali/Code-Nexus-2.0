/**
 * Prometheus Sub-millisecond Aho-Corasick Lexicon & Terminology Scanner
 * Fast trie automaton for multi-pattern dictionary search in O(n + m) time.
 * Enforces brand lexicon, forbidden buzzwords, and mandatory capitalization rules.
 */

export type LexiconCategory =
  | "banned_buzzword"
  | "forbidden_superlative"
  | "trademark_capitalization"
  | "deprecated_terminology"
  | "compliance_risk";

export type LexiconRule = {
  id: string;
  pattern: string;
  category: LexiconCategory;
  replacement: string;
  explanation: string;
  severity: "high" | "medium" | "low";
  caseSensitive?: boolean;
};

export type LexiconMatch = {
  ruleId: string;
  pattern: string;
  category: LexiconCategory;
  severity: "high" | "medium" | "low";
  start: number;
  stop: number;
  matchedText: string;
  replacement: string;
  explanation: string;
};

// Trie node structure for Aho-Corasick
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  fail: TrieNode | null = null;
  output: LexiconRule[] = [];
}

export class AhoCorasickScanner {
  private root: TrieNode = new TrieNode();
  private rules: LexiconRule[] = [];

  constructor(rules: LexiconRule[]) {
    this.rules = rules;
    this.buildTrie();
    this.buildFailureLinks();
  }

  private buildTrie() {
    for (const rule of this.rules) {
      let current = this.root;
      const key = rule.caseSensitive ? rule.pattern : rule.pattern.toLowerCase();
      for (const char of key) {
        if (!current.children.has(char)) {
          current.children.set(char, new TrieNode());
        }
        current = current.children.get(char)!;
      }
      current.output.push(rule);
    }
  }

  private buildFailureLinks() {
    const queue: TrieNode[] = [];

    // Level 1 children fail to root
    for (const child of this.root.children.values()) {
      child.fail = this.root;
      queue.push(child);
    }

    // BFS to build failure links for deeper levels
    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const [char, child] of current.children.entries()) {
        let f = current.fail;
        while (f !== null && !f.children.has(char)) {
          f = f.fail;
        }
        child.fail = f ? f.children.get(char)! : this.root;

        // Merge outputs from fail node
        if (child.fail.output.length > 0) {
          child.output = [...child.output, ...child.fail.output];
        }

        queue.push(child);
      }
    }
  }

  /**
   * Scans text and extracts all lexicon violations with exact character spans.
   * Enforces word-boundary checks so sub-words aren't falsely flagged.
   */
  public scan(text: string): LexiconMatch[] {
    const matches: LexiconMatch[] = [];
    let current = this.root;
    const lower = text.toLowerCase();

    const isWordChar = (c?: string) => c !== undefined && /[\w]/.test(c);

    for (let i = 0; i < text.length; i++) {
      const char = lower[i];

      while (current !== this.root && !current.children.has(char)) {
        current = current.fail ?? this.root;
      }

      current = current.children.get(char) ?? this.root;

      if (current.output.length > 0) {
        for (const rule of current.output) {
          const matchLen = rule.pattern.length;
          const start = i - matchLen + 1;
          const stop = i + 1;
          const originalSubstring = text.slice(start, stop);

          // If case-sensitive, check exact case
          if (rule.caseSensitive && originalSubstring !== rule.pattern) {
            continue;
          }

          // Check word boundaries
          const prevChar = start > 0 ? text[start - 1] : undefined;
          const nextChar = stop < text.length ? text[stop] : undefined;
          if (isWordChar(prevChar) || isWordChar(nextChar)) {
            continue;
          }

          matches.push({
            ruleId: rule.id,
            pattern: rule.pattern,
            category: rule.category,
            severity: rule.severity,
            start,
            stop,
            matchedText: originalSubstring,
            replacement: rule.replacement,
            explanation: rule.explanation,
          });
        }
      }
    }

    // Sort by start position and deduplicate overlapping matches
    matches.sort((a, b) => a.start - b.start || b.stop - a.stop);
    const deduped: LexiconMatch[] = [];
    let lastStop = -1;

    for (const m of matches) {
      if (m.start >= lastStop) {
        deduped.push(m);
        lastStop = m.stop;
      }
    }

    return deduped;
  }
}

/**
 * Standard enterprise brand lexicon rules for Prometheus & Aster Watch
 */
export const DEFAULT_BRAND_LEXICON_RULES: LexiconRule[] = [
  // Forbidden superlatives & unsubstantiated claims
  {
    id: "LEX-001",
    pattern: "revolutionary",
    category: "forbidden_superlative",
    replacement: "innovative",
    explanation: 'Unsubstantiated superlative "revolutionary" violates Brand Guideline 3.2. Use "innovative" or cite specific performance metrics.',
    severity: "medium",
  },
  {
    id: "LEX-002",
    pattern: "unbreakable",
    category: "forbidden_superlative",
    replacement: "durable aerospace-grade",
    explanation: 'Absolute liability risk: claiming "unbreakable" violates legal warranty policy. Use "durable aerospace-grade".',
    severity: "high",
  },
  {
    id: "LEX-003",
    pattern: "100% bug-free",
    category: "compliance_risk",
    replacement: "extensively tested",
    explanation: 'Legally unverifiable claim "100% bug-free". Use "extensively tested".',
    severity: "high",
  },
  {
    id: "LEX-004",
    pattern: "world's best",
    category: "forbidden_superlative",
    replacement: "industry-leading",
    explanation: 'Subjective superlative "world\'s best" violates Advertising Standards. Use "industry-leading" or cite third-party benchmark.',
    severity: "high",
  },
  {
    id: "LEX-005",
    pattern: "cheap",
    category: "banned_buzzword",
    replacement: "accessible",
    explanation: 'Brand voice discourages "cheap" which dilutes premium perception. Use "accessible" or "cost-effective".',
    severity: "low",
  },
  {
    id: "LEX-006",
    pattern: "game-changer",
    category: "banned_buzzword",
    replacement: "significant advancement",
    explanation: 'Cliché corporate jargon "game-changer". Replace with concrete descriptive phrase.',
    severity: "low",
  },
  {
    id: "LEX-007",
    pattern: "bulletproof",
    category: "forbidden_superlative",
    replacement: "resilient",
    explanation: 'Metaphorical "bulletproof" is prohibited in technical product copy to prevent literal safety misinterpretation.',
    severity: "high",
  },
  {
    id: "LEX-008",
    pattern: "infinite battery",
    category: "compliance_risk",
    replacement: "extended battery life",
    explanation: 'False assertion of perpetual energy. Replace with verified battery runtime.',
    severity: "high",
  },

  // Trademark & capitalization rules
  {
    id: "LEX-CAP-001",
    pattern: "aster watch",
    category: "trademark_capitalization",
    replacement: "Aster Watch",
    explanation: 'Improper trademark casing: "aster watch" must be capitalized as "Aster Watch".',
    severity: "medium",
    caseSensitive: true,
  },
  {
    id: "LEX-CAP-002",
    pattern: "bluetooth",
    category: "trademark_capitalization",
    replacement: "Bluetooth®",
    explanation: 'Bluetooth SIG branding requirement: must be written as "Bluetooth®" with registered trademark symbol on first mention.',
    severity: "medium",
    caseSensitive: true,
  },
  {
    id: "LEX-CAP-003",
    pattern: "wifi",
    category: "trademark_capitalization",
    replacement: "Wi-Fi",
    explanation: 'Wi-Fi Alliance trademark guideline: write as hyphenated "Wi-Fi", not "wifi".',
    severity: "low",
    caseSensitive: true,
  },
  {
    id: "LEX-CAP-004",
    pattern: "gps",
    category: "trademark_capitalization",
    replacement: "GPS",
    explanation: 'Technical acronym must be capitalized as "GPS".',
    severity: "low",
    caseSensitive: true,
  },
  {
    id: "LEX-CAP-005",
    pattern: "ai",
    category: "trademark_capitalization",
    replacement: "AI",
    explanation: 'Technical acronym must be capitalized as "AI".',
    severity: "low",
    caseSensitive: true,
  },
];

export const defaultScanner = new AhoCorasickScanner(DEFAULT_BRAND_LEXICON_RULES);

