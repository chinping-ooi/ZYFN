import type { FixedDepositRecord } from "@/data/types";
import { major_to_minor } from "@/lib/money";

/** Sample fixed deposits — swap this module for database/API later. */
export const DEMO_DEPOSITS: FixedDepositRecord[] = [
  {
    bank: "Maybank",
    ref: "MBB-001",
    principal_sen: major_to_minor(20000),
    rate_bps: 365,
    tenure_months: 6,
    placed_iso: "2026-05-28",
    maturity_iso: "2026-11-28",
    due: true,
  },
  {
    bank: "Public Bank",
    ref: "PBB-001",
    principal_sen: major_to_minor(15000),
    rate_bps: 380,
    tenure_months: 12,
    placed_iso: "2026-01-15",
    maturity_iso: "2027-01-15",
  },
  {
    bank: "Maybank",
    ref: "MBB-002",
    principal_sen: major_to_minor(10000),
    rate_bps: 350,
    tenure_months: 3,
    placed_iso: "2026-10-10",
    maturity_iso: "2027-01-10",
  },
  {
    bank: "Public Bank",
    ref: "PBB-002",
    principal_sen: major_to_minor(5000),
    rate_bps: 340,
    tenure_months: 6,
    placed_iso: "2026-05-05",
    maturity_iso: "2026-11-05",
    matured: true,
  },
];