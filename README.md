# Code-Nexus-2.0
Hackathon winning repo

# Prometheus review desk

A single-reviewer workspace for the fictional Aster Watch launch. Product facts, revisions, audit findings and approvals live in local SQLite. The demo uses no accounts, API keys, hosted fonts or external services.

## Start locally

Use Node 24.14 or newer in the 24.x line and npm. From the repository root:

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://127.0.0.1:3000. Migration and seeding are repeatable; seeding never resets an edited campaign. The default database is `data/prometheus.sqlite`. Set `PROMETHEUS_DB` to a different file before migrating to create an independent workspace. Stop the server before copying a database and its WAL files. Package and browser installation require internet access; the seeded app runs locally afterwards.

## Try a fact change

1. Open **Aster Watch**. Its three assets are approved for publication on **2026-11-20**.
2. Under **Fact registry → Battery life**, publish “up to 18 hours in standard mode” effective **2026-11-20**. The product page and email now need review. The poster only cites the case colours, so its approval is still current.
3. Open the product page. Its ledger shows the historical approval, the exact quote, its character offsets and its cited version. Run an audit for **2026-11-19**, then for **2026-11-20**, to see the validity boundary.
4. Choose **Correct claim**, replace the old wording with the new wording, save, audit for **2026-11-20**, then approve the revision. The prior decision stays in the ledger.

The campaign list of assets shows readiness for the campaign's planned publication date. An approval for another date appears in history but cannot clear that date's review requirement.

## Verify

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm start
```

Playwright runs the production build on port 3198 against a separate temporary database. `npm start` serves the production app on port 3000.

## How it works

- `migrations/` and `lib/db.ts`: numbered transactional migrations and a SQLite query layer that validates typed rows with Zod.
- `lib/models.ts`, `lib/review.ts`: date-only validity, variant-scoped audits, evidence and approval rules. A transition closes the previous open interval by appending a boundary and inserts the successor in the same transaction. Version content and review history cannot be updated or deleted.
- `lib/seed.ts`: one fictional campaign, three assets, two Aster Standard facts and an independent Aster Trail GPS fact.
- `app/`: server-rendered campaign list, registry, revision editor and evidence ledger. Form actions validate input through the domain layer.
- `tests/` and `e2e/`: domain/database tests and a browser test covering the full review loop.

The audit engine deliberately uses a conservative rule: each sentence or line must exactly match one approved phrase for that variant and date, ignoring case and surrounding whitespace. Unsupported prose needs a human edit. Spans use zero-based, end-exclusive JavaScript string offsets. The poster is reviewed as text; there is no OCR, semantic paraphrase matching, authentication or multi-user workflow.
