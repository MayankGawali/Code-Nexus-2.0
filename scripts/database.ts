import { connect, migrate } from "../lib/db";
import { seed } from "../lib/seed";
const db = connect();
try {
  if (process.argv[2] === "migrate") migrate(db);
  else if (process.argv[2] === "seed") seed(db);
  else throw Error("Expected migrate or seed.");
  console.log(
    process.argv[2],
    db.prepare("SELECT count(*) AS campaigns FROM campaign").get(),
  );
} finally {
  db.close();
}
