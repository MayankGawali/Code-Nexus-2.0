# Release rehearsal — 6 November 2026

Scope: local fictional hackathon demo, not a public multi-user production service.

Environment: Windows, Node 24.20.0, npm 11.19.0, Next.js 16.4.5. All checks ran in the current repository. Browser data used isolated temporary SQLite files; manual README startup used a newly created data/demo-release.sqlite. Existing workspaces were not reset.

## Commands actually run

| Check | Result |
|---|---|
| npm ci (final lockfile) | Passed; initial attempt hit a Windows native-module lock, resolved by stopping prior demo servers |
| npm run db:migrate | Passed against an empty rehearsal database |
| npm run db:seed, twice | Passed; one campaign, three assets, three decisions, no duplicate seed entities |
| npm run dev | Started on 127.0.0.1:3000; campaign and email evidence returned HTTP 200 |
| npm run lint | Passed, zero warnings (ESLint + TypeScript ESLint) |
| npm run typecheck | Passed |
| npm run test:unit | 37 passed |
| npm run test:integration | 11 passed, including real temporary SQLite files and two independent connections |
| npm test | 48 passed |
| npm run eval -- --output evaluation/release-results.json | Completed; safety gates passed; exact-verdict failures are reported below |
| npm run build | Passed production compilation and type validation |
| npm run test:e2e | 4 passed: desktop, mobile, seeded judge journey and dev-startup smoke |
| JUDGE_BATTERY_HOURS=29 with judge project | 1 additional judge journey passed |
| npm start | Verified by production browser projects; final rehearsal server uses the README database on port 3000 |
| npm run demo:fresh -- release-recovery-check | Created a new isolated fictional database without touching the original |
| npm audit --omit=dev | Zero reported advisories |
| Full npm audit | 10 moderate development-tool dependency advisories; no high/critical reported |

The manual dev process was stopped with Ctrl+C before production testing. Both dev and production browser servers ran with empty AI API key variables and rejected external HTTP requests.

## Live judge proof

The judge test starts from the seeded three approvals, selects publication 2027-02-01 through application actions, publishes a new battery fact effective that day, and verifies exactly two affected approvals. The email highlights the original occurrence and cites the new source. A matching number with GPS enabled remains unresolved. The complete correction requires explicit approval and survives reload with history.

The untouched poster stays approved after the battery change. A separate saved contrast edit fails at approximately 4.48:1; an accessible correction passes and requires a new approval. A stale tab's captured approval request is rejected after another tab creates a new revision.

Replacement **17** produces Contradicted for the old 24-hour claim; replacement **29** produces Insufficient evidence. Both runs pass the complete journey, demonstrating that results come from the newly entered source rather than a fixed 18-hour response.

## Synthetic evaluation — not real-world accuracy

Assistant-authored expected labels; no independent human raters, model baseline or real-world marketing sample. The 35-case set was specified before the fixes and used as a development evaluation, not a held-out benchmark.

| Metric | Measured |
|---|---:|
| Correct exact verdicts | 29 / 35 |
| Clean claims | 15 |
| False alarms on clean claims | 5 / 15 |
| Issue / ambiguous claims | 20 |
| Missed issues (incorrect Supported) | 0 / 20 |
| Invalid citations | 0 / 20 examined links |
| Invalid quote spans | 0 |
| Supported without an evidence link | 0 |

Remaining failures:
- “Battery life reaches a maximum of 28 hours in standard mode.” is semantically clean but gets Needs manual review.
- “Up to twenty-eight hours in standard mode.” and “Up to 28h in standard mode.” also require manual review.
- “Available in silver and black.” and a decorative watch-symbol prefix are additional clean-claim false alarms.
- “Up to 28.5 hours in standard mode” should be Contradicted against 28, but gets the less specific Needs manual review. It is blocked, not passed.

Every input, verdict, finding and evidence ID is saved in evaluation/release-results.json. Dataset SHA-256: 1c57479d6f8ff4727b90402c719ad5ed01f6512bfd0ca8b4f9dfe401e037224d.

## Release fixes

- Reject explicit variant switching and contradictory source-variant metadata.
- Keep questions and unsupported decimal quantities intact instead of silently converting them into supported statements or invented integer fragments.
- Fail closed on quantities not safely representable as positive integers.
- Support approved colour subsets/reordering without false alarms.
- Give stale approval attempts an explicit reload-and-recovery path, verified in both judge runs.
- Record local-watch-v2 on new audits. Older verifier modes cannot clear current approval; their original decisions remain in history.
- Add safe fresh-demo creation, lint and separated test commands, a locked compatible lint toolchain, and reliable browser waits for filtered history navigation.
- Remove the unsubstantiated “hackathon winning” repository tagline and accurately label synthetic evaluation authorship.

## Remaining blockers / limitations

**No unresolved blocker was found for the scoped local demo.** All requested check categories ran. No optional AI provider was available or needed, so no model comparison or provider-timeout experiment is claimed.

Non-blocking disclosures:
- The full dependency tree reports 10 moderate advisories through development tooling/minimatch. Runtime-only audit is clean. Broad forced downgrades or cross-major overrides were not applied merely to suppress the audit.
- Paraphrases, decimal quantities and unfamiliar wording frequently require manual review. This is bounded verification, not a semantic compliance guarantee.
- Source quotes are reviewer-provided, not authenticated facts. Overrides are explicit human exceptions.
- Contrast covers only the normal-size solid-background CTA, not OCR, palette compliance, images or a full accessibility audit.
- Local demo identity only; no authentication/roles or public production deployment clearance. Re-audits are synchronous and preview invalidation is conservative.
