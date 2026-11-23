import { parse_date_cell } from "@/lib/workbook/date_parse";
import { major_text_to_sen } from "@/lib/workbook/money_parse";
import { classify_tng_direction } from "@/lib/tng/direction";
import { normalize_tng_type } from "@/lib/tng/normalize_type";
import type {
  ParsedTngDump,
  SkippedTngRecord,
  TngAccount,
  TngLedgerRow,
} from "@/lib/tng/types";

const DISCLAIMER = [
  "system generated email",
  "do not reply",
  "further enquiry",
  "operating hours",
  "including public holidays",
  "thank you.",
];

const RECORD_START =
  /^\d{1,2}\/\d{1,2}\/\d{4}\s+(Success|Pending|Failed)/i;

const AMOUNT_LINE = /RM\s?[\d,.]+\s+RM\s?[\d,.]+$/i;

const RM_PAIR = /RM\s?([\d,.]+)\s+RM\s?([\d,.]+)$/i;

function parse_dmy_to_iso(dmy: string): string {
  return parse_date_cell(dmy);
}

function parse_amounts(line: string): { amount_sen: number; balance_sen: number } {
  const match = line.match(RM_PAIR);
  if (!match) throw new Error("Amount line must contain two RM values");
  const amount_sen = major_text_to_sen(match[1].replace(/,/g, ""));
  const balance_sen = major_text_to_sen(match[2].replace(/,/g, ""));
  return { amount_sen, balance_sen };
}

function parse_header_line(line: string): {
  date_dmy: string;
  status: string;
  raw_type: string;
  reference: string;
} {
  const strict = line.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(Success|Pending|Failed)\s+(.*?)\s+(\S+)$/i,
  );
  if (strict) {
    return {
      date_dmy: strict[1],
      status: strict[2],
      raw_type: strict[3].trim(),
      reference: strict[4].trim(),
    };
  }
  const parts = line.split(/\s+/);
  if (parts.length < 3) throw new Error("Header line too short");
  return {
    date_dmy: parts[0],
    status: parts[1],
    raw_type: parts.slice(2, -1).join(" ") || "Unknown",
    reference: parts[parts.length - 1] ?? "",
  };
}

function build_description(inner_lines: string[]): string {
  const description_lines: string[] = [];
  for (const line of inner_lines) {
    const is_long_id = /\d{20,}/.test(line);
    const has_content = line.replace(/[^a-zA-Z]/g, "").length > 5;
    if (has_content && !is_long_id) {
      description_lines.push(line.replace(/\d{20,}/g, "").trim());
    }
  }
  return description_lines.join(" ").trim();
}

function split_records(raw: string): string[][] {
  const all_lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line && !DISCLAIMER.some((kw) => line.toLowerCase().includes(kw)),
    );

  if (all_lines.length && all_lines[0].toLowerCase().includes("date status")) {
    all_lines.shift();
  }

  const groups: string[][] = [];
  let current: string[] = [];

  for (let i = 0; i < all_lines.length; i++) {
    const line = all_lines[i];
    if (RECORD_START.test(line)) {
      if (current.length) groups.push(current);
      current = [line];
      continue;
    }
    if (
      /^\d{1,2}\/\d{1,2}\/\d{4}\s+(Success|Pending|Failed)\s+DUITNOW_\w+$/i.test(
        line,
      ) &&
      i + 1 < all_lines.length &&
      /^[A-Z0-9_]+$/i.test(all_lines[i + 1])
    ) {
      if (current.length) groups.push(current);
      current = [`${line} ${all_lines[i + 1]}`];
      i += 1;
      continue;
    }
    if (current.length) current.push(line);
  }
  if (current.length) groups.push(current);
  return groups;
}

function account_for_type(raw_type: string): TngAccount {
  return raw_type.toLowerCase().includes("go+ daily") ? "go_plus" : "wallet";
}

