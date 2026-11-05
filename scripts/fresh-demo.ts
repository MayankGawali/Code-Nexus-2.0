import { relative } from "node:path";
import { createFreshDemo } from "../lib/demo";
const path = createFreshDemo(process.argv[2] ?? "");
console.log(
  "Created isolated fictional demo: " + relative(process.cwd(), path),
);
console.log("No existing database was reset or overwritten.");
console.log(
  "PowerShell: $env:PROMETHEUS_DB='" +
    relative(process.cwd(), path).replaceAll("\\", "/") +
    "'",
);
console.log("Then: npm run dev (or npm run build, then npm start)");
