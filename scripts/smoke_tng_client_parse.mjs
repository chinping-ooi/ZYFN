/**
 * Client-parse parity: same entry as a future import UI (`parse_tng_text`).
 * Uses embedded synthetic dump — no committed bank fixtures.
 */
const { parse_tng_text } = await import("../lib/tng/import/parse_text.ts");

/** Minimal TNG export shape for smoke (labels only, not real data). */
const SYNTHETIC_DUMP = `Date Status Type Reference
15/01/2026 Success Reload SYN001
Synthetic wallet reload for tests only
RM 50.00 RM 150.00
16/01/2026 Success Payment SYN002
Synthetic merchant payment
RM 12.50 RM 137.50
`;

const dump = parse_tng_text(SYNTHETIC_DUMP);

if (dump.skipped_records.length !== 0) {
  console.error(
    `FAIL: expected 0 skipped, got ${dump.skipped_records.length}`,
  );
  process.exit(1);
}
if (dump.rows.length < 1) {
  console.error("FAIL: expected rows from synthetic dump");
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    rows: dump.rows.length,
    skipped: dump.skipped_records.length,
  }),
);