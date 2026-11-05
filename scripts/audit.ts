import { z } from "zod";
import { connect } from "../lib/db";
import {
  auditRevision,
  revisions,
  findings,
  sources,
  audits,
} from "../lib/review";
const db = connect();
try {
  const asset = z.string().min(1).parse(process.argv[2]);
  const day = z.iso.date().parse(process.argv[3]);
  const revision = revisions(db, asset)[0];
  if (!revision) throw Error("Asset has no revision.");
  const id = auditRevision(db, revision.id, day);
  console.log(
    JSON.stringify(
      {
        audit: audits(db, revision.id).find((a) => a.id === id),
        findings: findings(db, id).map((f) => ({
          ...f,
          evidence: sources(db, f.id),
        })),
      },
      null,
      2,
    ),
  );
} finally {
  db.close();
}
