# Synthetic release evaluation

This is a **35-case synthetic development evaluation**, labelled before the release fixes and stored separately from the implementation's unit-test examples. It uses fictional watch facts with 28/21/12-hour specifications rather than the demo's 24/18-hour examples. Labels express intended semantic support, including clean paraphrases outside the bounded grammar.

This set was used to diagnose release defects; it is **not** a held-out benchmark, a real marketing dataset, or evidence of real-world accuracy. No model baseline is configured or compared.

Run:

```sh
npm run eval -- --output evaluation/release-results.json
```

The runner records every input, expected and actual verdict, extracted spans and source IDs. Whole-draft aggregation gives manual review precedence, then contradiction, then insufficient evidence, and passes only if every result is Supported.

Metrics:
- Correct verdicts: exact agreement with the labelled whole-draft verdict.
- False alarms on clean claims: expected Supported but actual not Supported, including manual-review false alarms.
- Missed issues: expected non-Supported but actual Supported.
- Invalid citations: linked source does not exist, belongs to another asset/claim variant or metric, is inactive at publication, or explicitly names a variant conflicting with its registry metadata.
- Invalid spans / unsupported passes: quote-offset mismatch / Supported without an evidence link.
- The command fails for missed issues, invalid citations, invalid spans or unsupported passes. It reports conservative verdict failures without hiding or relabelling them.

The final measured counts and examples are in release-results.json. Remaining failures include natural-language paraphrases, spelled-out numbers, unit abbreviations, decorative prefixes and decimal quantities. Manual review is safer than a false pass but still counts as a false alarm on a clean claim. A decimal overclaim may be blocked yet receive the less specific manual-review verdict instead of Contradicted.

The pre-fix local run is retained in before-release-fixes.json for release traceability. It is not an AI/model baseline.