function assign_movement(
  normalized_type: string,
  raw_type: string,
  description: string,
  amount_sen: number,
  account: TngAccount,
  direction: ReturnType<typeof classify_tng_direction>,
): Pick<TngLedgerRow, "debit_sen" | "credit_sen" | "direction"> {
  const type = raw_type.toLowerCase();
  const desc = description.toLowerCase();

  if (account === "go_plus") {
    return {
      direction: "in",
      debit_sen: 0,
      credit_sen: amount_sen,
    };
  }

  if (type.includes("ewallet cash out")) {
    return { direction: "transfer", debit_sen: amount_sen, credit_sen: 0 };
  }

  if (direction === "transfer") {
    if (type.includes("go+ cash in")) {
      return { direction, debit_sen: amount_sen, credit_sen: 0 };
    }
    if (desc.includes("quick reload payment") || type.includes("go+ cash out")) {
      return { direction, debit_sen: 0, credit_sen: amount_sen };
    }
    if (normalized_type === "FPX") {
      return { direction, debit_sen: amount_sen, credit_sen: 0 };
    }
    return { direction, debit_sen: amount_sen, credit_sen: 0 };
  }

  if (direction === "in") {
    return { direction, debit_sen: 0, credit_sen: amount_sen };
  }
  return { direction, debit_sen: amount_sen, credit_sen: 0 };
}

export function parse_tng_dump(raw: string): ParsedTngDump {
  const groups = split_records(raw);
  const rows: TngLedgerRow[] = [];
  const skipped_records: SkippedTngRecord[] = [];
  let reconcile_warning_count = 0;

  let wallet_running: number | null = null;
  let go_running: number | null = null;

  groups.forEach((chunk, record_index) => {
    try {
      if (chunk.length < 2) {
        throw new Error("Record has fewer than 2 lines");
      }
      const last_line = chunk[chunk.length - 1];
      if (!AMOUNT_LINE.test(last_line)) {
        throw new Error("Missing RM amount line");
      }

      const header = parse_header_line(chunk[0]);
      const inner = chunk.slice(1, -1);
      const description =
        build_description(inner) || normalize_tng_type(header.raw_type, "");
      const normalized_type = normalize_tng_type(header.raw_type, description);
      const { amount_sen, balance_sen } = parse_amounts(last_line);
      const date = parse_dmy_to_iso(header.date_dmy);
      const account = account_for_type(header.raw_type);
      const direction = classify_tng_direction(header.raw_type, description);
      const movement = assign_movement(
        normalized_type,
        header.raw_type,
        description,
        amount_sen,
        account,
        direction,
      );

      let reconcile_ok = true;
      if (account === "wallet") {
        if (wallet_running !== null) {
          const expected =
            wallet_running - movement.debit_sen + movement.credit_sen;
          if (expected !== balance_sen) {
            reconcile_ok = false;
            reconcile_warning_count += 1;
          }
        }
        wallet_running = balance_sen;
      } else if (go_running !== null) {
        const expected = go_running + amount_sen;
        if (expected !== balance_sen) {
          reconcile_ok = false;
          reconcile_warning_count += 1;
        }
        go_running = balance_sen;
      } else {
        go_running = balance_sen;
      }

      rows.push({
        date,
        status: header.status,
        type: normalized_type,
        reference: header.reference,
        description,
        account,
        balance_sen,
        reconcile_ok,
        ...movement,
      });
    } catch (error) {
      skipped_records.push({
        record_index: record_index + 1,
        reason: error instanceof Error ? error.message : "Invalid record",
      });
    }
  });

  rows.sort((a, b) => a.date.localeCompare(b.date));

  const wallet_rows = rows.filter((r) => r.account === "wallet");
  const go_rows = rows.filter((r) => r.account === "go_plus");

  return {
    source: "data.txt",
    loaded_at: new Date().toISOString(),
    wallet_closing_sen: wallet_rows.at(-1)?.balance_sen ?? 0,
    go_plus_closing_sen: go_rows.at(-1)?.balance_sen ?? 0,
    rows,
    skipped_records,
    reconcile_warning_count,
  };
}