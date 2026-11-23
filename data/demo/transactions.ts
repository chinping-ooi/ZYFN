import type { BankTransaction, MonthKey } from "@/data/types";
import { major_to_minor } from "@/lib/money";

type TransactionSeed = {
  day: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
};

const MAYBANK: TransactionSeed[] = [
  { day: "02", reference: "MBB-SAL", description: "Salary credit", debit: 0, credit: 5800 },
  { day: "05", reference: "MBB-TRF", description: "Transfer to Public Bank", debit: 1000, credit: 0 },
  { day: "12", reference: "MBB-BILL", description: "Utility payment", debit: 180, credit: 0 },
];

const PUBLIC_BANK: TransactionSeed[] = [
  { day: "05", reference: "PBB-TRF", description: "Transfer from Maybank", debit: 0, credit: 1000 },
  { day: "08", reference: "PBB-RENT", description: "Rental payment", debit: 1200, credit: 0 },
  { day: "15", reference: "PBB-PAY", description: "Online payment", debit: 125, credit: 0 },
];

const TNG: TransactionSeed[] = [
  { day: "03", reference: "TNG-RLD", description: "Wallet reload", debit: 0, credit: 300 },
  { day: "09", reference: "TNG-QR", description: "DuitNow QR payment", debit: 45, credit: 0 },
  { day: "18", reference: "TNG-RFID", description: "RFID toll payment", debit: 12.5, credit: 0 },
];

const HLB: TransactionSeed[] = [
  { day: "01", reference: "HLB-SAL", description: "Inbound transfer", debit: 0, credit: 2500 },
  { day: "07", reference: "HLB-ATM", description: "ATM withdrawal", debit: 200, credit: 0 },
  { day: "14", reference: "HLB-BILL", description: "Card payment", debit: 89.5, credit: 0 },
  { day: "22", reference: "HLB-INT", description: "Interest credit", debit: 0, credit: 12.35 },
];

function month_prefix(month: MonthKey): string {
  return month === "2026-11" ? "2026-11" : "2026-10";
}

function build_rows(seeds: TransactionSeed[], month: MonthKey): Omit<BankTransaction, "balance_sen">[] {
  return seeds.map((row) => ({
    date: `${month_prefix(month)}-${row.day}`,
    reference: row.reference,
    description: row.description,
    debit_sen: major_to_minor(row.debit),
    credit_sen: major_to_minor(row.credit),
  }));
}

export type StatementAccountKey =
  | "maybank"
  | "public_bank"
  | "hong_leong"
  | "tng";

export function demo_statement_rows(
  account: StatementAccountKey,
  month: MonthKey,
): Omit<BankTransaction, "balance_sen">[] {
  switch (account) {
    case "maybank":
      return build_rows(MAYBANK, month);
    case "public_bank":
      return build_rows(PUBLIC_BANK, month);
    case "tng":
      return build_rows(TNG, month);
    case "hong_leong":
      return build_rows(HLB, month);
  }
}

export function statement_closing_balance_index(account: StatementAccountKey): number {
  switch (account) {
    case "maybank":
      return 0;
    case "public_bank":
      return 1;
    case "hong_leong":
      return 2;
    case "tng":
      return 3;
  }
}