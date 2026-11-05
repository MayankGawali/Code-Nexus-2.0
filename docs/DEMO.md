# Three-minute live demo

All names, product specifications and source quotes are fictional. Run in **local-watch-v2**; do not claim an LLM, general semantic understanding or real-world accuracy.

## Before the clock

Follow the README from a fresh named database. Confirm the three assets are Approved. Set each asset's publication date to **2027-02-01**, choose Re-audit, then Approve revision. These are real saved actions, not fixture status changes. Leave Overview open and a second email tab ready.

## 0:00–0:20 · What is approved?

Show the three assets and their selected dates. Explain: “An approval belongs to this revision, this publication date and these evidence versions. Changing a source keeps the old decision in history.”

## 0:20–0:55 · Let the judge change the input

Offer **one unscripted action**: choose a replacement battery value, or type a new email claim later. If they choose the claim, use 17 as the replacement value. Otherwise let them choose any positive whole number, for example 14 or 31. Call the chosen value **X**.

In Fact registry → Battery life enter:
- New wording: `up to X hours in standard mode`
- Effective from: `2027-02-01`
- Source quote: `Fictional Aster Standard benchmark: up to X hours in standard mode`
- Reason: `Live fictional specification update`

Choose Preview impact. Point at the two battery assets; the poster has no battery dependency. Publish.

The preview and saved verdicts must reflect X. If X is lower than 24 the old maximum conflicts; if higher, the old exact runtime lacks approval; if equal, the wording can remain Supported but the old approval still cited the superseded version. Do not promise a predetermined red verdict.

## 0:55–1:25 · Evidence, not a plausible number

Open Launch email. Select its finding; show the exact highlighted text and the newly cited version. Enter `Up to X hours with GPS enabled`, save, re-audit. It still needs review because standard-mode evidence does not support GPS operation.

If the judge chose to type a new claim, let them replace this line instead. Run the audit. Read the actual verdict: unfamiliar wording may correctly require manual review rather than pass.

## 1:25–2:00 · Finish the review explicitly

Edit to `Up to X hours in standard mode`, save and re-audit. It should be Supported. Choose Approve revision, reload, then open Revision history filtered to the email. Show the new decision, old wording, original sources and local demo reviewer identity.

## 2:00–2:45 · The independent poster check

Confirm Retail poster stayed Approved through the battery change. Open Visual check. Set foreground `#777777`, solid background `#ffffff`. The measured ratio is approximately 4.48:1, below the configured 4.5:1 threshold. Save contrast revision; approval is blocked.

Choose Try accessible colours, save the corrected revision and explicitly approve. The same black-on-white correction computes 21:1. Image/gradient backgrounds are labelled Needs manual review; no guessed ratio is shown.

## 2:45–3:00 · Honest close

“We demonstrated versioned evidence and human decisions, plus one structured-template contrast check. This is a local, bounded verifier, not an autonomous compliance authority.”

Optionally show the automated stale-tab approval test result. Do not spend the three-minute clock staging a race manually.

## Recovery card

- **Unknown claim:** leave Needs manual review, or copy the exact approved source wording, save and re-audit. Never call a skipped check a pass.
- **Stale tab/preview:** reload current data; review the changes and generate a fresh preview. Do not resubmit a different draft with the old token.
- **Optional AI outage:** none is configured. Stay on local-watch-v2; no credentials or external calls are needed. A hypothetical provider's failure must not be presented as a successful AI check.
- **Port/file lock:** Ctrl+C the terminal serving this repository. Stop dev before production/install. Use `-- --port 4000` if another app owns 3000.
- **Need a clean rehearsal:** stop the server, run `npm run demo:fresh -- judge-recovery-2`, select the printed database path, then start again. This creates new demo data and preserves the previous workspace.
