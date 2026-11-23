import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = process.argv[2] ?? join(root, "fixtures", "data_synthetic.txt");

const { parse_tng_dump } = await import("../lib/tng/parse_dump.ts");

const raw = readFileSync(fixture, "utf8");
const dump = parse_tng_dump(raw);

const skip_reasons = new Map();
for (const s of dump.skipped_records) {
  skip_reasons.set(s.reason, (skip_reasons.get(s.reason) ?? 0) + 1);
}

const warn_accounts = new Map();
for (const w of dump.reconcile_warnings) {
  const key = `${w.account}: ${w.reason.split(" ")[0]}`;
  warn_accounts.set(key, (warn_accounts.get(key) ?? 0) + 1);
}

console.log(
  JSON.stringify(
    {
      fixture,
      rows: dump.rows.length,
      skipped: dump.skipped_records.length,
      skip_reasons: Object.fromEntries(skip_reasons),
      reconcile_warnings: dump.reconcile_warning_count,
      warning_categories: Object.fromEntries(warn_accounts),
      pending_failed_kept: dump.rows.filter((r) => !r.affects_totals).length,
    },
    null,
    2,
  ),
);