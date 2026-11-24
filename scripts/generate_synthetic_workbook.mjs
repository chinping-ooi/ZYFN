/**
 * Synthetic Transaction.xlsx for dev/CI smoke tests — no real financial data.
 */
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "fixtures", "transaction_synthetic.xlsx");

const hlb = [
  ["Date", "Description", "Debit", "Credit", "Balance"],
  ["2026-01-01", "Opening Balance", "", "", "1000.00"],
  ["2026-01-02", "Synthetic debit A", "50.00", "", "950.00"],
  ["2026-01-03", "Synthetic credit B", "", "25.00", "975.00"],
];

const pbe = [
  [
    "Transaction Date",
    "Transaction Description",
    "Debit Amount",
    "Credit Amount",
    "Balance",
  ],
  ["2026-01-01", "Opening Balance", "", "", "2000.00"],
  ["2026-01-02", "Synthetic debit C", "100.00", "", "1900.00"],
  ["2026-01-03", "Synthetic credit D", "", "200.00", "2100.00"],
];

mkdirSync(dirname(out), { recursive: true });

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hlb), "HLB");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pbe), "PBE");
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([["ignored"]]),
  "PBE 6-11",
);
XLSX.writeFile(wb, out);

console.log("Wrote", out);