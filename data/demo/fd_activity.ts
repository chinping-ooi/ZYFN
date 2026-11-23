import type { FdActivityRow, MonthKey } from "@/data/types";
import { major_to_minor } from "@/lib/money";

/** Fixed deposit activity lines (demo). */
export const DEMO_FD_ACTIVITY: (FdActivityRow & { bank: string; month: MonthKey })[] = [
  {
    bank: "Maybank",
    month: "2026-10",
    date: "2026-10-10",
    reference: "MBB-002",
    event: "Placement",
    principal_in_sen: major_to_minor(10000),
    principal_out_sen: 0,
    interest_sen: 0,
  },
  {
    bank: "Public Bank",
    month: "2026-11",
    date: "2026-11-05",
    reference: "PBB-002",
    event: "Redemption",
    principal_in_sen: 0,
    principal_out_sen: major_to_minor(5000),
    interest_sen: 0,
  },
  {
    bank: "Public Bank",
    month: "2026-11",
    date: "2026-11-05",
    reference: "PBB-002",
    event: "Interest received",
    principal_in_sen: 0,
    principal_out_sen: 0,
    interest_sen: major_to_minor(85),
  },
];

export function demo_fd_activity_for_bank(
  bank: string,
  month: MonthKey,
): FdActivityRow[] {
  return DEMO_FD_ACTIVITY.filter((row) => row.bank === bank && row.month === month);
}