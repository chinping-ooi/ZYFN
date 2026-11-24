/**
 * Client-parse parity: same entry as the browser (`parse_tng_text`).
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = join(root, "fixtures", "data_synthetic.txt");

const { parse_tng_text } = await import("../lib/tng/parse_text.ts");

const raw = readFileSync(fixture, "utf8");
const dump = parse_tng_text(raw);

if (dump.skipped_records.length !== 0) {
  console.error(
    `FAIL: expected 0 skipped, got ${dump.skipped_records.length}`,
  );
  process.exit(1);
}
if (dump.rows.length < 1) {
  console.error("FAIL: expected rows from synthetic fixture");
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    rows: dump.rows.length,
    skipped: dump.skipped_records.length,
  }),
);