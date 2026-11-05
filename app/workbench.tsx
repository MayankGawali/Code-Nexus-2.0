"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type {
  Finding,
  FactVersion,
  Asset,
  AssetRevision,
  AuditRun,
} from "../lib/models";
import {
  checkContrast,
  contrastRatio,
  hex,
  type PosterStyle,
} from "../lib/contrast";
import { Form, Submit } from "./form";
import { Hidden, Badge } from "./fields";
type Source = FactVersion & { sourceQuote: string | null; active: boolean };
type Claim = Finding & {
  sources: Source[];
  override: { reason: string; id: number } | null;
};
type Visual = {
  id: number;
  verdict: string;
  ratio: number | null;
  explanation: string;
  mode: string;
};
export type WorkbenchProps = {
  campaign: string;
  asset: Asset;
  revision: AssetRevision;
  audit: AuditRun | null;
  findings: Claim[];
  visual: Visual[];
  style: PosterStyle | null;
  day: string;
  fresh: boolean;
  ready: boolean;
  status: string;
  nonce: string;
};
export function Workbench(p: WorkbenchProps) {
  const { asset, revision, audit } = p,
    path = "/campaigns/" + p.campaign + "/" + asset.id;
  const [selection, setSelection] = useState<number | null>(
      p.findings[0]?.id ?? null,
    ),
    [tab, setTab] = useState<"facts" | "visual">("facts");
  const [foreground, setForeground] = useState(
      p.style?.foreground ?? "#ffffff",
    ),
    [background, setBackground] = useState(p.style?.background ?? "#173b34"),
    [kind, setKind] = useState<"solid" | "unsupported">(
      p.style?.kind ?? "solid",
    );
  const selected = p.findings.find((f) => f.id === selection),
    mark = useRef<HTMLElement>(null),
    cta = useRef<HTMLSpanElement>(null);
  const exact =
    selected &&
    revision.body.slice(selected.start, selected.stop) === selected.quote;
  const previewStyle: PosterStyle = { foreground, background, kind },
    contrast = checkContrast(previewStyle);
  function highlight(id: number) {
    setTab("facts");
    setSelection(id);
    requestAnimationFrame(() =>
      mark.current?.scrollIntoView({ block: "nearest", behavior: "instant" }),
    );
  }
  function inspectVisual() {
    setTab("visual");
    requestAnimationFrame(() =>
      cta.current?.scrollIntoView({ block: "nearest", behavior: "instant" }),
    );
  }
  const fields = {
    id: asset.id,
    expected: revision.id,
    request: p.nonce + ":edit",
  };
  return (
    <>
      <div className="review-toolbar">
        <div className="toolbar-status">
          <Badge value={p.status} />
          <small>Current revision R{revision.id}</small>
        </div>
        <Form path={path} className="date-form">
          <Hidden
            values={{
              action: "audit",
              id: asset.id,
              revision: revision.id,
              request: p.nonce + ":audit",
            }}
          />
          <label>
            Publication date
            <input type="date" name="day" required defaultValue={p.day} />
          </label>
          <Submit className="secondary">
            {audit ? "Re-audit" : "Run audit"}
          </Submit>
        </Form>
        <div className="approval-action">
          {p.status === "Approved" ? (
            <span className="approval-note">✓ Approved for {p.day}</span>
          ) : audit && p.ready ? (
            <Form path={path}>
              <Hidden values={{ action: "approve", audit: audit.id }} />
              <Submit>Approve revision</Submit>
            </Form>
          ) : (
            <span className="quiet">
              {audit
                ? "Resolve findings before approval"
                : "Run an audit before approval"}
            </span>
          )}
        </div>
      </div>
      {!p.fresh && audit && (
        <div className="notice">
          This audit is out of date. Its verifier or evidence has changed.
          Re-audit before accepting a correction, overriding a finding or
          approving.
        </div>
      )}
      <div className="workbench">
        <section className="draft-pane" aria-label="Asset draft">
          <div className="pane-heading">
            <h2>Draft</h2>
            <span className="mini-label">
              {asset.channel} · R{revision.id}
            </span>
          </div>
          <div
            className={
              "document " + (asset.channel === "Print" ? "poster-document" : "")
            }
          >
            <div className="document-chrome">
              <span aria-hidden="true">● ● ●</span>
              <span>
                {asset.channel === "Email"
                  ? "EMAIL / LAUNCH COPY"
                  : asset.channel === "Print"
                    ? "PRINT / STRUCTURED POSTER"
                    : "WEB / PRODUCT PAGE"}
              </span>
            </div>
            <div className="document-body">
              <p className="document-brand">
                ASTER<span>STANDARD</span>
              </p>
              <h2>
                {asset.channel === "Email"
                  ? "Meet Aster Watch."
                  : asset.channel === "Print"
                    ? "Aster, in your element."
                    : "Aster Watch"}
              </h2>
              {asset.channel !== "Email" && (
                <div className="watch-scene" aria-hidden="true">
                  <div className="watch">
                    <span>ASTER</span>
                    <b>12:24</b>
                    <i>STANDARD</i>
                  </div>
                  <div className="orbit" />
                </div>
              )}
              <p className="document-copy" data-testid="draft-copy">
                {exact && selected ? (
                  <>
                    {revision.body.slice(0, selected.start)}
                    <mark
                      ref={mark}
                      data-start={selected.start}
                      data-stop={selected.stop}
                      className={selected.supported ? "supported-mark" : ""}
                    >
                      {revision.body.slice(selected.start, selected.stop)}
                    </mark>
                    {revision.body.slice(selected.stop)}
                  </>
                ) : (
                  revision.body
                )}
              </p>
              {asset.channel === "Print" && (
                <div className="poster-cta-wrap">
                  <span
                    ref={cta}
                    id="poster-cta"
                    data-testid="poster-cta"
                    className={
                      "poster-cta " +
                      (tab === "visual" ? "element-selected" : "")
                    }
                    style={{
                      color: hex.test(foreground) ? foreground : undefined,
                      background:
                        kind === "solid" && hex.test(background)
                          ? background
                          : "repeating-linear-gradient(45deg,#e7e9ed,#e7e9ed 6px,#c9ced6 6px,#c9ced6 12px)",
                    }}
                  >
                    Discover Aster →
                  </span>
                  <small>
                    Printed CTA · 16px regular
                    {foreground !== p.style?.foreground ||
                    background !== p.style?.background ||
                    kind !== p.style?.kind
                      ? " · Unsaved appearance preview"
                      : ""}
                  </small>
                </div>
              )}
            </div>
          </div>
          <details className="editor card">
            <summary>
              <strong>Edit draft</strong>
              <span className="quiet">Creates a new revision</span>
            </summary>
            <Form path={path} className="stack">
              <Hidden values={{ ...fields, action: "revise" }} />
              <label>
                Revised copy
                <textarea
                  name="body"
                  defaultValue={revision.body}
                  required
                  maxLength={4000}
                  rows={6}
                />
              </label>
              <p className="quiet">
                Your saved revision is audited separately. An edit never carries
                an approval forward.
              </p>
              <Submit>Save revision</Submit>
            </Form>
          </details>
          <Link
            className="text-link"
            href={"/campaigns/" + p.campaign + "/history?asset=" + asset.id}
          >
            View all revisions & original evidence →
          </Link>
        </section>
        <aside
          className="evidence-pane"
          aria-label="Evidence and review actions"
        >
          <div className="pane-heading">
            <h2>Review checks</h2>
            <span className="mini-label">
              {audit ? "AUDIT #" + audit.id : "NOT AUDITED"}
            </span>
          </div>
          <div
            className="check-tabs"
            role="group"
            aria-label="Check categories"
          >
            <button
              type="button"
              aria-pressed={tab === "facts"}
              onClick={() => setTab("facts")}
            >
              Factual claims <span>{p.findings.length}</span>
            </button>
            {asset.channel === "Print" && (
              <button
                type="button"
                aria-pressed={tab === "visual"}
                onClick={inspectVisual}
              >
                Visual check <span>{p.visual.length}</span>
              </button>
            )}
          </div>
          {tab === "facts" ? (
            <>
              {!audit ? (
                <div className="empty card">
                  <h3>Ready for a fresh look.</h3>
                  <p>
                    No audit yet. Choose the publication date, then run an audit
                    to inspect evidence for this revision.
                  </p>
                </div>
              ) : (
                <>
                  <p className="quiet">
                    Select a claim to locate its exact wording in the draft.
                  </p>
                  <div className="finding-list">
                    {p.findings.map((f, index) => (
                      <button
                        className="finding-select"
                        type="button"
                        key={f.id}
                        aria-pressed={selection === f.id}
                        onClick={() => highlight(f.id)}
                      >
                        <span
                          className={
                            "finding-number " +
                            (f.supported ? "number-good" : "")
                          }
                        >
                          {index + 1}
                        </span>
                        <span>
                          <strong>{f.quote || "Empty draft"}</strong>
                          <span
                            className={
                              "verdict-text " +
                              (f.supported ? "text-good" : "text-warn")
                            }
                          >
                            {f.override
                              ? "Explicitly overridden"
                              : (f.verdict ??
                                (f.supported
                                  ? "Supported"
                                  : "Insufficient evidence"))}
                          </span>
                        </span>
                        <span aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                  {selected && (
                    <section
                      className="evidence-detail card"
                      aria-label="Selected claim evidence"
                    >
                      <div className="detail-heading">
                        <span className="mini-label">CLAIM EVIDENCE</span>
                        <Badge
                          value={
                            selected.verdict ??
                            (selected.supported
                              ? "Supported"
                              : "Insufficient evidence")
                          }
                        />
                      </div>
                      <h3>Original wording</h3>
                      <blockquote>{selected.quote || "(empty)"}</blockquote>
                      <small>
                        UTF-16 [{selected.start}, {selected.stop}) ·{" "}
                        {
                          {
                            battery_life: "Battery life",
                            colours: "Colours",
                            gps: "GPS",
                            unknown: "Unrecognised claim",
                          }[selected.extracted?.metric ?? "unknown"]
                        }
                      </small>
                      <p>
                        {selected.explanation ??
                          "Historical exact-phrase check. Original source links are preserved below."}
                      </p>
                      {!exact && (
                        <p className="notice">
                          The original span could not be located. Re-audit this
                          revision.
                        </p>
                      )}
                      <h3>Approved evidence</h3>
                      {selected.sources.length === 0 && (
                        <p className="quiet">
                          No applicable source was linked. Similar
                          specifications from other variants are not used.
                        </p>
                      )}
                      {selected.sources.map((source) => (
                        <div className="source-box" key={source.id}>
                          <span className="mini-label">
                            {source.fact} / V{source.id} ·{" "}
                            {source.active
                              ? "APPLICABLE"
                              : "NOT APPLICABLE AT THIS DATE"}
                          </span>
                          <blockquote>{source.wording}</blockquote>
                          <p>
                            Effective {source.start} →{" "}
                            {source.until ?? "open-ended"}
                            {source.until ? " (end exclusive)" : ""}
                          </p>
                          {source.sourceQuote && (
                            <details>
                              <summary>Original source quote</summary>
                              <blockquote
                                className="quote-scroll"
                                tabIndex={0}
                                aria-label="Full source quote"
                              >
                                {source.sourceQuote}
                              </blockquote>
                            </details>
                          )}
                        </div>
                      ))}
                      {selected.suggestion && (
                        <div className="proposal">
                          <h3>Proposed edit</h3>
                          <blockquote>{selected.suggestion}</blockquote>
                          <p className="quiet">
                            A proposal only. Accepting it saves a new revision
                            for review.
                          </p>
                          {p.fresh && (
                            <Form path={path}>
                              <Hidden
                                values={{
                                  action: "accept",
                                  finding: selected.id,
                                  expected: revision.id,
                                  request: p.nonce + ":accept:" + selected.id,
                                }}
                              />
                              <Submit>Accept suggested correction</Submit>
                            </Form>
                          )}
                        </div>
                      )}
                      {selected.override && (
                        <div className="notice">
                          <strong>
                            Override #{selected.override.id} · Local demo
                            reviewer
                          </strong>
                          <p>{selected.override.reason}</p>
                          <small>
                            Applies only to this finding, revision and evidence
                            context.
                          </small>
                        </div>
                      )}
                      {!selected.supported && !selected.override && p.fresh && (
                        <details className="override-editor">
                          <summary>Override this finding</summary>
                          <Form path={path} className="stack">
                            <Hidden
                              values={{
                                action: "override",
                                finding: selected.id,
                                request: p.nonce + ":override:" + selected.id,
                              }}
                            />
                            <label>
                              Override reason
                              <textarea
                                name="reason"
                                required
                                minLength={3}
                                maxLength={1000}
                              />
                            </label>
                            <p className="quiet">
                              This exception is recorded under Local demo
                              reviewer. It is never copied to another revision.
                            </p>
                            <Submit className="secondary">
                              Override finding
                            </Submit>
                          </Form>
                        </details>
                      )}
                    </section>
                  )}
                  <p className="engine-note">
                    Mode: {audit.mode} · Publication {audit.publication}
                    <br />
                    Deterministic local verification. No external provider.
                  </p>
                </>
              )}
            </>
          ) : (
            <section
              className="evidence-detail card"
              aria-label="Poster contrast check"
            >
              <span className="mini-label">VISUAL / NORMAL-SIZE CTA TEXT</span>
              <h3>Make the invitation readable.</h3>
              {p.visual.map((v) => (
                <div key={v.id} className="source-box">
                  <Badge value={v.verdict} />
                  <strong className="ratio">
                    {v.ratio === null
                      ? "Not measurable"
                      : v.ratio.toFixed(2) + ":1"}
                  </strong>
                  <p>{v.explanation}</p>
                  <small>Saved result · {v.mode}</small>
                </div>
              ))}
              {!p.visual.length && (
                <p>No saved visual check. Save the template or run an audit.</p>
              )}
              <button
                type="button"
                className="secondary"
                onClick={inspectVisual}
              >
                Highlight CTA element
              </button>
              <hr />
              <h3>Try a colour correction</h3>
              <p className="quiet">
                The live preview uses actual colour math. Save to create an
                immutable revision and measured audit.
              </p>
              <Form path={path} className="stack">
                <Hidden
                  values={{
                    action: "contrast",
                    id: asset.id,
                    expected: revision.id,
                    request: p.nonce + ":contrast",
                  }}
                />
                <label>
                  Text foreground
                  <input
                    name="foreground"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                    required
                    pattern="#[0-9A-Fa-f]{6}"
                    maxLength={7}
                  />
                </label>
                <label>
                  Background type
                  <select
                    name="kind"
                    value={kind}
                    onChange={(e) =>
                      setKind(e.target.value as "solid" | "unsupported")
                    }
                  >
                    <option value="solid">Solid colour</option>
                    <option value="unsupported">
                      Image or gradient — manual review
                    </option>
                  </select>
                </label>
                <label>
                  Background colour
                  <input
                    name="background"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    required
                    maxLength={200}
                  />
                </label>
                <div className="contrast-preview" aria-live="polite">
                  <span className="mini-label">UNSAVED CONTRAST PREVIEW</span>
                  <p>
                    <Badge value={contrast.verdict} />{" "}
                    <strong>
                      {contrast.ratio === null
                        ? "No reliable ratio"
                        : contrast.ratio.toFixed(2) + ":1"}
                    </strong>
                  </p>
                  <small>
                    {kind === "solid"
                      ? "Pass threshold: 4.5:1. The full-precision ratio decides the result."
                      : "Unsupported backgrounds require manual review."}
                  </small>
                </div>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    if (kind === "solid" && hex.test(background)) {
                      setForeground(
                        contrastRatio("#000000", background) >=
                          contrastRatio("#ffffff", background)
                          ? "#000000"
                          : "#ffffff",
                      );
                    } else {
                      setKind("solid");
                      setBackground("#ffffff");
                      setForeground("#17263a");
                    }
                  }}
                >
                  Try accessible colours
                </button>
                <Submit>Save contrast revision</Submit>
              </Form>
              <p className="quiet">
                This check covers the known solid CTA background only. It does
                not measure the entire poster.
              </p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
