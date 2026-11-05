# Architecture

Next.js App Router renders four workbench views and server actions. Domain code in lib is independent of React. SQLite queries use bound inputs and Zod row validation. Numbered SQL migrations run transactionally.

Campaign and Asset own immutable AssetRevision records. Facts own immutable FactVersion content; append-only closure records supply end-exclusive validity boundaries. Database triggers reject updates/deletes of historical revisions, evidence, audits and decisions.

Audits persist the exact revision, publication date, verifier mode, original quote, zero-based UTF-16 [start, stop) offsets, parsed claim fields, verdict, explanation and evidence links. Supported claims retain links for later impact analysis. Sources must match the asset variant and publication date.

Publishing a saved impact preview checks its workspace fingerprint under BEGIN IMMEDIATE, closes the prior fact interval, inserts the successor and provenance, and re-audits affected current revisions in one transaction. Dependency links identify supported claims; matching product/metric also reopens unresolved claims. Earlier publication dates retain their applicable evidence.

Revision saves check the expected revision and use request tokens. A repeated identical request returns the original result; token reuse with changed content is rejected. Accepting a proposal replaces only its quoted span and creates a new revision.

Approvals require the current revision, a fresh evidence context, passing visual checks where applicable, and all factual checks supported or explicitly overridden. Overrides are immutable and bound to one finding, revision, audit and evidence fingerprint. No exception transfers automatically to another audit or revision. An identical approval retry returns the original decision; a new approval for an obsolete revision is rejected.

Poster styling is immutable per revision. Visual findings are separate from factual findings. The saved check measures sRGB relative luminance with the 0.04045 transfer-function threshold and evaluates the unrounded ratio against 4.5:1 for a normal-size 16px CTA. Unknown/image/gradient backgrounds receive no numerical pass. Older template measurements are explicitly labelled as migration checks.

History records the local demo reviewer, demo seeder or deterministic verifier. Missing historical identities and times are never invented. Imported timestamps are labelled as import times.

The verifier is a bounded local grammar. Battery claims use whole-number hours, qualifiers and operating conditions; colour claims use approved colour subsets; GPS wording is variant-scoped. Questions, unknown wording, contradictory registry scope and ambiguous evidence fail closed. No model/provider is integrated.
