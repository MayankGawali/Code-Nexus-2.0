# Prometheus · Code-Nexus-2.0

A local reviewer workbench for the **fictional Aster Watch** campaign. Approved facts, immutable revisions, dated audits, evidence links and human decisions are stored in SQLite. No account, API key or AI provider is required. Installation downloads packages; the running demo uses only localhost.

## Start a fresh rehearsal (PowerShell)

Use **Node 24.14–24.x** and npm. Stop previous Prometheus servers with Ctrl+C before installing; Windows locks Next's native module while a server is running.

```powershell
npm ci
$env:PROMETHEUS_DB = "data/demo-release.sqlite"
$env:NEXT_TELEMETRY_DISABLED = "1"
npm run db:migrate
npm run db:seed
npm run dev
```

Open **http://127.0.0.1:3000/campaigns/aster**. The seed has three approved assets. Seed is idempotent: it does **not** undo previous edits. In an empty workspace, the landing page also offers **Load Aster Watch demo**.

For production, stop dev with Ctrl+C and keep the same database environment variable:

```powershell
npm run build
npm start
```

If port 3000 is occupied, append `-- --port 4000` to dev/start and use that port. On macOS/Linux use `export PROMETHEUS_DB=data/demo-release.sqlite` and `export NEXT_TELEMETRY_DISABLED=1` instead of the PowerShell assignments.

## Reset safely: create another isolated demo

```powershell
npm run demo:fresh -- judge-two
$env:PROMETHEUS_DB = "data/demo-judge-two.sqlite"
npm start
```

Stop the old server first. This command only creates a new `data/demo-<name>.sqlite` containing fictional seed data and a demo marker. It refuses existing files and path traversal. It never deletes records, overwrites a database, or resets the default workspace. Choose a new name for each rehearsal. The original database and history remain intact.

## Judge journey

Use the tabs: **Overview → Fact registry → Asset review → Revision history**.

Change Battery life with a source quote, effective date and reason. **Preview impact** before publishing. Only dependent battery assets need another review; the colour-only poster stays approved. Select a finding to highlight its exact occurrence. A correct number with the wrong GPS condition remains unresolved. Save the complete correction, run an audit and explicitly approve; edits never inherit approvals. Reopen history to inspect old evidence and decisions.

For the February boundary rehearsal, first select **2027-02-01** and re-audit/approve each asset. Then publish a replacement effective **2027-02-01**. Earlier dated approvals remain in history. See the [three-minute demo script](docs/DEMO.md).

## Release checks

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm test
npm run eval -- --output evaluation/release-results.json
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright uses separate temporary SQLite files, production servers on ports 3198/3199/3200, and a dev-startup check on port 3000 (stop your manual server first). It exercises desktop/mobile review and poster contrast, plus the seeded judge journey and a stale approval attempt. To rehearse another live value: set $env:JUDGE_BATTERY_HOURS="29" and run npm run test:e2e -- --project=judge --output test-results-alternate; unset it afterwards. Screenshots/traces are in `test-results`. Unit/integration tests and browser tests do not reset your workspace.

The [synthetic evaluation](evaluation/README.md) reports correct verdicts, clean-claim false alarms, missed issues and invalid citations. It is a small development evaluation, not a claim about real-world accuracy.

## Honest limits and recovery

- `local-watch-v2` supports a bounded watch grammar with positive, safely representable whole-number hours, not arbitrary marketing copy. Unknown paraphrases, uncertain extraction and incomplete checks require manual review.
- Facts apply to date-only, half-open intervals [from, to). Retrieval stays within the asset variant. Source quotes and reasons are reviewer-supplied provenance; their truth is not independently authenticated.
- Approvals are bound to an audit, revision, publication date and evidence context. Overrides require reasons and do not transfer to later revisions. Explicit overrides are human exceptions, not verifier-supported claims.
- The poster check measures only the known **16px CTA foreground and solid background**. It is not OCR, palette validation, image analysis or a complete accessibility audit. Unsupported backgrounds require manual review.
- Local demo identity only; no authentication, role enforcement or production multi-user guarantees. Re-audits are synchronous; comparisons use claim position; previews expire conservatively.
- Legacy records with missing original actors/timestamps are labelled as such. Previous decisions remain historical records even when evidence is stale. Audits from retired verifier modes require re-audit and explicit approval under the current mode.
- **No optional AI provider is integrated or needed.** A provider outage cannot affect this release's local mode. Never describe its results as model-generated. If a claim cannot be interpreted, keep the manual-review result or edit to approved wording and re-audit.
- On a stale-edit/preview error, reload the current record and regenerate the preview; do not bypass the check. If a rehearsal goes off track, use the explicit new-demo command above.

Detailed implementation notes: [architecture and earlier workflow notes](docs/ARCHITECTURE.md).


Release evidence: [measured checks and non-blocking issues](docs/RELEASE.md). The production dependency audit reported zero advisories; the full tree reported 10 moderate development-tool advisories through minimatch. These remain disclosed rather than applying an unreviewed force/downgrade fix.
