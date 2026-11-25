/**
 * Parse a local TNG statement text file and print row/skip/reconcile stats.
 * Usage: npx tsx scripts/report_tng_parse.mjs [path/to/data.txt] [--diagnose]
 * Does not read .env.local; pass an explicit path to your private export.
 */
import { readFileSync, existsSync } from "fs";
const argv = process.argv.slice(2);
const diagnose = argv.includes("--diagnose");
const path_args = argv.filter((a) => a !== "--diagnose");

const { parse_tng_dump } = await import("../lib/tng/parse_dump.ts");

function usage() {
  console.error(
    "Usage: npx tsx scripts/report_tng_parse.mjs <path-to-tng-export.txt> [--diagnose]",
  );
  process.exit(2);
}

const fixture = path_args[0];
if (!fixture) usage();
if (!existsSync(fixture)) {
  console.error(`File not found: ${fixture}`);
  process.exit(1);
}

const raw = readFileSync(fixture, "utf8");
const dump = parse_tng_dump(raw);

const skip_reasons = new Map();
for (const s of dump.skipped_records) {
  skip_reasons.set(s.reason, (skip_reasons.get(s.reason) ?? 0) + 1);
}

const warn_accounts = new Map();
for (const w of dump.reconcile_warnings) {
  const key = `${w.account}: ${w.type}`;
  warn_accounts.set(key, (warn_accounts.get(key) ?? 0) + 1);
}

function aggregate_diagnose(warnings) {
  const buckets = new Map();
  for (const w of warnings) {
    const key = [
      `ledger=${w.account}`,
      `type=${w.type}`,
      `status=${w.status}`,
      `first_of_day=${w.first_of_day_in_ledger}`,
      `sign=${w.mismatch_sign}`,
      `eq_amount=${w.matches_amount}`,
      `eq_2x=${w.matches_2x_amount}`,
      `eq_prev_amt=${w.matches_prev_row_amount}`,
    ].join("|");
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...buckets.entries()].sort((a, b) => b[1] - a[1]),
  );
}

const base = {
  fixture,
  dump_chronology: dump.dump_chronology,
  rows: dump.rows.length,
  skipped: dump.skipped_records.length,
  skip_reasons: Object.fromEntries(skip_reasons),
  reconcile_warnings: dump.reconcile_warning_count,
  warning_categories: Object.fromEntries(warn_accounts),
  pending_failed_kept: dump.rows.filter((r) => !r.affects_totals).length,
};

if (diagnose) {
  console.log(
    JSON.stringify(
      {
        ...base,
        diagnose: aggregate_diagnose(dump.reconcile_warnings),
      },
      null,
      2,
    ),
  );
} else {
  console.log(JSON.stringify(base, null, 2));
}