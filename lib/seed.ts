import { type DB, insert, transaction, withActor } from "./db";
import { addVersion, recordAudit, recordApproval } from "./review";
export function seed(db: DB) {
  return withActor(db, "Prometheus demo seed", () =>
    transaction(db, () => {
      if (db.prepare("SELECT 1 FROM campaign WHERE id='aster'").get()) return;
      insert(
        db,
        "INSERT INTO campaign VALUES(?,?,?)",
        "aster",
        "Aster Watch",
        "2026-11-20",
      );
      const battery = "up to 24 hours in standard mode",
        colours = "black and silver";
      for (const [id, variant, label, word] of [
        ["battery", "Aster Standard", "Battery life", battery],
        ["colours", "Aster Standard", "Case colours", colours],
        ["gps", "Aster Trail", "Positioning", "dual-band GPS"],
      ]) {
        insert(db, "INSERT INTO fact VALUES(?,?,?)", id, variant, label);
        addVersion(db, id, word, "2026-01-01");
      }
      for (const [id, name, channel, body] of [
        ["product", "Product page", "Web", battery],
        ["email", "Launch email", "Email", battery],
        ["poster", "Retail poster", "Print", colours],
      ]) {
        insert(
          db,
          "INSERT INTO asset VALUES(?,?,?,?,?)",
          id,
          "aster",
          name,
          "Aster Standard",
          channel,
        );
        const rev = insert(
          db,
          "INSERT INTO revision(asset,body) VALUES(?,?)",
          id,
          body + ".",
        );
        if (channel === "Print")
          insert(
            db,
            "INSERT INTO poster_style VALUES(?,?,?,?)",
            rev,
            "#ffffff",
            "#173b34",
            "solid",
          );
        recordApproval(db, recordAudit(db, rev, "2026-11-20"));
      }
    }),
  );
}
